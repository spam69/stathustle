import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PostModel from '@/models/Post.model';
import UserModel from '@/models/User.model';
import IdentityModel from '@/models/Identity.model';
import CommentModel from '@/models/Comment.model';
import type { Post as PostType, User as UserType, Identity as IdentityType, Comment as CommentClientType, ReactionEntry as ReactionEntryClientType } from '@/types';
import mongoose from 'mongoose';

// Helper function to transform author data
const transformAuthor = (authorDoc: any): UserType | IdentityType | undefined => {
  if (!authorDoc) return undefined;
  return {
    ...authorDoc, 
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
    author: transformAuthor(commentDoc.author), 
    detailedReactions: commentDoc.detailedReactions?.map(transformReaction) || [],
    createdAt: commentDoc.createdAt?.toISOString(),
    mediaUrl: commentDoc.mediaUrl,
    mediaType: commentDoc.mediaType,
  };
};

// Helper function to transform a single post
const transformPost = (postDoc: any): PostType => {
  if (!postDoc) {
    console.error("transformPost called with null or undefined postDoc");
  }

  let sharedOriginalPostTransformed: PostType | undefined = undefined;
  let sharedOriginalPostIdString: string | undefined = undefined;

  if (postDoc.sharedOriginalPostId) {
    const sharedData = postDoc.sharedOriginalPostId; 
    if (sharedData && sharedData._id) {
      sharedOriginalPostIdString = sharedData._id.toString();
      sharedOriginalPostTransformed = {
        ...sharedData,
        id: sharedOriginalPostIdString,
        author: transformAuthor(sharedData.author), 
        detailedReactions: sharedData.detailedReactions?.map(transformReaction) || [],
        comments: (sharedData.comments || []).map(transformComment), 
        repliesCount: sharedData.repliesCount || 0,
        content: sharedData.content || "",
        createdAt: sharedData.createdAt?.toISOString(),
        shares: sharedData.shares || 0,
        mediaUrl: sharedData.mediaUrl,
        mediaType: sharedData.mediaType,
        blogShareDetails: sharedData.blogShareDetails,
      };
    } else if (sharedData) { 
        sharedOriginalPostIdString = sharedData.toString();
    }
  }

  return {
    ...postDoc,
    id: postDoc._id.toString(),
    author: transformAuthor(postDoc.author), 
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
    const { postId } = await params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json({ message: 'Invalid Post ID format' }, { status: 400 });
    }

    const post = await PostModel.findById(postId)
      .populate({
        path: 'author', 
      })
      .populate({
        path: 'sharedOriginalPostId',
        populate: {
          path: 'author', 
        }
      })
      .populate({
        path: 'comments',
        populate: {
          path: 'author', 
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

export async function PUT(
  request: Request,
  { params }: { params: { postId: string } }
) {
  await dbConnect();
  try {
    const { postId } = await params;
    const body = await request.json();
    const { content, mediaUrl, mediaType, tags } = body;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json({ message: 'Invalid Post ID format' }, { status: 400 });
    }

    // TODO: Get authenticated user ID from session/token
    const authenticatedUserId = "mock-user-id-for-update-placeholder"; // Replace with actual auth logic

    const post = await PostModel.findById(postId);

    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    // --- Authorization Check (Placeholder) ---
    // In a real app, you'd compare post.author._id.toString() with the authenticatedUserId
    if (post.author.toString() !== authenticatedUserId) {
      // This is a placeholder check. Real check needed.
      // For testing, you might comment this out or adjust mockAuthenticatedUserId.
      // return NextResponse.json({ message: 'Unauthorized to update this post' }, { status: 403 });
      console.warn(`[API/POSTS/${postId} PUT] Bypassing auth check for mock user.`);
    }
    // --- End Authorization Check ---

    if (content !== undefined) {
      post.content = content;
    }
    if (tags !== undefined) {
      post.tags = Array.isArray(tags) ? tags.map(tag => String(tag).trim()) : [];
    }

    // Handle media update/removal
    if (mediaUrl === null || mediaUrl === "") { // Explicitly removing media
      post.mediaUrl = undefined;
      post.mediaType = undefined;
    } else if (mediaUrl !== undefined) { // Updating or adding media
      post.mediaUrl = mediaUrl;
      if (mediaType === 'image' || mediaType === 'gif') {
        post.mediaType = mediaType;
      } else if (mediaUrl) { 
        // If mediaUrl is provided but mediaType is not, or invalid, try to infer or default
        // For simplicity, we'll require mediaType if mediaUrl is set.
        // Or, you could default or try to infer. Here, we just set it if valid.
        // If mediaType is missing with a new mediaUrl, it might lead to issues.
        // For now, if mediaType is not 'image' or 'gif', it will be undefined if mediaUrl is new.
        // A better approach is to require mediaType if mediaUrl is set.
        // This part can be refined based on how strict media type handling should be.
         post.mediaType = undefined; // Or throw error if mediaType is required with mediaUrl
      }
    }
    
    const updatedPost = await post.save();

    // Re-populate for consistent response structure
    const populatedPost = await PostModel.findById(updatedPost._id)
      .populate('author')
      .populate({
        path: 'sharedOriginalPostId',
        populate: { path: 'author' }
      })
      .populate({
        path: 'comments',
        populate: { path: 'author' }
      })
      .lean();
    
    if (!populatedPost) {
        return NextResponse.json({ message: 'Post updated, but failed to retrieve fully for response.' }, { status: 200 });
    }

    return NextResponse.json(transformPost(populatedPost));

  } catch (error: any) {
    console.error(`[API/POSTS/${params.postId} PUT] Error updating post:`, error);
    if (error.name === 'ValidationError') {
      return NextResponse.json({ message: 'Validation Error', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: error.message || 'An unexpected error occurred while updating the post.' }, { status: 500 });
  }
}


export async function DELETE(
  request: Request,
  { params }: { params: { postId: string } }
) {
  await dbConnect();
  try {
    const { postId } = await params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json({ message: 'Invalid Post ID format' }, { status: 400 });
    }

    // TODO: Get authenticated user ID from session/token
    const authenticatedUserId = "mock-user-id-for-delete-placeholder"; // Replace with actual auth logic

    const post = await PostModel.findById(postId);

    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    // --- Authorization Check (Placeholder) ---
    // In a real app, you'd compare post.author._id.toString() with the authenticatedUserId
    if (post.author.toString() !== authenticatedUserId) {
       // This is a placeholder check. Real check needed.
      // For testing, you might comment this out or adjust mockAuthenticatedUserId.
      // return NextResponse.json({ message: 'Unauthorized to delete this post' }, { status: 403 });
       console.warn(`[API/POSTS/${postId} DELETE] Bypassing auth check for mock user.`);
    }
    // --- End Authorization Check ---

    // Delete associated comments
    if (post.comments && post.comments.length > 0) {
      await CommentModel.deleteMany({ _id: { $in: post.comments } });
    }

    // Delete the post
    await PostModel.findByIdAndDelete(postId);
    
    // TODO: Optionally, find posts that shared this post and update their sharedOriginalPostId to null or handle as desired.

    return NextResponse.json({ message: 'Post deleted successfully' }, { status: 200 });

  } catch (error: any) {
    console.error(`[API/POSTS/${params.postId} DELETE] Error deleting post:`, error);
    return NextResponse.json({ message: error.message || 'An unexpected error occurred while deleting the post.' }, { status: 500 });
  }
}

