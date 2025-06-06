
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PostModel from '@/models/Post.model';
import UserModel from '@/models/User.model';
import IdentityModel from '@/models/Identity.model';
import CommentModel from '@/models/Comment.model'; // For populating comments within posts
import type { Post as PostType, User as UserType, Identity as IdentityType, BlogShareDetails } from '@/types';
import { mockAdminUser } from '@/lib/mock-data'; // Used as placeholder for authorId

export async function GET() {
  await dbConnect();
  try {
    const posts = await PostModel.find({})
      .populate({
        path: 'author',
        // Dynamically determine model for population based on authorModel
        // This requires authorModel to be set correctly during post creation
        // For a general find, we might need a more complex population strategy if authorModel isn't directly on Post
        // Or ensure authorModel is always populated, or fetch in two steps.
        // For simplicity, assuming 'author' can be populated directly if refPath works as expected globally.
        // A more robust way: fetch posts, then iterate and populate author based on authorModel for each.
        // However, Mongoose might handle this if refPath is set up on the schema properly for 'author'.
        // Let's try direct population first. If it fails, we'll adjust.
        // It's better to populate based on refPath if schema supports it or do it manually:
      })
      .populate({
        path: 'sharedOriginalPostId',
        populate: {
          path: 'author',
          // model: // This also needs dynamic model based on sharedOriginalPost.authorModel
        }
      })
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          // model: // Dynamic model for comment authors
        }
      })
      .sort({ createdAt: -1 })
      .lean(); // Use .lean() for faster queries if not modifying docs

    // Manual population for authors if direct population is tricky with refPath on root query
    for (const post of posts) {
      if (post.author && post.authorModel) {
        const AuthorModel = post.authorModel === 'User' ? UserModel : IdentityModel;
        post.author = await AuthorModel.findById(post.author._id).lean() as UserType | IdentityType;
      }
      if (post.sharedOriginalPostId && post.sharedOriginalPostId.author && post.sharedOriginalPostId.authorModel) {
        const SharedAuthorModel = post.sharedOriginalPostId.authorModel === 'User' ? UserModel : IdentityModel;
        post.sharedOriginalPostId.author = await SharedAuthorModel.findById(post.sharedOriginalPostId.author._id).lean() as UserType | IdentityType;
      }
      if (post.comments && post.comments.length > 0) {
        for (const comment of post.comments as any[]) { // Cast to any for generic iteration
          if (comment.author && comment.authorModel) {
            const CommentAuthorModel = comment.authorModel === 'User' ? UserModel : IdentityModel;
            comment.author = await CommentAuthorModel.findById(comment.author._id).lean() as UserType | IdentityType;
          }
        }
      }
    }


    return NextResponse.json(posts.map(p => ({...p, id: p._id.toString() })));
  } catch (error: any) {
    console.error("[API/POSTS GET] Error:", error);
    return NextResponse.json({ message: 'Error: Could not retrieve posts data.', error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await dbConnect();
  try {
    const { content, authorId: providedAuthorId, mediaUrl, mediaType, sharedOriginalPostId, blogShareDetails } = await request.json() as {
        content?: string;
        authorId?: string; // Optional for now, will use mockAdminUser if not provided
        mediaUrl?: string;
        mediaType?: 'image' | 'gif';
        sharedOriginalPostId?: string;
        blogShareDetails?: BlogShareDetails;
    };

    const authorIdToUse = providedAuthorId || mockAdminUser.id; // Placeholder for actual auth

    if (!authorIdToUse && (!content && !sharedOriginalPostId && !blogShareDetails) ) {
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

    const newPostData: Partial<PostType> & { author: string, authorModel: string } = {
      author: authorDoc._id,
      authorModel: authorModelType,
      content: content || "",
      detailedReactions: [],
      shares: 0,
      repliesCount: 0,
      comments: [],
      createdAt: new Date().toISOString(),
    };

    if (mediaUrl) newPostData.mediaUrl = mediaUrl;
    if (mediaType) newPostData.mediaType = mediaType;
    if (blogShareDetails) newPostData.blogShareDetails = blogShareDetails;

    if (sharedOriginalPostId) {
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
    
    // Populate author for the response
    const savedPostObject = post.toObject({ virtuals: true }) as PostType;
    savedPostObject.author = authorDoc as UserType | IdentityType; // Assign the fetched author document

    return NextResponse.json(savedPostObject, { status: 201 });

  } catch (error: any) {
    console.error('Create Post API error:', error);
    return NextResponse.json({ message: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
