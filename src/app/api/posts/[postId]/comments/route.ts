import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PostModel from '@/models/Post.model';
import CommentModel from '@/models/Comment.model';
import UserModel from '@/models/User.model';
import IdentityModel from '@/models/Identity.model';
import { createNotification } from '@/lib/notifications';
import type { Comment as CommentType, User as UserType, Identity as IdentityType } from '@/types';
import { mockAdminUser } from '@/lib/mock-data'; // Placeholder for authenticated user

export async function POST(
  request: Request,
  { params }: { params: { postId: string } }
) {
  await dbConnect();
  try {
    const { postId } = params;
    const { content, authorId: providedAuthorId, parentId } = await request.json();

    const authorIdToUse = providedAuthorId || mockAdminUser.id; // Placeholder

    if (!content || !authorIdToUse) {
      return NextResponse.json({ message: 'Content and authorId are required' }, { status: 400 });
    }
    if (!postId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ message: 'Invalid Post ID format' }, { status: 400 });
    }
    if (parentId && !parentId.match(/^[0-9a-fA-F]{24}$/)) {
        return NextResponse.json({ message: 'Invalid Parent Comment ID format' }, { status: 400 });
    }


    const post = await PostModel.findById(postId);
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
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
    
    const authorForNotification = authorDoc; // Already fetched

    const newComment = new CommentModel({
      author: authorDoc._id,
      authorModel: authorModelType,
      content,
      parentId: parentId || undefined,
      detailedReactions: [],
    });
    await newComment.save();

    post.comments.push(newComment._id);
    post.repliesCount = (post.repliesCount || 0) + 1;
    await post.save();

    // Fetch post author for notification if needed
    const postAuthorDoc = await (post.authorModel === 'User' ? UserModel.findById(post.author) : IdentityModel.findById(post.author)).lean();

    if (postAuthorDoc && postAuthorDoc._id.toString() !== authorDoc._id.toString()) {
        createNotification(
            'new_comment', 
            authorForNotification as UserType | IdentityType, // Cast: fetched earlier
            postAuthorDoc._id.toString(), 
            post.toObject({ virtuals: true }) as PostType, 
            newComment.toObject({ virtuals: true }) as CommentType
        );
    }

    if (parentId) {
      const originalComment = await CommentModel.findById(parentId)
        .populate('author') // Populate to get author's ID for notification
        .lean();
      if (originalComment && originalComment.author && originalComment.author._id.toString() !== authorDoc._id.toString()) {
        // Ensure originalComment.author is populated or at least has _id
        const originalCommentAuthorId = originalComment.author._id.toString();
        createNotification(
            'new_reply', 
            authorForNotification as UserType | IdentityType,
            originalCommentAuthorId, 
            post.toObject({ virtuals: true }) as PostType, 
            newComment.toObject({ virtuals: true }) as CommentType,
            originalComment as CommentType
        );
      }
    }
    
    const commentToReturn = newComment.toObject({ virtuals: true }) as CommentType;
    commentToReturn.author = authorDoc as UserType | IdentityType; // Populate author for response

    return NextResponse.json(commentToReturn, { status: 201 });
  } catch (error: any) {
    console.error(`Comment API error for post ${params.postId}:`, error);
    return NextResponse.json({ message: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
