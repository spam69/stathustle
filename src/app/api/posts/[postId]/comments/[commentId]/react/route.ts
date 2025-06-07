
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PostModel from '@/models/Post.model';
import CommentModel from '@/models/Comment.model';
import UserModel from '@/models/User.model';
import IdentityModel from '@/models/Identity.model';
import { createNotification } from '@/lib/mock-data';
import type { ReactionEntry, User as UserType, Identity as IdentityType, Post as PostType, Comment as CommentType } from '@/types';
import type { ReactionType } from '@/lib/reactions';
import { mockAdminUser } from '@/lib/mock-data'; // Placeholder
import mongoose from 'mongoose';

// Helper to transform populated post to client-side PostType
// This is a simplified version for context, main post transformation is complex
const transformCommentAuthor = async (authorRef: any, authorModelType: 'User' | 'Identity'): Promise<UserType | IdentityType | undefined> => {
  if (!authorRef) return undefined;
  const Model = authorModelType === 'User' ? UserModel : IdentityModel;
  const author = await Model.findById(authorRef._id || authorRef).lean();
  if (!author) return undefined;
  return {
    ...author,
    id: author._id.toString(),
    isIdentity: authorModelType === 'Identity',
  } as UserType | IdentityType;
};

const transformClientComment = async (commentDoc: any): Promise<CommentType | null> => {
    if (!commentDoc) return null;
    const author = await transformCommentAuthor(commentDoc.author, commentDoc.authorModel);
    if (!author) return null;

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


export async function POST(
  request: Request,
  { params }: { params: { postId: string; commentId: string } }
) {
  await dbConnect();
  try {
    const { postId, commentId } = params;
    const { reactionType } = (await request.json()) as { reactionType: ReactionType | null };
    
    // --- Placeholder for authenticated user ---
    const reactingUserId = mockAdminUser.id; 
     if (!reactingUserId) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
    }
    // --- End Placeholder ---

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json({ message: 'Invalid Post ID format' }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return NextResponse.json({ message: 'Invalid Comment ID format' }, { status: 400 });
    }

    const comment = await CommentModel.findById(commentId).populate('author');
    if (!comment) {
      return NextResponse.json({ message: 'Comment not found' }, { status: 404 });
    }
    
    const post = await PostModel.findById(postId).populate('author'); // For notification context & returning updated post
    if (!post) {
      return NextResponse.json({ message: 'Parent post not found' }, { status: 404 });
    }

    // Fetch the reacting user/identity from DB
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

    if (reactionType === null) { // Unreact
      if (existingReactionIndex !== -1) {
        comment.detailedReactions.splice(existingReactionIndex, 1);
      }
    } else { // React or change reaction
      if (existingReactionIndex !== -1) {
        if (comment.detailedReactions[existingReactionIndex].reactionType === reactionType) { // Clicked same
          comment.detailedReactions.splice(existingReactionIndex, 1);
        } else { // Changed
          comment.detailedReactions[existingReactionIndex].reactionType = reactionType;
          comment.detailedReactions[existingReactionIndex].createdAt = new Date();
        }
      } else { // New
        comment.detailedReactions.push({
          userId: reactingUserDoc._id, // Store ObjectId
          reactionType,
          createdAt: new Date(),
        });
      }
    }
    await comment.save();

    // Notification logic
    // comment.author is populated from CommentModel.findById().populate('author')
    // Ensure comment.author has _id (it should if populated correctly)
    if (comment.author && comment.author._id && reactingUser.id.toString() !== comment.author._id.toString()) {
      if (reactionType && reactionType !== previousReactionType) {
         const commentAuthorObject = comment.author.toObject ? comment.author.toObject() : comment.author;
         const postAuthorObject = post.author.toObject ? post.author.toObject() : post.author;
         
         // Transform comment for notification
         const clientCommentForNotification = await transformClientComment(comment.toObject());
         if (clientCommentForNotification) {
            createNotification(
                'new_reaction_comment',
                reactingUser,
                commentAuthorObject._id.toString(),
                { ...post.toObject(), id: post._id.toString(), author: postAuthorObject } as PostType,
                clientCommentForNotification
            );
         }
      }
    }

    // Fetch the updated post to return, ensuring the comment changes are reflected
    const updatedPost = await PostModel.findById(postId)
      .populate({ 
        path: 'author', 
        // model: post.authorModel === 'User' ? UserModel : IdentityModel // Relies on authorModel on Post
      })
      .populate({
        path: 'comments',
        populate: { 
          path: 'author', 
          // model: CommentModel uses its own refPath 'authorModel'
        }
      })
      .populate({
        path: 'sharedOriginalPostId',
        populate: { 
          path: 'author', 
          // model: PostModel uses its own refPath 'authorModel' for shared posts
        }
      })
      .lean();
    
    // This part is complex due to needing to re-transform the entire post structure for the client.
    // For simplicity of this API, we are relying on the client's cache invalidation and refetch of the post
    // to get the most up-to-date comment reactions.
    // However, a more robust API would return the fully transformed post.
    // For now, let's construct a simplified version of the updated post for return.

    if (!updatedPost) {
        return NextResponse.json({ message: 'Failed to retrieve updated post.' }, { status: 500 });
    }
    
    const clientPostAuthor = await transformCommentAuthor(updatedPost.author, updatedPost.authorModel);
    if (!clientPostAuthor) return NextResponse.json({ message: 'Failed to process post author.' }, { status: 500 });

    const clientComments = await Promise.all(
        (updatedPost.comments || []).map(async (c: any) => await transformClientComment(c))
    );

    const finalPostForClient: PostType = {
        ...updatedPost,
        id: updatedPost._id.toString(),
        author: clientPostAuthor,
        comments: clientComments.filter(c => c !== null) as CommentType[],
        detailedReactions: (updatedPost.detailedReactions || []).map((r: any) => ({
            userId: r.userId?.toString(),
            reactionType: r.reactionType,
            createdAt: r.createdAt?.toISOString(),
        })),
        createdAt: updatedPost.createdAt.toISOString(),
        // Handle sharedOriginalPost if present
        sharedOriginalPostId: updatedPost.sharedOriginalPostId?._id?.toString(),
        // sharedOriginalPost: (if populated, would need similar transformation)
    };
    
    return NextResponse.json(finalPostForClient);

  } catch (error: any) {
    console.error(`[API/POSTS/.../REACT_COMMENT] Error for post ${params.postId}, comment ${params.commentId}:`, error.message, error.stack);
    return NextResponse.json({ message: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
