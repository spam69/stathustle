
import { NextResponse } from 'next/server';
import { mockPosts, mockUsers, mockIdentities, createNotification } from '@/lib/mock-data';
import type { Comment as CommentType, User, Identity, Post } from '@/types';

export async function POST(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params;
    const { content, authorId, parentId } = await request.json();

    if (!content || !authorId) {
      return NextResponse.json({ message: 'Content and authorId are required' }, { status: 400 });
    }

    const post = mockPosts.find(p => p.id === postId);
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    let author: User | Identity | undefined = mockUsers.find(u => u.id === authorId);
    if (!author) {
      author = mockIdentities.find(i => i.id === authorId);
    }
    if (!author) {
      return NextResponse.json({ message: 'Author not found' }, { status: 404 });
    }

    const newComment: CommentType = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      author,
      content,
      createdAt: new Date().toISOString(),
      // likes: 0, // Deprecated
      ...(parentId && { parentId }),
    };

    if (!post.comments) {
      post.comments = [];
    }
    post.comments.push(newComment);
    post.repliesCount = (post.repliesCount || 0) + 1;

    // Notification for new comment on post
    if (post.author.id !== author.id) {
        createNotification('new_comment', author, post.author.id, post, newComment);
    }

    // Notification for new reply to a comment
    if (parentId) {
        const originalComment = post.comments.find(c => c.id === parentId);
        if (originalComment && originalComment.author.id !== author.id) {
            createNotification('new_reply', author, originalComment.author.id, post, newComment, originalComment);
        }
    }


    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error(`Comment API error for post ${params.postId}:`, error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}
