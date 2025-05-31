
import { NextResponse } from 'next/server';
import { mockPosts, mockUsers, mockIdentities } from '@/lib/mock-data';
import type { Post, User, Identity } from '@/types';

export async function GET() {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return NextResponse.json(mockPosts.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
}

export async function POST(request: Request) {
  try {
    const { content, authorId, mediaUrl, mediaType } = await request.json();

    if (!content || !authorId) {
      return NextResponse.json({ message: 'Content and authorId are required' }, { status: 400 });
    }

    let author: User | Identity | undefined = mockUsers.find(u => u.id === authorId);
    if (!author) {
      author = mockIdentities.find(i => i.id === authorId);
    }

    if (!author) {
      return NextResponse.json({ message: 'Author not found' }, { status: 404 });
    }

    const newPost: Post = {
      id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      author,
      content,
      createdAt: new Date().toISOString(),
      reactions: 0,
      shares: 0,
      repliesCount: 0,
      comments: [],
      ...(mediaUrl && { mediaUrl }),
      ...(mediaType && { mediaType }),
    };

    mockPosts.unshift(newPost); // Add to the beginning of the array

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error('Create Post API error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}

    