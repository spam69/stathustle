
import { NextResponse } from 'next/server';
import mongoose from 'mongoose'; // Added mongoose import
import dbConnect from '@/lib/dbConnect';
import PostModel from '@/models/Post.model';
import UserModel from '@/models/User.model';
import IdentityModel from '@/models/Identity.model';
import CommentModel from '@/models/Comment.model';
import type { Post as PostType, User as UserType, Identity as IdentityType, Comment as CommentClientType, ReactionEntry as ReactionEntryClientType, BlogShareDetails } from '@/types';
import { mockAdminUser } from '@/lib/mock-data';

// Helper function to transform author data
const transformAuthor = (authorDoc: any): UserType | IdentityType | undefined => {
  if (!authorDoc || typeof authorDoc !== 'object' || !authorDoc._id) { 
    return undefined;
  }
  return {
    id: authorDoc._id.toString(),
    username: authorDoc.username || 'Unknown',
    profilePictureUrl: authorDoc.profilePictureUrl,
    isIdentity: !!authorDoc.isIdentity,
    displayName: authorDoc.displayName || authorDoc.username || 'Unknown',
  };
};

// Helper function to transform reaction entries
const transformReaction = (reactionDoc: any): ReactionEntryClientType => ({
  userId: reactionDoc.userId?.toString(), // userId should be an ObjectId from schema, convert to string
  reactionType: reactionDoc.reactionType,
  createdAt: reactionDoc.createdAt?.toISOString(),
});

// Helper function to transform comment data
const transformComment = (commentDoc: any): CommentClientType | undefined => {
  if (!commentDoc || typeof commentDoc !== 'object' || !commentDoc._id) {
    return undefined;
  }
  return {
    id: commentDoc._id.toString(),
    author: transformAuthor(commentDoc.author), // author should be populated
    content: commentDoc.content || "",
    createdAt: commentDoc.createdAt?.toISOString(),
    parentId: commentDoc.parentId?.toString(),
    detailedReactions: commentDoc.detailedReactions?.map(transformReaction) || [],
  };
};

// Helper function to transform a single post
const transformPost = (postDoc: any): PostType => {
  let sharedOriginalPostTransformed: PostType | undefined = undefined;
  let sharedOriginalPostIdString: string | undefined = undefined;

  if (postDoc.sharedOriginalPostId) {
    const sharedData = postDoc.sharedOriginalPostId;
    if (sharedData && sharedData._id) { 
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
        comments: (sharedData.comments || []).map(transformComment).filter(c => c !== undefined) as CommentClientType[],
        blogShareDetails: sharedData.blogShareDetails, 
        tags: sharedData.tags,
        teamSnapshot: sharedData.teamSnapshot,
        // Ensure all other fields from PostType are present or defaulted
      };
    } else if (sharedData) { 
      sharedOriginalPostIdString = sharedData.toString();
    }
  }

  return {
    id: postDoc._id.toString(),
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
    comments: (postDoc.comments || []).map(transformComment).filter(c => c !== undefined) as CommentClientType[],
    sharedOriginalPostId: sharedOriginalPostIdString,
    sharedOriginalPost: sharedOriginalPostTransformed,
    blogShareDetails: postDoc.blogShareDetails,
  };
};


export async function GET() {
  await dbConnect();
  try {
    const postsFromDB = await PostModel.find({})
      .populate({
        path: 'author', 
      })
      .populate({
        path: 'sharedOriginalPostId',
        populate: { path: 'author' },
      })
      .populate({
        path: 'comments',
        populate: { path: 'author' },
      })
      .sort({ createdAt: -1 })
      .lean({ virtuals: true }); // Ensure virtuals like 'id' are included if defined, though we manually map _id

    const transformedPosts = postsFromDB.map(transformPost);
    return NextResponse.json(transformedPosts);

  } catch (error: any) {
    console.error("[API/POSTS GET] Error fetching or transforming posts:", error, error.stack);
    return NextResponse.json({ message: 'Error: Could not retrieve posts data.', error: error.message }, { status: 500 });
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
      content: content || "", // Ensure content is at least an empty string if not provided
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
        // Do not set sharedOriginalPostId if the original post is not found
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
