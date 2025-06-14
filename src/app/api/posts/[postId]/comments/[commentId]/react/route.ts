import { NextResponse, type NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PostModel from '@/models/Post.model';
import CommentModel from '@/models/Comment.model';
import UserModel from '@/models/User.model';
import IdentityModel from '@/models/Identity.model';
import { createNotification } from '@/lib/notifications';
import type { ReactionEntry, User as UserType, Identity as IdentityType, Post as PostType, Comment as CommentTypeClient } from '@/types';
import type { ReactionType } from '@/lib/reactions';
import mongoose from 'mongoose';

// Helper to transform author for client consumption
const transformClientAuthor = async (authorRef: any, authorModelType: 'User' | 'Identity'): Promise<UserType | IdentityType | undefined> => {
  if (!authorRef) return undefined;
  const Model = authorModelType === 'User' ? UserModel : IdentityModel;
  // Ensure authorRef itself is not already the final object due to .lean() on parent and direct assignment
  const authorIdToFetch = authorRef._id || authorRef;
  const author = await Model.findById(authorIdToFetch).lean();
  if (!author) return undefined;
  return {
    ...author,
    id: author._id.toString(),
    isIdentity: authorModelType === 'Identity',
    username: author.username || 'Unknown',
    profilePictureUrl: author.profilePictureUrl,
    displayName: author.displayName,
  } as UserType | IdentityType;
};

// Helper to transform comment for client consumption
const transformClientComment = async (commentDoc: any): Promise<CommentTypeClient | null> => {
    if (!commentDoc) return null;
    const author = await transformClientAuthor(commentDoc.author, commentDoc.authorModel);
    if (!author) {
        console.warn(`[API/REACT_COMMENT] Failed to transform author for comment ${commentDoc._id}. AuthorRef:`, commentDoc.author, `AuthorModel:`, commentDoc.authorModel);
        return null;
    }

    return {
        id: commentDoc._id.toString(),
        author,
        content: commentDoc.content,
        createdAt: commentDoc.createdAt.toISOString(),
        parentId: commentDoc.parentId?.toString(),
        detailedReactions: (commentDoc.detailedReactions || []).map((r: any) => ({
            userId: r.userId?.toString(),
            reactionType: r.reactionType,
            createdAt: r.createdAt?.toISOString(),
        })),
    };
};

// Helper to transform the entire post for client consumption
const transformPostForClient = async (postDoc: any): Promise<PostType | null> => {
  if (!postDoc) return null;
  const postAuthor = await transformClientAuthor(postDoc.author, postDoc.authorModel);
  if (!postAuthor) {
    console.error(`[API/REACT_COMMENT] Post author could not be transformed for post ${postDoc._id}. AuthorRef:`, postDoc.author, `AuthorModel:`, postDoc.authorModel);
    return null; // Or handle as appropriate
  }

  const clientComments = await Promise.all(
      (postDoc.comments || []).map(async (c: any) => await transformClientComment(c))
  );
  
  let sharedOriginalPostTransformed: PostType | undefined = undefined;
  if (postDoc.sharedOriginalPostId && typeof postDoc.sharedOriginalPostId === 'object' && postDoc.sharedOriginalPostId !== null) {
    const sharedPostDoc = postDoc.sharedOriginalPostId;
    const sharedAuthor = await transformClientAuthor(sharedPostDoc.author, sharedPostDoc.authorModel);
    if (sharedAuthor) {
      sharedOriginalPostTransformed = {
        ...sharedPostDoc,
        id: sharedPostDoc._id.toString(),
        author: sharedAuthor,
        content: sharedPostDoc.content,
        mediaUrl: sharedPostDoc.mediaUrl,
        mediaType: sharedPostDoc.mediaType,
        createdAt: sharedPostDoc.createdAt?.toISOString(),
        detailedReactions: (sharedPostDoc.detailedReactions || []).map((r: any) => ({ userId: r.userId?.toString(), reactionType: r.reactionType, createdAt: r.createdAt?.toISOString() })),
        shares: sharedPostDoc.shares,
        repliesCount: sharedPostDoc.repliesCount,
        comments: [], // Simplified for shared post preview
        blogShareDetails: sharedPostDoc.blogShareDetails,
        tags: sharedPostDoc.tags,
        teamSnapshot: sharedPostDoc.teamSnapshot,
      };
    }
  }

  return {
      ...postDoc,
      id: postDoc._id.toString(),
      author: postAuthor,
      comments: clientComments.filter(c => c !== null) as CommentTypeClient[],
      detailedReactions: (postDoc.detailedReactions || []).map((r: any) => ({
          userId: r.userId?.toString(),
          reactionType: r.reactionType,
          createdAt: r.createdAt?.toISOString(),
      })),
      createdAt: postDoc.createdAt.toISOString(),
      sharedOriginalPostId: postDoc.sharedOriginalPostId?._id?.toString() || postDoc.sharedOriginalPostId?.toString(),
      sharedOriginalPost: sharedOriginalPostTransformed,
  };
};


export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string; commentId: string } }
) {
  await dbConnect();
  try {
    const { postId, commentId } = params;
    const { reactionType, userId: reactingUserId } = (await request.json()) as { reactionType: ReactionType | null, userId: string };
    
    if (!reactingUserId) {
      return NextResponse.json({ message: 'User ID is required to react.' }, { status: 400 });
    }
    
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json({ message: 'Invalid Post ID format' }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return NextResponse.json({ message: 'Invalid Comment ID format' }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(reactingUserId)) {
      return NextResponse.json({ message: 'Invalid User ID format for reactor' }, { status: 400 });
    }

    const comment = await CommentModel.findById(commentId).populate('author');
    if (!comment) {
      return NextResponse.json({ message: 'Comment not found' }, { status: 404 });
    }
    
    const post = await PostModel.findById(postId).populate('author'); 
    if (!post) {
      return NextResponse.json({ message: 'Parent post not found' }, { status: 404 });
    }

    let reactingUserDoc = await UserModel.findById(reactingUserId).lean() || await IdentityModel.findById(reactingUserId).lean();
    if (!reactingUserDoc) {
      return NextResponse.json({ message: 'Reacting user not found' }, { status: 404 });
    }
    const reactingUser = { ...reactingUserDoc, id: reactingUserDoc._id.toString() } as UserType | IdentityType;

    if (!comment.detailedReactions) {
      comment.detailedReactions = [];
    }

    const existingReactionIndex = comment.detailedReactions.findIndex(
      r => r.userId.toString() === reactingUser.id
    );

    let previousReactionType: ReactionType | null = null;
    if (existingReactionIndex !== -1) {
      previousReactionType = comment.detailedReactions[existingReactionIndex].reactionType;
    }

    if (reactionType === null) { 
      if (existingReactionIndex !== -1) {
        comment.detailedReactions.splice(existingReactionIndex, 1);
      }
    } else { 
      if (existingReactionIndex !== -1) {
        if (comment.detailedReactions[existingReactionIndex].reactionType === reactionType) { 
          comment.detailedReactions.splice(existingReactionIndex, 1);
        } else { 
          comment.detailedReactions[existingReactionIndex].reactionType = reactionType;
          comment.detailedReactions[existingReactionIndex].createdAt = new Date();
        }
      } else { 
        comment.detailedReactions.push({
          userId: reactingUserDoc._id, 
          reactionType,
          createdAt: new Date(),
        });
      }
    }
    await comment.save();

    if (comment.author && comment.author._id && reactingUser.id.toString() !== comment.author._id.toString()) {
      if (reactionType && reactionType !== previousReactionType) {
         const commentAuthorObject = comment.author.toObject ? comment.author.toObject() : comment.author;
         const postAuthorObject = post.author.toObject ? post.author.toObject() : post.author;
         
         const clientCommentForNotification = await transformClientComment(comment.toObject());
         if (clientCommentForNotification && postAuthorObject?._id) {
            createNotification(
                'new_reaction_comment',
                reactingUser,
                commentAuthorObject._id.toString(),
                { ...post.toObject(), id: post._id.toString(), author: postAuthorObject } as PostType,
                clientCommentForNotification
            );
         } else {
           console.warn(`[API/REACT_COMMENT] Notification for comment reaction skipped. Missing data. CommentAuthor:`, commentAuthorObject, `PostAuthor:`, postAuthorObject, `ClientComment:`, clientCommentForNotification)
         }
      }
    }

    const updatedPost = await PostModel.findById(postId)
      .populate({ path: 'author' })
      .populate({
        path: 'comments',
        populate: { path: 'author' }
      })
      .populate({
        path: 'sharedOriginalPostId',
        populate: { path: 'author' }
      })
      .lean();
    
    if (!updatedPost) {
        return NextResponse.json({ message: 'Failed to retrieve updated post after comment reaction.' }, { status: 500 });
    }
    
    const finalPostForClient = await transformPostForClient(updatedPost);
     if (!finalPostForClient) {
        return NextResponse.json({ message: 'Error transforming post after comment reaction.' }, { status: 500 });
    }
    
    return NextResponse.json(finalPostForClient);

  } catch (error: any) {
    console.error(`[API/POSTS/.../REACT_COMMENT] Error for post ${params.postId}, comment ${params.commentId}:`, error.message, error.stack);
    return NextResponse.json({ message: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
