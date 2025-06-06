
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PostModel from '@/models/Post.model';
import UserModel from '@/models/User.model';
import IdentityModel from '@/models/Identity.model';
import CommentModel from '@/models/Comment.model'; // For populating comments
import type { User as UserType, Identity as IdentityType, Post as PostType } from '@/types';


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
      // Populate author - this will use refPath if authorModel is part of the schema
      .populate({
        path: 'author',
        // model: // Will be determined by refPath 'authorModel' in PostSchema
      })
      .populate({
        path: 'sharedOriginalPostId', // Assuming this is the correct field name
        populate: {
          path: 'author',
          // model: // Also determined by refPath 'authorModel' in the shared post's schema
        }
      })
      .populate({
        path: 'comments', // Assuming 'comments' is an array of Comment ObjectIds
        populate: {
          path: 'author',
          // model: // Determined by refPath 'authorModel' in CommentSchema
        }
      })
      .lean();

    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    // Manual population step by step if deep/dynamic population is complex
    if (post.author && post.authorModel) {
      const AuthorModel = post.authorModel === 'User' ? UserModel : IdentityModel;
      post.author = await AuthorModel.findById(post.author._id).lean() as UserType | IdentityType;
    }

    if (post.sharedOriginalPostId && post.sharedOriginalPostId.author && post.sharedOriginalPostId.authorModel) {
      const SharedPostAuthorModel = post.sharedOriginalPostId.authorModel === 'User' ? UserModel : IdentityModel;
      post.sharedOriginalPostId.author = await SharedPostAuthorModel.findById(post.sharedOriginalPostId.author._id).lean() as UserType | IdentityType;
    }
    
    if (post.comments && post.comments.length > 0) {
        const populatedComments = [];
        for (const commentRef of post.comments as any[]) { // commentRef could be an ID or a populated doc
            let commentDoc = commentRef;
            // If commentRef is just an ID, fetch the full comment document
            if (!(commentRef instanceof CommentModel) && !commentRef.authorModel) { 
                commentDoc = await CommentModel.findById(commentRef._id || commentRef).lean();
            }
            if (commentDoc && commentDoc.author && commentDoc.authorModel) {
                const CommentAuthorModel = commentDoc.authorModel === 'User' ? UserModel : IdentityModel;
                commentDoc.author = await CommentAuthorModel.findById(commentDoc.author._id || commentDoc.author).lean() as UserType | IdentityType;
            }
            populatedComments.push(commentDoc);
        }
        post.comments = populatedComments;
    }
    
    const postWithId = { ...post, id: post._id.toString() };

    return NextResponse.json(postWithId);
  } catch (error: any) {
    console.error(`Get Post API error for postId ${params.postId}:`, error);
    return NextResponse.json({ message: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
