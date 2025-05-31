import { NextResponse } from 'next/server';
import { mockPosts } from '@/lib/mock-data';
import type { Post } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params;

    // Simulate network delay if needed
    // await new Promise(resolve => setTimeout(resolve, 200));

    const post = mockPosts.find(p => p.id === postId);

    if (post) {
      // If the post itself is a share, and its sharedOriginalPost data isn't populated,
      // try to find and populate it before returning.
      // This helps ensure consistency if a shared post's original data is requested directly.
      if (post.sharedOriginalPostId && !post.sharedOriginalPost) {
        const original = mockPosts.find(p => p.id === post.sharedOriginalPostId);
        if (original) {
          post.sharedOriginalPost = original;
        }
      }
      return NextResponse.json(post);
    } else {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }
  } catch (error) {
    console.error(`Get Post API error for postId ${params.postId}:`, error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}