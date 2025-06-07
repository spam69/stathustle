
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import PostModel from '@/models/Post.model';
import UserModel from '@/models/User.model';
import IdentityModel from '@/models/Identity.model';
import CommentModel from '@/models/Comment.model'; // Ensure CommentModel is imported
import type { Post as PostType, User as UserType, Identity as IdentityType, Comment as CommentClientType, ReactionEntry as ReactionEntryClientType, BlogShareDetails } from '@/types';
import { mockAdminUser } from '@/lib/mock-data';

// Helper function to transform author data
const transformAuthor = (authorData: any): UserType | IdentityType | undefined => {
  if (!authorData) {
    console.warn("[transformAuthor] Received null or undefined authorData.");
    return undefined;
  }
  // Check if it's a populated document (has _id and is an object)
  if (typeof authorData === 'object' && authorData._id) {
    return {
      id: authorData._id.toString(),
      username: authorData.username || 'Unknown User',
      profilePictureUrl: authorData.profilePictureUrl,
      isIdentity: !!authorData.isIdentity, // Ensure boolean
      displayName: authorData.displayName || authorData.username || 'Unknown Display Name',
      // Ensure other potentially missing fields from UserType/IdentityType are handled if necessary
      email: authorData.email, // Assuming email might be present
      // Add default empty arrays for optional fields if client expects them
      socialLinks: authorData.socialLinks || [],
      sportInterests: authorData.sportInterests || [],
      themePreference: authorData.themePreference,
      bio: authorData.bio,
      // For Identity-specific fields:
      owner: authorData.owner ? transformAuthor(authorData.owner) : undefined, // Recursively transform owner if it's an Identity
      teamMembers: authorData.teamMembers ? authorData.teamMembers.map((tm: any) => ({ ...tm, user: transformAuthor(tm.user) })) : [],
    };
  }
  console.warn(`[transformAuthor] Received unpopulated or malformed author data: ${JSON.stringify(authorData)}. Expected populated object with _id.`);
  return undefined;
};

// Helper function to transform reaction entries
const transformReaction = (reactionDoc: any): ReactionEntryClientType => ({
  userId: reactionDoc.userId?.toString(), // userId should be populated if it's a ref, or already a string/ObjectId
  reactionType: reactionDoc.reactionType,
  createdAt: reactionDoc.createdAt?.toISOString(),
});

// Helper function to transform comment data
const transformComment = (commentData: any): CommentClientType | undefined => {
  if (!commentData) return undefined;
  if (typeof commentData === 'object' && commentData._id) {
    const author = transformAuthor(commentData.author);
    if (!author) {
        console.warn(`[transformComment] Failed to transform author for comment ${commentData._id}. Author data:`, JSON.stringify(commentData.author));
    }
    return {
      id: commentData._id.toString(),
      author: author!, // Asserting author is defined; if it can be undefined, CommentClientType['author'] should allow it or handle it.
      content: commentData.content || "",
      createdAt: commentData.createdAt?.toISOString(),
      parentId: commentData.parentId?.toString(),
      detailedReactions: commentData.detailedReactions?.map(transformReaction) || [],
    };
  }
  console.warn(`[transformComment] Received unpopulated or malformed comment data: ${JSON.stringify(commentData)}`);
  return undefined;
};

