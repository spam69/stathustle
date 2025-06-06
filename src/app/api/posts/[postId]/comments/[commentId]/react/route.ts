
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

export async function POST(
  request: Request,
  { params }: { params: { postId: string; commentId: string } }
) {
  await dbConnect();
  try {
    const { postId, commentId } = params;
    const { reactionType } = (await request.json()) as { reactionType: ReactionType | null };
    
    const reactingUserId = mockAdminUser.id; // Placeholder

    if (!postId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ message: 'Invalid Post ID format' }, { status: 400 });
    }
    if (!commentId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ message: 'Invalid Comment ID format' }, { status: 400 });
    }

    const comment = await CommentModel.findById(commentId).populate('author');
    if (!comment) {
      return NextResponse.json({ message: 'Comment not found' }, { status: 404 });
    }
    
    const post = await PostModel.findById(postId).populate('author'); // For notification context
    if (!post) {
      return NextResponse.json({ message: 'Parent post not found' }, { status: 404 });
    }

    let reactingUserDoc = await UserModel.findById(reactingUserId).lean() || await IdentityModel.findById(reactingUserId).lean();
    if (!reactingUserDoc) {
      return NextResponse.json({ message: 'Reacting user not found' }, { status: 404 });
    }

    if (!comment.detailedReactions) {
      comment.detailedReactions = [];
    }

    const existingReactionIndex = comment.detailedReactions.findIndex(
      r => r.userId.toString() === reactingUserId
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
        } as unknown as ReactionEntry); // Cast for ReactionEntry if type expects string ID
      }
    }
    await comment.save();

    // Notification logic
    if (comment.author && reactingUserDoc._id.toString() !== comment.author._id.toString()) {
      if (reactionType && reactionType !== previousReactionType) {
         const commentAuthorDoc = comment.author; // Assumes author was populated on comment
         createNotification(
            'new_reaction_comment',
            reactingUserDoc as UserType | IdentityType,
            commentAuthorDoc._id.toString(),
            post.toObject({ virtuals: true }) as PostType, // Pass post for context
            comment.toObject({ virtuals: true }) as CommentType
         );
      }
    }

    // Fetch the updated post to return, ensuring the comment changes are reflected
    const updatedPost = await PostModel.findById(postId)
      .populate({ path: 'author' /* dynamic via refPath */ })
      .populate({
        path: 'comments',
        populate: { path: 'author' /* dynamic via refPath */, model: UserModel /* temp default, need dynamic */ }
      })
      .populate({
        path: 'sharedOriginalPostId',
        populate: { path: 'author' /* dynamic via refPath */ }
      })
      .lean();
    
    if (updatedPost && updatedPost.author && updatedPost.authorModel) {
        const AuthorModel = updatedPost.authorModel === 'User' ? UserModel : IdentityModel;
        updatedPost.author = await AuthorModel.findById(updatedPost.author._id).lean() as UserType | IdentityType;
    }
    if (updatedPost && updatedPost.sharedOriginalPostId && updatedPost.sharedOriginalPostId.author && updatedPost.sharedOriginalPostId.authorModel) {
        const SharedAuthorModel = updatedPost.sharedOriginalPostId.authorModel === 'User' ? UserModel : IdentityModel;
        updatedPost.sharedOriginalPostId.author = await SharedAuthorModel.findById(updatedPost.sharedOriginalPostId.author._id).lean() as UserType | IdentityType;
    }
    if (updatedPost && updatedPost.comments) {
        for (const c of updatedPost.comments as any[]) {
            if (c.author && c.authorModel) {
                const CommentAuthorModel = c.authorModel === 'User' ? UserModel : IdentityModel;
                c.author = await CommentAuthorModel.findById(c.author._id).lean() as UserType | IdentityType;
            }
        }
    }
    
    return NextResponse.json({ ...updatedPost, id: updatedPost?._id.toString() });

  } catch (error: any) {
    console.error(`React to Comment API error for post ${params.postId}, comment ${params.commentId}:`, error);
    return NextResponse.json({ message: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
