
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PostModel from '@/models/Post.model';
import UserModel from '@/models/User.model';
import IdentityModel from '@/models/Identity.model';
import { createNotification } from '@/lib/mock-data';
import type { ReactionEntry, User as UserType, Identity as IdentityType, Post as PostType } from '@/types';
import type { ReactionType } from '@/lib/reactions';
import { mockAdminUser } from '@/lib/mock-data'; // Placeholder for authenticated user
import mongoose from 'mongoose';

// Helper to transform populated post to client-side PostType
const transformPostForClient = async (postDoc: any): Promise<PostType | null> => {
  if (!postDoc) return null;

  const transformAuthor = async (authorRef: any, authorModelType: 'User' | 'Identity'): Promise<UserType | IdentityType | undefined> => {
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

  const transformReaction = (reactionDoc: any): ReactionEntry => ({
    userId: reactionDoc.userId?.toString(),
    reactionType: reactionDoc.reactionType,
    createdAt: reactionDoc.createdAt?.toISOString(),
  });

  const author = await transformAuthor(postDoc.author, postDoc.authorModel);
  if (!author) return null; // Critical: post must have a valid author

  let sharedOriginalPostTransformed: PostType | undefined = undefined;
  if (postDoc.sharedOriginalPostId) {
    const sharedPostDoc = await PostModel.findById(postDoc.sharedOriginalPostId)
      .populate('author') // Relies on authorModel in shared post
      .lean();
    if (sharedPostDoc) {
      const sharedAuthor = await transformAuthor(sharedPostDoc.author, sharedPostDoc.authorModel);
      if (sharedAuthor) {
        sharedOriginalPostTransformed = {
          ...sharedPostDoc,
          id: sharedPostDoc._id.toString(),
          author: sharedAuthor,
          detailedReactions: (sharedPostDoc.detailedReactions || []).map(transformReaction),
          comments: [], // Simplified for shared post preview
          createdAt: sharedPostDoc.createdAt?.toISOString(),
          content: sharedPostDoc.content,
          shares: sharedPostDoc.shares,
          repliesCount: sharedPostDoc.repliesCount,
          mediaUrl: sharedPostDoc.mediaUrl,
          mediaType: sharedPostDoc.mediaType,
          blogShareDetails: sharedPostDoc.blogShareDetails,
        };
      }
    }
  }

  return {
    id: postDoc._id.toString(),
    author,
    content: postDoc.content,
    mediaUrl: postDoc.mediaUrl,
    mediaType: postDoc.mediaType,
    teamSnapshot: postDoc.teamSnapshot,
    tags: postDoc.tags,
    createdAt: postDoc.createdAt?.toISOString(),
    detailedReactions: (postDoc.detailedReactions || []).map(transformReaction),
    shares: postDoc.shares,
    repliesCount: postDoc.repliesCount,
    comments: [], // Comments are typically fetched separately or on demand for feed performance
    sharedOriginalPostId: postDoc.sharedOriginalPostId?.toString(),
    sharedOriginalPost: sharedOriginalPostTransformed,
    blogShareDetails: postDoc.blogShareDetails,
  };
};


export async function POST(
  request: Request,
  { params }: { params: { postId: string } }
) {
  await dbConnect();
  try {
    const { postId } = params;
    const { reactionType } = (await request.json()) as { reactionType: ReactionType | null };
    
    // --- Placeholder for authenticated user ---
    // In a real app, get reactingUserId from session/token
    const reactingUserId = mockAdminUser.id; 
    if (!reactingUserId) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
    }
    // --- End Placeholder ---

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json({ message: 'Invalid Post ID format' }, { status: 400 });
    }

    const post = await PostModel.findById(postId).populate('author'); // Populate author for notification check
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    // Fetch the reacting user/identity from DB
    let reactingUserDoc = await UserModel.findById(reactingUserId).lean() || await IdentityModel.findById(reactingUserId).lean();
    if (!reactingUserDoc) {
      return NextResponse.json({ message: 'Reacting user not found' }, { status: 404 });
    }
    const reactingUser = { ...reactingUserDoc, id: reactingUserDoc._id.toString() } as UserType | IdentityType;


    if (!post.detailedReactions) {
      post.detailedReactions = [];
    }

    const existingReactionIndex = post.detailedReactions.findIndex(
      r => r.userId.toString() === reactingUser.id // Compare with string ID from fetched user
    );

    let previousReactionType: ReactionType | null = null;
    if (existingReactionIndex !== -1) {
      previousReactionType = post.detailedReactions[existingReactionIndex].reactionType;
    }

    if (reactionType === null) { // Unreact
      if (existingReactionIndex !== -1) {
        post.detailedReactions.splice(existingReactionIndex, 1);
      }
    } else { // React or change reaction
      if (existingReactionIndex !== -1) {
        if (post.detailedReactions[existingReactionIndex].reactionType === reactionType) { // Clicked same reaction
          post.detailedReactions.splice(existingReactionIndex, 1);
        } else { // Changed reaction
          post.detailedReactions[existingReactionIndex].reactionType = reactionType;
          post.detailedReactions[existingReactionIndex].createdAt = new Date();
        }
      } else { // New reaction
        post.detailedReactions.push({
          userId: reactingUserDoc._id, // Store ObjectId of the reacting user
          reactionType,
          createdAt: new Date(),
        });
      }
    }

    await post.save();

    // Notification logic
    // The post.author is already populated.
    // Ensure post.author has _id (it should if populated correctly)
    if (post.author && post.author._id && reactingUser.id.toString() !== post.author._id.toString()) {
      if (reactionType && reactionType !== previousReactionType) {
        const postAuthorObject = post.author.toObject ? post.author.toObject() : post.author;
        createNotification(
            'new_reaction_post', 
            reactingUser, 
            postAuthorObject._id.toString(), 
            // To pass PostType, we need to transform the post document
            // For simplicity in notification data, we might only pass essential fields or ID
            { ...post.toObject(), id: post._id.toString(), author: postAuthorObject } as PostType
        );
      }
    }
    
    const clientPost = await transformPostForClient(post);
    if (!clientPost) {
        return NextResponse.json({ message: 'Error processing post after reaction.' }, { status: 500 });
    }
    return NextResponse.json(clientPost);

  } catch (error: any) {
    console.error(`[API/POSTS/${params.postId}/REACT] Error:`, error.message, error.stack);
    return NextResponse.json({ message: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
