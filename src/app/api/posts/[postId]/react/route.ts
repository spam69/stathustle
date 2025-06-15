import { NextResponse, type NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PostModel from '@/models/Post.model';
import UserModel from '@/models/User.model';
import IdentityModel from '@/models/Identity.model';
import { createNotification } from '@/lib/notifications';
import type { ReactionEntry, User as UserType, Identity as IdentityType, Post as PostType } from '@/types';
import type { ReactionType } from '@/lib/reactions';
import mongoose from 'mongoose';

// Helper to transform populated post to client-side PostType
const transformPostForClient = async (postDoc: any): Promise<PostType | null> => {
  if (!postDoc) return null;

  const transformAuthor = async (authorRef: any, authorModelType: 'User' | 'Identity'): Promise<UserType | IdentityType | undefined> => {
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
      // Ensure all required fields for UserType/IdentityType are present or defaulted
      username: author.username || 'Unknown',
      profilePictureUrl: author.profilePictureUrl,
      displayName: author.displayName,
    } as UserType | IdentityType;
  };

  const transformReaction = (reactionDoc: any): ReactionEntry => ({
    userId: reactionDoc.userId?.toString(),
    reactionType: reactionDoc.reactionType,
    createdAt: reactionDoc.createdAt?.toISOString(),
  });

  const author = await transformAuthor(postDoc.author, postDoc.authorModel);
  if (!author) {
    console.error(`[API/POSTS/${postDoc._id}/REACT] Post author could not be transformed. AuthorRef:`, postDoc.author, `AuthorModel:`, postDoc.authorModel);
    return null; 
  }

  let sharedOriginalPostTransformed: PostType | undefined = undefined;
  if (postDoc.sharedOriginalPostId && typeof postDoc.sharedOriginalPostId === 'object' && postDoc.sharedOriginalPostId !== null) {
    // If sharedOriginalPostId is already a populated object (due to .populate().lean())
    const sharedPostDoc = postDoc.sharedOriginalPostId;
    const sharedAuthor = await transformAuthor(sharedPostDoc.author, sharedPostDoc.authorModel);
    if (sharedAuthor) {
      sharedOriginalPostTransformed = {
        ...sharedPostDoc,
        id: sharedPostDoc._id.toString(),
        author: sharedAuthor,
        detailedReactions: (sharedPostDoc.detailedReactions || []).map(transformReaction),
        comments: [], 
        createdAt: sharedPostDoc.createdAt?.toISOString(),
        content: sharedPostDoc.content,
        shares: sharedPostDoc.shares,
        repliesCount: sharedPostDoc.repliesCount,
        mediaUrl: sharedPostDoc.mediaUrl,
        mediaType: sharedPostDoc.mediaType,
        blogShareDetails: sharedPostDoc.blogShareDetails,
      };
    }
  } else if (postDoc.sharedOriginalPostId) {
     // If it's just an ID, it won't be transformed here, client might need to fetch or it's pre-populated
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
    comments: [], 
    sharedOriginalPostId: postDoc.sharedOriginalPostId?._id?.toString() || postDoc.sharedOriginalPostId?.toString(),
    sharedOriginalPost: sharedOriginalPostTransformed,
    blogShareDetails: postDoc.blogShareDetails,
  };
};


export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  await dbConnect();
  try {
    const { postId } = await params;
    const { reactionType, userId: reactingUserId } = (await request.json()) as { reactionType: ReactionType | null, userId: string };
    
    if (!reactingUserId) {
      return NextResponse.json({ message: 'User ID is required to react.' }, { status: 400 });
    }
    
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json({ message: 'Invalid Post ID format' }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(reactingUserId)) {
      return NextResponse.json({ message: 'Invalid User ID format for reactor' }, { status: 400 });
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
    // Ensure reactingUserDoc has an id string property for comparison and notification
    const reactingUser = { ...reactingUserDoc, id: reactingUserDoc._id.toString() } as UserType | IdentityType;


    if (!post.detailedReactions) {
      post.detailedReactions = [];
    }

    const existingReactionIndex = post.detailedReactions.findIndex(
      r => r.userId.toString() === reactingUser.id 
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
          userId: reactingUserDoc._id, 
          reactionType,
          createdAt: new Date(),
        });
      }
    }

    await post.save();

    // Notification logic
    if (post.author && post.author._id && reactingUser.id.toString() !== post.author._id.toString()) {
      if (reactionType && reactionType !== previousReactionType) {
        // Ensure post.author is an object with _id, not just an ObjectId string after lean().
        // If populated correctly, post.author is an object.
        const postAuthorObject = post.author.toObject ? post.author.toObject() : post.author;
        // Ensure all required fields for notification
        const notificationAuthor = {
          id: postAuthorObject._id?.toString() || postAuthorObject.id,
          username: postAuthorObject.username || 'Unknown',
          displayName: postAuthorObject.displayName || postAuthorObject.username || 'Unknown',
          profilePictureUrl: postAuthorObject.profilePictureUrl || '',
          isIdentity: postAuthorObject.isIdentity || false,
          email: postAuthorObject.email,
          owner: postAuthorObject.owner,
          teamMembers: postAuthorObject.teamMembers || [],
          socialLinks: postAuthorObject.socialLinks || [],
          themePreference: postAuthorObject.themePreference,
          bio: postAuthorObject.bio,
        };
        if (notificationAuthor && notificationAuthor.id) {
            createNotification(
                'new_reaction_post', 
                reactingUser, 
                notificationAuthor.id, 
                notificationAuthor.isIdentity ? 'Identity' : 'User',
                { ...post.toObject(), id: post._id.toString(), author: notificationAuthor } as PostType
            );
        } else {
            console.warn(`[API/POSTS/${postId}/REACT] Post author data incomplete for notification. Author:`, post.author);
        }
      }
    }
    
    // Re-fetch the post to get all populations correctly for the client transformation
    const updatedPostFromDB = await PostModel.findById(postId)
      .populate({ path: 'author' })
      .populate({ path: 'sharedOriginalPostId', populate: { path: 'author' }})
      // Comments are not directly returned with post reactions, client usually refetches if needed or updates local state
      .lean();

    if(!updatedPostFromDB){
        return NextResponse.json({ message: 'Error processing post after reaction: Post not found after save.' }, { status: 500 });
    }
    
    const clientPost = await transformPostForClient(updatedPostFromDB);
    if (!clientPost) {
        return NextResponse.json({ message: 'Error processing post after reaction: Transformation failed.' }, { status: 500 });
    }
    return NextResponse.json(clientPost);

  } catch (error: any) {
    console.error(`[API/POSTS/${params.postId}/REACT] Error:`, error.message, error.stack);
    return NextResponse.json({ message: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
