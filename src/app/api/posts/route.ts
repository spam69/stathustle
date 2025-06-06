
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import PostModel from '@/models/Post.model';
import UserModel from '@/models/User.model';
import IdentityModel from '@/models/Identity.model';
import CommentModel from '@/models/Comment.model';
import type { Post as PostType, User as UserType, Identity as IdentityType, Comment as CommentClientType, ReactionEntry as ReactionEntryClientType, BlogShareDetails } from '@/types';
import { mockAdminUser } from '@/lib/mock-data';

// Helper function to transform author data
const transformAuthor = (authorData: any): UserType | IdentityType | undefined => {
  if (!authorData) return undefined;
  // Check if it's a populated document (has _id and is an object)
  if (typeof authorData === 'object' && authorData._id) {
    return {
      id: authorData._id.toString(),
      username: authorData.username || 'Unknown User',
      profilePictureUrl: authorData.profilePictureUrl,
      isIdentity: !!authorData.isIdentity,
      displayName: authorData.displayName || authorData.username || 'Unknown Display Name',
    };
  }
  // If it's just an ObjectId string or Mongoose ObjectId type, population likely failed.
  // console.warn(`[transformAuthor] Received unpopulated or malformed author data: ${JSON.stringify(authorData)}`);
  return undefined;
};

// Helper function to transform reaction entries
const transformReaction = (reactionDoc: any): ReactionEntryClientType => ({
  userId: reactionDoc.userId?.toString(),
  reactionType: reactionDoc.reactionType,
  createdAt: reactionDoc.createdAt?.toISOString(),
});

// Helper function to transform comment data
const transformComment = (commentData: any): CommentClientType | undefined => {
  if (!commentData) return undefined;
  if (typeof commentData === 'object' && commentData._id) {
    return {
      id: commentData._id.toString(),
      author: transformAuthor(commentData.author),
      content: commentData.content || "",
      createdAt: commentData.createdAt?.toISOString(),
      parentId: commentData.parentId?.toString(),
      detailedReactions: commentData.detailedReactions?.map(transformReaction) || [],
    };
  }
  // console.warn(`[transformComment] Received unpopulated or malformed comment data: ${JSON.stringify(commentData)}`);
  return undefined;
};

// Helper function to transform a single post
const transformPost = (postDoc: any): PostType => {
  let sharedOriginalPostTransformed: PostType | undefined = undefined;
  let sharedOriginalPostIdString: string | undefined = undefined;

  if (postDoc.sharedOriginalPostId) {
    const sharedData = postDoc.sharedOriginalPostId; // This should be the populated object
    if (typeof sharedData === 'object' && sharedData !== null && sharedData._id) {
      sharedOriginalPostIdString = sharedData._id.toString();
      sharedOriginalPostTransformed = {
        id: sharedOriginalPostIdString,
        author: transformAuthor(sharedData.author),
        content: sharedData.content || "",
        mediaUrl: sharedData.mediaUrl,
        mediaType: sharedData.mediaType,
        createdAt: sharedData.createdAt?.toISOString(),
        detailedReactions: sharedData.detailedReactions?.map(transformReaction) || [],
        shares: sharedData.shares || 0,
        repliesCount: sharedData.repliesCount || 0,
        // Omit comments for shared post preview in the main feed to keep payload smaller
        comments: [], // Or: (sharedData.comments || []).map(transformComment).filter(Boolean) as CommentClientType[],
        blogShareDetails: sharedData.blogShareDetails,
        tags: sharedData.tags,
        teamSnapshot: sharedData.teamSnapshot,
      };
    } else if (sharedData) { // Is an ObjectId string or Mongoose ObjectId type
      sharedOriginalPostIdString = sharedData.toString();
      // sharedOriginalPostTransformed remains undefined
    }
  }

  return {
    id: postDoc._id.toString(), // Assuming _id is always present on postDoc
    author: transformAuthor(postDoc.author),
    content: postDoc.content || "",
    mediaUrl: postDoc.mediaUrl,
    mediaType: postDoc.mediaType,
    teamSnapshot: postDoc.teamSnapshot,
    tags: postDoc.tags,
    createdAt: postDoc.createdAt?.toISOString(),
    detailedReactions: postDoc.detailedReactions?.map(transformReaction) || [],
    shares: postDoc.shares || 0,
    repliesCount: postDoc.repliesCount || 0,
    comments: (postDoc.comments || []).map(transformComment).filter(Boolean) as CommentClientType[],
    sharedOriginalPostId: sharedOriginalPostIdString,
    sharedOriginalPost: sharedOriginalPostTransformed,
    blogShareDetails: postDoc.blogShareDetails,
  };
};


