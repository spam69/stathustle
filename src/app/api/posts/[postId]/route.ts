
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PostModel from '@/models/Post.model';
import UserModel from '@/models/User.model';
import IdentityModel from '@/models/Identity.model';
import CommentModel from '@/models/Comment.model';
import type { Post as PostType, User as UserType, Identity as IdentityType, Comment as CommentClientType, ReactionEntry as ReactionEntryClientType } from '@/types';

// Helper function to transform author data
const transformAuthor = (authorDoc: any): UserType | IdentityType | undefined => {
  if (!authorDoc) return undefined;
  // If authorDoc is already populated (object with _id), use its fields.
  // If it's just an ObjectId string (should not happen with proper populate), this won't work well.
  return {
    ...authorDoc, // Spread the lean object
    id: authorDoc._id?.toString(),
    username: authorDoc.username,
    profilePictureUrl: authorDoc.profilePictureUrl,
    isIdentity: authorDoc.isIdentity || false,
    displayName: authorDoc.displayName,
  };
};

// Helper function to transform reaction entries
const transformReaction = (reactionDoc: any): ReactionEntryClientType => ({
  ...reactionDoc,
  userId: reactionDoc.userId?.toString(),
  createdAt: reactionDoc.createdAt?.toISOString(),
});

// Helper function to transform comment data
const transformComment = (commentDoc: any): CommentClientType | undefined => {
  if (!commentDoc) return undefined;
  return {
    ...commentDoc,
    id: commentDoc._id?.toString(),
    author: transformAuthor(commentDoc.author), // author should be populated by the query
    detailedReactions: commentDoc.detailedReactions?.map(transformReaction) || [],
    createdAt: commentDoc.createdAt?.toISOString(),
  };
};

// Helper function to transform a single post
const transformPost = (postDoc: any): PostType => {
  if (!postDoc) {
    // This case should ideally be handled before calling transformPost,
    // e.g., by returning 404 if postDoc is null.
    // However, to satisfy PostType, we return a structure that indicates an issue.
    console.error("transformPost called with null or undefined postDoc");
    // Fallback or throw error, depending on desired behavior for "not found"
    // For now, let's assume this function is only called with a valid document.
    // If it can be null, the return type should be PostType | null.
  }

  let sharedOriginalPostTransformed: PostType | undefined = undefined;
  let sharedOriginalPostIdString: string | undefined = undefined;

  if (postDoc.sharedOriginalPostId) {
    const sharedData = postDoc.sharedOriginalPostId; // This is the populated object from .lean()
    if (sharedData && sharedData._id) {
      sharedOriginalPostIdString = sharedData._id.toString();
      sharedOriginalPostTransformed = {
        ...sharedData,
        id: sharedOriginalPostIdString,
        author: transformAuthor(sharedData.author), // Author of shared post should be populated
        detailedReactions: sharedData.detailedReactions?.map(transformReaction) || [],
        comments: (sharedData.comments || []).map(transformComment), // Transform comments of shared post if populated
        repliesCount: sharedData.repliesCount || 0,
        content: sharedData.content || "",
        createdAt: sharedData.createdAt?.toISOString(),
        shares: sharedData.shares || 0,
        mediaUrl: sharedData.mediaUrl,
        mediaType: sharedData.mediaType,
        blogShareDetails: sharedData.blogShareDetails,
      };
    } else if (sharedData) { // Is an ObjectId string
        sharedOriginalPostIdString = sharedData.toString();
    }
  }

  return {
    ...postDoc,
    id: postDoc._id.toString(),
    author: transformAuthor(postDoc.author), // Author of main post should be populated
    comments: postDoc.comments?.map(transformComment) || [],
    detailedReactions: postDoc.detailedReactions?.map(transformReaction) || [],
    sharedOriginalPostId: sharedOriginalPostIdString,
    sharedOriginalPost: sharedOriginalPostTransformed,
    createdAt: postDoc.createdAt?.toISOString(),
    content: postDoc.content || "",
    shares: postDoc.shares || 0,
    repliesCount: postDoc.repliesCount || 0,
    blogShareDetails: postDoc.blogShareDetails,
    mediaUrl: postDoc.mediaUrl,
    mediaType: postDoc.mediaType,
    teamSnapshot: postDoc.teamSnapshot,
    tags: postDoc.tags,
  };
};


export async function GET(
  request: Request,
  { params }: { params: { postId: string } }
) {
  await dbConnect();
  try {
    const { postId } = params;

    if (!postId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ message: 'Invalid Post ID format' }, { status: 400 });
    }

    const post = await PostModel.findById(postId)
      .populate({
        path: 'author', // Populates author based on authorModel
      })
      .populate({
        path: 'sharedOriginalPostId',
        populate: {
          path: 'author', // Populates author of shared post
          // Populate comments of shared post if needed, and their authors
          // populate: { path: 'comments', populate: { path: 'author' }} // Example for deeper nesting
        }
      })
      .populate({
        path: 'comments',
        populate: {
          path: 'author', // Populates author of comments
        }
      })
      .lean();

    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }
    
    return NextResponse.json(transformPost(post));

  } catch (error: any) {
    console.error(`[API/POSTS/${params.postId} GET] Error fetching post:`, error, error.stack);
    return NextResponse.json({ message: error.message || 'An unexpected error occurred while fetching the post.' }, { status: 500 });
  }
}
