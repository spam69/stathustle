
import { NextResponse } from 'next/server';
import { mockPosts } from '@/lib/mock-data';

export async function POST(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params;
    // In a real app, you'd also check which user is liking
    // const { userId } = await request.json(); // Assuming userId is sent

    const post = mockPosts.find(p => p.id === postId);
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    // Simple toggle or increment based on real logic (e.g., check if user already liked)
    // For now, just increment
    post.reactions = (post.reactions || 0) + 1;

    return NextResponse.json(post);
  } catch (error) {
    console.error(`Like Post API error for post ${params.postId}:`, error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}

    