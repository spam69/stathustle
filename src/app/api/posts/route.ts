
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PostModel from '@/models/Post.model';
import UserModel from '@/models/User.model';
import IdentityModel from '@/models/Identity.model';
import CommentModel from '@/models/Comment.model';
import type { Post as PostType, User as UserType, Identity as IdentityType, Comment as CommentClientType, ReactionEntry as ReactionEntryClientType, BlogShareDetails } from '@/types';
import { mockAdminUser } from '@/lib/mock-data';

// Helper function to transform author data
const transformAuthor = (authorDoc: any): UserType | IdentityType | undefined => {
  if (!authorDoc) return undefined;
  return {
    ...authorDoc, // Spread the lean object
    id: authorDoc._id?.toString(),
    // Ensure essential fields, even if they are undefined in the doc
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
  };
};

// Helper function to transform a single post
const transformPost = (postDoc: any): PostType => {
  let sharedOriginalPostTransformed: PostType | undefined = undefined;
  let sharedOriginalPostIdString: string | undefined = undefined;

  if (postDoc.sharedOriginalPostId) {
    // If sharedOriginalPostId was populated, it's an object.
    // If it wasn't (e.g., ref missing or ID invalid), it might be an ObjectId string.
    const sharedData = postDoc.sharedOriginalPostId;
    if (sharedData && sharedData._id) { // Indicates it's a populated object
      sharedOriginalPostIdString = sharedData._id.toString();
      sharedOriginalPostTransformed = {
        ...sharedData,
        id: sharedOriginalPostIdString,
        author: transformAuthor(sharedData.author),
        detailedReactions: sharedData.detailedReactions?.map(transformReaction) || [],
        comments: [], // Keep shared post comments minimal in this context
        repliesCount: sharedData.repliesCount || 0,
        content: sharedData.content || "",
        createdAt: sharedData.createdAt?.toISOString(),
        shares: sharedData.shares || 0,
        mediaUrl: sharedData.mediaUrl,
        mediaType: sharedData.mediaType,
        blogShareDetails: sharedData.blogShareDetails, // Assuming BlogShareDetails doesn't need deep transformation here
        // Other necessary fields from PostType
      };
    } else if (sharedData) { // It's likely an ObjectId string
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
    content: postDoc.content || "", // Ensure content is always a string
    shares: postDoc.shares || 0,
    repliesCount: postDoc.repliesCount || 0,
    blogShareDetails: postDoc.blogShareDetails, // Pass through if present
    // Ensure all other fields from PostType are present or defaulted
    mediaUrl: postDoc.mediaUrl,
    mediaType: postDoc.mediaType,
    teamSnapshot: postDoc.teamSnapshot,
    tags: postDoc.tags,
  };
};


export async function GET() {
  await dbConnect();
  try {
    const postsFromDB = await PostModel.find({})
      .populate({
        path: 'author', // Mongoose uses authorModel from PostSchema
      })
      .populate({
        path: 'sharedOriginalPostId',
        populate: { path: 'author' /* Mongoose uses authorModel from PostSchema for the shared post's author */ },
      })
      .populate({
        path: 'comments',
        populate: { path: 'author' /* Mongoose uses authorModel from CommentSchema */ },
      })
      .sort({ createdAt: -1 })
      .lean();

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
        sharedOriginalPostId?: string; // This will be an ID string from client
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

    const newPostData: any = { // Use 'any' temporarily for Mongoose model creation
      author: authorDoc._id, // Store ObjectId
      authorModel: authorModelType,
      content: content || "",
      detailedReactions: [],
      shares: 0,
      repliesCount: 0,
      comments: [],
      // createdAt will be set by timestamps: true
    };

    if (mediaUrl) newPostData.mediaUrl = mediaUrl;
    if (mediaType) newPostData.mediaType = mediaType;
    if (blogShareDetails) newPostData.blogShareDetails = blogShareDetails;

    if (sharedOriginalPostId) {
      // Validate sharedOriginalPostId is a valid ObjectId string
      if (!mongoose.Types.ObjectId.isValid(sharedOriginalPostId)) {
        return NextResponse.json({ message: 'Invalid sharedOriginalPostId format' }, { status: 400 });
      }
      const originalPost = await PostModel.findById(sharedOriginalPostId);
      if (originalPost) {
        newPostData.sharedOriginalPostId = originalPost._id; // Store ObjectId
        originalPost.shares = (originalPost.shares || 0) + 1;
        await originalPost.save();
      } else {
        console.warn(`Original post with ID ${sharedOriginalPostId} not found for sharing count update.`);
        // Decide if this should be an error or if post can be created without linking
        // For now, let's allow creation but without the link if original is not found
        delete newPostData.sharedOriginalPostId;
      }
    }

    const post = new PostModel(newPostData);
    await post.save();
    
    // Populate author for the response, and potentially the shared post if it was just created
    let populatedPost = await PostModel.findById(post._id)
      .populate({ path: 'author' })
      .populate({ path: 'sharedOriginalPostId', populate: { path: 'author' }})
      .lean();

    if (!populatedPost) {
        // This should ideally not happen if save was successful
        console.error(`[API/POSTS POST] Failed to re-fetch post ${post._id} after saving.`);
        return NextResponse.json({ message: 'Post created but failed to retrieve for response.' }, { status: 500 });
    }
    
    return NextResponse.json(transformPost(populatedPost), { status: 201 });

  } catch (error: any) {
    console.error('[API/POSTS POST] Error creating post:', error, error.stack);
    return NextResponse.json({ message: error.message || 'An unexpected error occurred while creating the post.' }, { status: 500 });
  }
}
