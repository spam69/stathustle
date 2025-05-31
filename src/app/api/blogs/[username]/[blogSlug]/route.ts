
import { NextResponse } from 'next/server';
import { mockBlogs } from '@/lib/mock-data';

export async function GET(
  request: Request,
  { params }: { params: { username: string; blogSlug: string } }
) {
  try {
    const { username, blogSlug } = params;
    await new Promise(resolve => setTimeout(resolve, 200));

    const blog = mockBlogs.find(
      b => b.author.username.toLowerCase() === username.toLowerCase() && b.slug === blogSlug
    );

    if (blog) {
      return NextResponse.json(blog);
    } else {
      return NextResponse.json({ message: 'Blog post not found' }, { status: 404 });
    }
  } catch (error) {
    console.error(`Get Blog API error for ${params.username}/${params.blogSlug}:`, error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}

    