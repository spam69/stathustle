
import { NextResponse } from 'next/server';
import { mockBlogs, mockUsers, mockIdentities } from '@/lib/mock-data';
import type { Blog, User, Identity } from '@/types';

export async function GET() {
  await new Promise(resolve => setTimeout(resolve, 200));
  return NextResponse.json(mockBlogs.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
}

export async function POST(request: Request) {
  try {
    const { title, slug, content, excerpt, coverImageUrl, authorId } = await request.json();

    if (!title || !slug || !content || !authorId) {
      return NextResponse.json({ message: 'Title, slug, content, and authorId are required.' }, { status: 400 });
    }

    // Find the author: can be a User or an Identity
    let author: User | Identity | undefined = mockUsers.find(u => u.id === authorId);
    if (!author) {
      author = mockIdentities.find(i => i.id === authorId);
    }

    if (!author) {
      return NextResponse.json({ message: 'Author not found.' }, { status: 404 });
    }

    // Basic slug uniqueness check (per author for mock, real DB would handle this better)
    const authorSlugExists = mockBlogs.some(
      blog => blog.author.id === author!.id && blog.slug.toLowerCase() === slug.toLowerCase()
    );
    if (authorSlugExists) {
      return NextResponse.json({ message: `Slug "${slug}" already exists for this author.` }, { status: 409 });
    }
    // More robust global slug check (optional for mock)
    const globalSlugExists = mockBlogs.some(blog => blog.slug.toLowerCase() === slug.toLowerCase() && blog.author.username.toLowerCase() !== author!.username.toLowerCase());
    if (globalSlugExists) {
        // Potentially append a random string or suggest a different slug
        // For now, we'll just warn, but in a real system this would need more handling
        console.warn(`Slug "${slug}" exists globally for a different author. This might cause issues.`);
    }


    const newBlog: Blog = {
      id: `blog-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      author,
      title,
      slug,
      content,
      excerpt: excerpt || undefined,
      coverImageUrl: coverImageUrl || undefined,
      createdAt: new Date().toISOString(),
    };

    mockBlogs.unshift(newBlog); // Add to the beginning of the array for newest first

    return NextResponse.json(newBlog, { status: 201 });

  } catch (error) {
    console.error('Create Blog API error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred while creating the blog post.' }, { status: 500 });
  }
}
