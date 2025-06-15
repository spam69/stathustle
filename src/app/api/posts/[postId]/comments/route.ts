import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PostModel from '@/models/Post.model';
import CommentModel from '@/models/Comment.model';
import UserModel from '@/models/User.model';
import IdentityModel from '@/models/Identity.model';
import { createNotification } from '@/lib/notifications';
import type { Comment as CommentType, User as UserType, Identity as IdentityType } from '@/types';

export async function POST(
  request: Request,
  { params }: { params: { postId: string } }
) {
  await dbConnect();
  try {
    const { postId } = await params;
    const { content, authorId: providedAuthorId, parentId } = await request.json();

    const authorIdToUse = providedAuthorId;

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
    let postRecipientId: string | undefined;
    let postRecipientModel: 'User' | 'Identity' | undefined;
    const postAuthorDoc = await (post.authorModel === 'User' ? UserModel.findById(post.author) : IdentityModel.findById(post.author)).lean();
    if (postAuthorDoc) {
      if (post.authorModel === 'Identity' && postAuthorDoc.owner && postAuthorDoc.owner._id) {
        postRecipientId = postAuthorDoc.owner._id.toString();
        postRecipientModel = 'User';
      } else if (post.authorModel === 'User' && postAuthorDoc._id) {
        postRecipientId = postAuthorDoc._id.toString();
        postRecipientModel = 'User';
      }
    }

    if (postRecipientId && postRecipientModel && postRecipientId !== authorDoc._id.toString()) {
        createNotification(
            'new_comment', 
            authorForNotification as UserType | IdentityType, // Cast: fetched earlier
            postRecipientId,
            postRecipientModel,
            post.toObject({ virtuals: true }) as PostType, 
            newComment.toObject({ virtuals: true }) as CommentType
        );
    }

    if (parentId) {
      const originalComment = await CommentModel.findById(parentId)
        .populate('author') // Populate to get author's ID for notification
        .lean();
      let replyRecipientId: string | undefined;
      let replyRecipientModel: 'User' | 'Identity' | undefined;
      if (originalComment && originalComment.author) {
        if (originalComment.author.isIdentity && originalComment.author.owner && originalComment.author.owner._id) {
          replyRecipientId = originalComment.author.owner._id.toString();
          replyRecipientModel = 'User';
        } else if (!originalComment.author.isIdentity && originalComment.author._id) {
          replyRecipientId = originalComment.author._id.toString();
          replyRecipientModel = 'User';
        }
      }
      if (originalComment && replyRecipientId && replyRecipientModel && replyRecipientId !== authorDoc._id.toString()) {
        createNotification(
            'new_reply', 
            authorForNotification as UserType | IdentityType,
            replyRecipientId,
            replyRecipientModel,
            post.toObject({ virtuals: true }) as PostType, 
            newComment.toObject({ virtuals: true }) as CommentType,
            originalComment as CommentType
        );
      }
    }
    
    const commentToReturn = newComment.toObject({ virtuals: true }) as CommentType;
    return NextResponse.json(commentToReturn, { status: 201 });
  } catch (error: any) {
    console.error(`Comment API error for post ${params.postId}:`, error);
    return NextResponse.json({ message: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