// Helper function to transform a single post
const transformPost = (postDoc: any): PostType | null => {
  if (!postDoc || !postDoc._id) {
    console.error("[transformPost] Called with null, undefined, or invalid postDoc:", postDoc);
    return null;
  }

  const author = transformAuthor(postDoc.author);
  if (!author) {
    console.error(`[transformPost] Post ID ${postDoc._id?.toString()} has missing or invalid author. Skipping this post. Author data:`, JSON.stringify(postDoc.author));
    return null;
  }

  let sharedOriginalPostTransformed: PostType | undefined = undefined;
  let sharedOriginalPostIdString: string | undefined = undefined;

  if (postDoc.sharedOriginalPostId) {
    const sharedData = postDoc.sharedOriginalPostId;
    if (typeof sharedData === 'object' && sharedData !== null && sharedData._id) {
      sharedOriginalPostIdString = sharedData._id.toString();
      const sharedAuthor = transformAuthor(sharedData.author);
      if (sharedAuthor) {
        sharedOriginalPostTransformed = {
          id: sharedOriginalPostIdString,
          author: sharedAuthor,
          content: sharedData.content || "",
          mediaUrl: sharedData.mediaUrl,
          mediaType: sharedData.mediaType,
          createdAt: sharedData.createdAt?.toISOString(),
          detailedReactions: sharedData.detailedReactions?.map(transformReaction) || [],
          shares: sharedData.shares || 0,
          repliesCount: sharedData.repliesCount || 0,
          comments: [], // Omitting comments for shared post preview in feed
          blogShareDetails: sharedData.blogShareDetails,
          tags: sharedData.tags,
          teamSnapshot: sharedData.teamSnapshot,
        };
      } else {
        console.warn(`[transformPost] Shared post ID ${sharedOriginalPostIdString} for main post ${postDoc._id.toString()} has invalid author. Shared post data not included.`);
      }
    } else if (sharedData) {
      sharedOriginalPostIdString = sharedData.toString();
    }
  }
  
  const comments = (postDoc.comments || [])
    .map(transformComment)
    .filter(Boolean) as CommentClientType[];
  if (postDoc.comments && postDoc.comments.length > 0 && comments.length !== postDoc.comments.length) {
    console.warn(`[transformPost] Post ID ${postDoc._id.toString()}: Some comments failed to transform. Original count: ${postDoc.comments.length}, Transformed count: ${comments.length}`);
  }


  return {
    id: postDoc._id.toString(),
    author: author,
    content: postDoc.content || "",
    mediaUrl: postDoc.mediaUrl,
    mediaType: postDoc.mediaType,
    teamSnapshot: postDoc.teamSnapshot,
    tags: postDoc.tags || [],
    createdAt: postDoc.createdAt?.toISOString(),
    detailedReactions: postDoc.detailedReactions?.map(transformReaction) || [],
    shares: postDoc.shares || 0,
    repliesCount: postDoc.repliesCount || 0,
    comments: comments,
    sharedOriginalPostId: sharedOriginalPostIdString,
    sharedOriginalPost: sharedOriginalPostTransformed,
    blogShareDetails: postDoc.blogShareDetails,
  };
};


