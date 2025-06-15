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
  // If authorRef is a full user object, extract _id and log a warning
  if (typeof authorRef === 'object' && authorRef.username && authorRef._id) {
    console.warn('transformClientAuthor received a full user object, extracting _id:', authorRef);
    authorRef = authorRef._id;
  } else if (typeof authorRef === 'object' && authorRef.username && !authorRef._id && authorRef.id) {
    // Sometimes the id field is used instead of _id
    console.warn('transformClientAuthor received a full user object with id, extracting id:', authorRef);
    authorRef = authorRef.id;
  }
  const Model = authorModelType === 'User' ? UserModel : IdentityModel;
  const authorIdToFetch = (authorRef && authorRef._id) ? authorRef._id : authorRef;
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
    if (!commentDoc._id) {
        console.warn('[transformClientComment] Missing _id in commentDoc:', commentDoc);
        return null;
    }
    if (!commentDoc.content) {
        console.warn('[transformClientComment] Missing content in commentDoc:', commentDoc);
        return null;
    }
    if (!commentDoc.createdAt) {
        console.warn('[transformClientComment] Missing createdAt in commentDoc:', commentDoc);
        return null;
    }
    const author = await transformClientAuthor(commentDoc.author, commentDoc.authorModel);
    if (!author) {
        console.warn(`[API/REACT_COMMENT] Failed to transform author for comment ${commentDoc._id}. AuthorRef:`, commentDoc.author, `AuthorModel:`, commentDoc.authorModel);
        return null;
    }

    return {
        id: commentDoc._id.toString(),
        author,
        content: commentDoc.content,
        createdAt: (typeof commentDoc.createdAt === 'string' ? commentDoc.createdAt : commentDoc.createdAt.toISOString()),
        parentId: commentDoc.parentId?.toString(),
        detailedReactions: (commentDoc.detailedReactions || []).map((r: any) => ({
            userId: r.userId?.toString(),
            reactionType: r.reactionType,
            createdAt: r.createdAt ? (typeof r.createdAt === 'string' ? r.createdAt : r.createdAt.toISOString()) : undefined,
        })),
    };
};

function sanitizeCommentAuthor(comment: any) {
  if (comment && comment.author && typeof comment.author === 'object' && comment.author._id) {
    comment.author = comment.author._id;
  }
  return comment;
}

// Helper to transform the entire post for client consumption
const transformPostForClient = async (postDoc: any): Promise<PostType | null> => {
  if (!postDoc) return null;
  const postAuthor = await transformClientAuthor(postDoc.author, postDoc.authorModel);
  if (!postAuthor) {
    console.error(`[API/REACT_COMMENT] Post author could not be transformed for post ${postDoc._id}. AuthorRef:`, postDoc.author, `AuthorModel:`, postDoc.authorModel);
    return null; // Or handle as appropriate
  }

  const clientComments = await Promise.all(
      (postDoc.comments || []).map(async (c: any) => {
        let commentObj = c && c.toObject ? c.toObject() : { ...c };
        commentObj = sanitizeCommentAuthor(commentObj);
        return await transformClientComment(commentObj);
      })
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
  context: { params: Promise<{ postId: string; commentId: string }> }
) {
  await dbConnect();
  let postId: string | undefined;
  let commentId: string | undefined;
  try {
    ({ postId, commentId } = await context.params);
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
         
         // Determine recipientId and recipientModel: if Identity, use owner; if User, use _id
         let recipientId: string | undefined;
         let recipientModel: 'User' | 'Identity' | undefined;
         if (comment.authorModel === 'Identity') {
           let identity = commentAuthorObject;
           // If owner is not populated, fetch the identity with owner populated
           if (!identity.owner || (!identity.owner._id && typeof identity.owner !== 'string')) {
             const populatedIdentity = await IdentityModel.findById(identity._id).populate('owner').lean();
             if (populatedIdentity && populatedIdentity.owner) {
               identity = populatedIdentity;
             }
           }
           if (identity.owner) {
             if (typeof identity.owner === 'object' && identity.owner._id) {
               recipientId = identity.owner._id.toString();
               recipientModel = 'User';
             } else if (typeof identity.owner === 'string') {
               recipientId = identity.owner;
               recipientModel = 'User';
             }
           }
         } else if (comment.authorModel === 'User' && commentAuthorObject._id) {
           recipientId = commentAuthorObject._id.toString();
           recipientModel = 'User';
         }
         
         let commentObj = comment.toObject();
         commentObj = sanitizeCommentAuthor(commentObj);
         const clientCommentForNotification = await transformClientComment(commentObj);
         if (clientCommentForNotification && postAuthorObject?._id && recipientId && recipientModel && recipientId !== reactingUser.id.toString()) {
            const transformedPostAuthor = await transformClientAuthor(post.author, post.authorModel);
            const notificationPost = {
              ...post.toObject(),
              id: post._id.toString(),
              author: transformedPostAuthor
            };
            createNotification(
                'new_reaction_comment',
                reactingUser,
                recipientId,
                recipientModel,
                notificationPost,
                clientCommentForNotification
            );
         } else {
           console.warn(`[API/REACT_COMMENT] Notification for comment reaction skipped. Missing data. CommentAuthor:`, commentAuthorObject, `PostAuthor:`, postAuthorObject, `ClientComment:`, clientCommentForNotification, `RecipientId:`, recipientId, `RecipientModel:`, recipientModel)
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
    console.error(`[API/POSTS/.../REACT_COMMENT] Error for post ${postId}, comment ${commentId}:`, error.message, error.stack);
    return NextResponse.json({ message: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