export async function GET() {
  await dbConnect();
  let currentProcessingPostId: string | null = null;
  try {
    const postsFromDB = await PostModel.find({})
      .populate({
        path: 'author', // Populates author based on authorModel in each Post document
      })
      .populate({
        path: 'sharedOriginalPostId',
        populate: {
          path: 'author', // Populates author based on authorModel in each sharedOriginalPostId document
        },
      })
      .populate({
        path: 'comments',
        populate: {
          path: 'author', // Populates author based on authorModel in each Comment sub-document
        },
      })
      .sort({ createdAt: -1 })
      .lean({ virtuals: true });

    const transformedPosts = postsFromDB.map(postDoc => {
      currentProcessingPostId = postDoc._id?.toString() || 'unknown';
      try {
        return transformPost(postDoc);
      } catch (transformError: any) {
        console.error(`[API/POSTS GET] Error transforming post with ID ${currentProcessingPostId}:`, transformError.message, transformError.stack);
        console.error(`[API/POSTS GET] Problematic postDoc for ID ${currentProcessingPostId}:`, JSON.stringify(postDoc, null, 2));
        // To avoid crashing the entire feed, we can return null or a special error object for this post
        // For now, re-throwing to be caught by the outer handler, which will result in 500 for the whole request.
        // Consider returning a partial list if one post fails.
        throw transformError;
      }
    });
    return NextResponse.json(transformedPosts);

  } catch (error: any) {
    console.error(`[API/POSTS GET] Overall error. Last post ID processed or being processed: ${currentProcessingPostId || 'N/A'}. Error:`, error.message, error.stack);
    return NextResponse.json({ message: 'Error: Could not retrieve posts data.', error: error.message, details: `Error occurred near post ID: ${currentProcessingPostId || 'N/A'}` }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await dbConnect();
  try {
    const { content, authorId: providedAuthorId, mediaUrl, mediaType, sharedOriginalPostId, blogShareDetails } = await request.json() as {
        content?: string;
        authorId?: string;
        mediaUrl?: string;
        mediaType?: 'image' | 'gif';
        sharedOriginalPostId?: string;
        blogShareDetails?: BlogShareDetails;
    };

    const authorIdToUse = providedAuthorId || mockAdminUser.id;

    if (!authorIdToUse || (!content && !sharedOriginalPostId && !blogShareDetails) ) {
      return NextResponse.json({ message: 'Author ID and content (or share details) are required' }, { status: 400 });
    }

    let authorDoc = await UserModel.findById(authorIdToUse).lean();
    let authorModelType: 'User' | 'Identity' = 'User';

    if (!authorDoc) {
      authorDoc = await IdentityModel.findById(authorIdToUse).lean();
      authorModelType = 'Identity';
    }

    if (!authorDoc) {
      return NextResponse.json({ message: 'Author not found' }, { status: 404 });
    }

    const newPostData: any = {
      author: authorDoc._id,
      authorModel: authorModelType,
      content: content || "",
      detailedReactions: [],
      shares: 0,
      repliesCount: 0,
      comments: [],
    };

    if (mediaUrl) newPostData.mediaUrl = mediaUrl;
    if (mediaType) newPostData.mediaType = mediaType;
    if (blogShareDetails) newPostData.blogShareDetails = blogShareDetails;

    if (sharedOriginalPostId) {
      if (!mongoose.Types.ObjectId.isValid(sharedOriginalPostId)) {
        return NextResponse.json({ message: 'Invalid sharedOriginalPostId format' }, { status: 400 });
      }
      const originalPost = await PostModel.findById(sharedOriginalPostId);
      if (originalPost) {
        newPostData.sharedOriginalPostId = originalPost._id;
        originalPost.shares = (originalPost.shares || 0) + 1;
        await originalPost.save();
      } else {
        console.warn(`Original post with ID ${sharedOriginalPostId} not found for sharing count update.`);
      }
    }

    const post = new PostModel(newPostData);
    await post.save();

    let populatedPost = await PostModel.findById(post._id)
      .populate({ path: 'author' })
      .populate({
          path: 'sharedOriginalPostId',
          populate: { path: 'author' }
      })
      .lean({ virtuals: true });

    if (!populatedPost) {
        console.error(`[API/POSTS POST] Failed to re-fetch post ${post._id} after saving.`);
        return NextResponse.json({ message: 'Post created but failed to retrieve for response.' }, { status: 500 });
    }

    return NextResponse.json(transformPost(populatedPost), { status: 201 });

  } catch (error: any) {
    console.error('[API/POSTS POST] Error creating post:', error, error.stack);
    return NextResponse.json({ message: error.message || 'An unexpected error occurred while creating the post.' }, { status: 500 });
  }
}
    