export async function GET() {
  await dbConnect();
  let currentProcessingPostId: string | null = null;
  try {
    // Explicitly ensure Comment model is registered. This is a robust workaround.
    // It assumes CommentModel (the module) is imported and CommentModel.schema holds the schema.
    if (!mongoose.models.Comment) {
        console.warn("[API/POSTS GET] Comment model not found in mongoose.models. Attempting to register from CommentModel.schema.");
        if (CommentModel && CommentModel.schema) {
            mongoose.model('Comment', CommentModel.schema);
        } else {
            console.error("[API/POSTS GET] Cannot register Comment model: CommentModel or CommentModel.schema is undefined. Ensure CommentModel is imported and correctly defined.");
            // Potentially throw an error here or return a 500 if critical
        }
    }
    // You can do the same for other models if they cause similar issues during population
    if (!mongoose.models.User) {
        if (UserModel && UserModel.schema) mongoose.model('User', UserModel.schema);
    }
    if (!mongoose.models.Identity) {
        if (IdentityModel && IdentityModel.schema) mongoose.model('Identity', IdentityModel.schema);
    }
    if (!mongoose.models.Post) {
        if (PostModel && PostModel.schema) mongoose.model('Post', PostModel.schema);
    }


    const postsFromDB = await PostModel.find({})
      .populate({
        path: 'author',
        // model: UserModel, // Reverted: Rely on refPath 'authorModel' in PostSchema
      })
      .populate({
        path: 'sharedOriginalPostId',
        populate: {
          path: 'author', // Relies on refPath 'authorModel' in the shared PostSchema
        },
      })
      .populate({
        path: 'comments', // Populates the 'comments' array in Post documents
        populate: {
          path: 'author', // For each comment, populate its 'author' field
                          // This will use 'authorModel' on the CommentSchema
        },
      })
      .sort({ createdAt: -1 })
      .lean({ virtuals: true }); // Keep virtuals true for 'id'

    const transformedPosts = postsFromDB
        .map(postDoc => {
            currentProcessingPostId = postDoc._id?.toString() || 'unknown_id_during_map';
            try {
                return transformPost(postDoc);
            } catch (transformError: any) {
                console.error(`[API/POSTS GET] Error transforming post with ID ${currentProcessingPostId}:`, transformError.message, transformError.stack);
                console.error(`[API/POSTS GET] Problematic postDoc for ID ${currentProcessingPostId}:`, JSON.stringify(postDoc, null, 2));
                return null; // Skip this post if transformation fails
            }
        })
        .filter(post => post !== null) as PostType[]; // Filter out nulls and assert type

    return NextResponse.json(transformedPosts);

  } catch (error: any) {
    console.error(`[API/POSTS GET] Overall error. Last post ID processed or being processed: ${currentProcessingPostId || 'N/A'}. Error: ${error.message}`, error.stack);
    return NextResponse.json({ message: 'Error: Could not retrieve posts data.', error: error.message, details: `Error occurred near post ID: ${currentProcessingPostId || 'N/A'}` }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await dbConnect();
  try {
    // Explicitly ensure models are registered before use in POST as well
    if (!mongoose.models.User && UserModel?.schema) mongoose.model('User', UserModel.schema);
    if (!mongoose.models.Identity && IdentityModel?.schema) mongoose.model('Identity', IdentityModel.schema);
    if (!mongoose.models.Post && PostModel?.schema) mongoose.model('Post', PostModel.schema);
    if (!mongoose.models.Comment && CommentModel?.schema) mongoose.model('Comment', CommentModel.schema);


    const { content, authorId: providedAuthorId, mediaUrl, mediaType, sharedOriginalPostId, blogShareDetails } = await request.json() as {
        content?: string;
        authorId?: string;
        mediaUrl?: string;
        mediaType?: 'image' | 'gif';
        sharedOriginalPostId?: string;
        blogShareDetails?: BlogShareDetails;
    };

    const authorIdToUse = providedAuthorId || mockAdminUser.id; // Replace mockAdminUser.id with actual authenticated user ID

    if (!authorIdToUse || (!content && !sharedOriginalPostId && !blogShareDetails && !mediaUrl) ) { // Also check mediaUrl for emptiness
      return NextResponse.json({ message: 'Author ID and content (or share details/media) are required' }, { status: 400 });
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
      comments: [], // Initialize with empty array
      tags: [], // Initialize with empty array
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
        // Decide if this should be an error or just a warning - for now, it's a warning and the share still proceeds.
        // To make it an error, uncomment the next line:
        // return NextResponse.json({ message: `Original post with ID ${sharedOriginalPostId} not found.` }, { status: 404 });
      }
    }

    const post = new PostModel(newPostData);
    await post.save();

    // Re-fetch the post with necessary populations to return the full object
    // This re-fetch part also needs models to be registered
    let populatedPost = await PostModel.findById(post._id)
      .populate({ path: 'author' }) // Populates author of the new post
      .populate({
          path: 'sharedOriginalPostId', // Populates the shared post object
          populate: { path: 'author' } // Populates author of the shared post
      })
      // Comments array is empty on new post, so no need to populate it yet.
      .lean({ virtuals: true });

    if (!populatedPost) {
        console.error(`[API/POSTS POST] Failed to re-fetch post ${post._id} after saving.`);
        // Fallback to a minimally transformed post if full population fails
        const minimalPostTransformed = transformPost(post.toObject({ virtuals: true }));
        if (minimalPostTransformed) {
          return NextResponse.json(minimalPostTransformed, { status: 201 });
        }
        return NextResponse.json({ message: 'Post created but failed to retrieve fully for response.' }, { status: 201 });
    }
    
    const transformedNewPost = transformPost(populatedPost);
    if (!transformedNewPost) {
         console.error(`[API/POSTS POST] Failed to transform newly created post ${post._id}.`);
         return NextResponse.json({ message: 'Post created but failed to transform for response.' }, { status: 201 });
    }

    return NextResponse.json(transformedNewPost, { status: 201 });

  } catch (error: any) {
    console.error('[API/POSTS POST] Error creating post:', error.message, error.stack);
    return NextResponse.json({ message: error.message || 'An unexpected error occurred while creating the post.' }, { status: 500 });
  }
}
    

    