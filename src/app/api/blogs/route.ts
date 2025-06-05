
import { NextResponse } from 'next/server';
import { mockBlogs, mockUsers, mockIdentities } from '@/lib/mock-data';
import type { Blog, User, Identity } from '@/types';

export async function GET() {
  await new Promise(resolve => setTimeout(resolve, 200));
  return NextResponse.json(mockBlogs.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
}

export async function POST(request: Request) {
  try {
    const { title, slug, content, excerpt, coverImageUrl, authorId } = await request.json(); // Slug is now expected from client (as UUID)

    if (!title || !slug || !content || !authorId) {
      return NextResponse.json({ message: 'Title, slug, content, and authorId are required.' }, { status: 400 });
    }

    let author: User | Identity | undefined = mockUsers.find(u => u.id === authorId);
    if (!author) {
      author = mockIdentities.find(i => i.id === authorId);
    }

    if (!author) {
      return NextResponse.json({ message: 'Author not found.' }, { status: 404 });
    }

    // With UUIDs for slugs, collisions are highly unlikely.
    // The existing authorSlugExists check will verify if this author somehow submitted the same UUID twice.
    const authorSlugExists = mockBlogs.some(
      blog => blog.author.id === author!.id && blog.slug.toLowerCase() === slug.toLowerCase()
    );
    if (authorSlugExists) {
      // This should theoretically almost never happen with UUIDs
      return NextResponse.json({ message: `Slug (UUID) "${slug}" already exists for this author. This is highly unusual.` }, { status: 409 });
    }
    
    // Global slug check is also less relevant for UUIDs but harmless for mock
    const globalSlugExists = mockBlogs.some(blog => blog.slug.toLowerCase() === slug.toLowerCase() && blog.author.username.toLowerCase() !== author!.username.toLowerCase());
    if (globalSlugExists) {
        console.warn(`UUID Slug "${slug}" collision with a different author detected. This is extremely rare.`);
    }


    const newBlog: Blog = {
      id: `blog-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      author,
      title,
      slug, // Use the client-provided UUID slug
      content,
      excerpt: excerpt || undefined,
      coverImageUrl: coverImageUrl || undefined,
      createdAt: new Date().toISOString(),
    };

    mockBlogs.unshift(newBlog); 

    return NextResponse.json(newBlog, { status: 201 });

  } catch (error) {
    console.error('Create Blog API error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred while creating the blog post.' }, { status: 500 });
  }
}
