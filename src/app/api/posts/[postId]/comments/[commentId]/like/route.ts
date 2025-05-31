
import { NextResponse } from 'next/server';
import { mockPosts } from '@/lib/mock-data';

export async function POST(
  request: Request,
  { params }: { params: { postId: string; commentId: string } }
) {
  try {
    const { postId, commentId } = params;

    const post = mockPosts.find(p => p.id === postId);
    if (!post || !post.comments) {
      return NextResponse.json({ message: 'Post or comments not found' }, { status: 404 });
    }

    const comment = post.comments.find(c => c.id === commentId);
    if (!comment) {
      return NextResponse.json({ message: 'Comment not found' }, { status: 404 });
    }

    comment.likes = (comment.likes || 0) + 1;

    return NextResponse.json(comment);
  } catch (error) {
    console.error(`Like Comment API error for post ${params.postId}, comment ${params.commentId}:`, error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}

    