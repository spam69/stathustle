
import { NextResponse } from 'next/server';
import { mockPosts, mockUsers, mockIdentities, mockAdminUser } from '@/lib/mock-data';
import type { Post, User, Identity, BlogShareDetails } from '@/types';

export async function GET() {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  if (!mockPosts || !Array.isArray(mockPosts)) {
    console.error("[API/POSTS GET] mockPosts is not a valid array or is undefined.");
    return NextResponse.json({ message: 'Error: Could not retrieve posts data.' }, { status: 500 });
  }

  const postsWithPopulatedShares = mockPosts
    .filter(Boolean) // Filter out any potentially null/undefined entries
    .map(post => {
    if (post.sharedOriginalPostId && !post.sharedOriginalPost) {
      const original = mockPosts.find(p => p && p.id === post.sharedOriginalPostId);
      if (original) {
        return { ...post, sharedOriginalPost: original };
      }
    }
    return post;
  }).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  return NextResponse.json(postsWithPopulatedShares);
}

export async function POST(request: Request) {
  try {
    const { content, authorId, mediaUrl, mediaType, sharedOriginalPostId, blogShareDetails } = await request.json() as { 
        content?: string; 
        authorId: string; 
        mediaUrl?: string; 
        mediaType?: 'image' | 'gif';
        sharedOriginalPostId?: string;
        blogShareDetails?: BlogShareDetails;
    };

    if (!authorId && (!content && !sharedOriginalPostId && !blogShareDetails) ) { 
      return NextResponse.json({ message: 'Content, shared post ID, or blog share details are required alongside authorId' }, { status: 400 });
    }
    if(!authorId){
        return NextResponse.json({ message: 'AuthorId is required' }, { status: 400 });
    }

    let author: User | Identity | undefined = mockUsers.find(u => u.id === authorId);
    if (!author) {
      author = mockIdentities.find(i => i.id === authorId);
    }
    if (!author && process.env.NODE_ENV === 'development') {
        console.warn("No authorId provided for new post, defaulting to admin user for development.");
        author = mockAdminUser;
    }

    if (!author) {
      return NextResponse.json({ message: 'Author not found' }, { status: 404 });
    }
    
    let sharedOriginalPostData: Post | undefined = undefined;
    if (sharedOriginalPostId) {
        sharedOriginalPostData = mockPosts.find(p => p.id === sharedOriginalPostId);
        if (!sharedOriginalPostData) {
            console.warn(`Original post with ID ${sharedOriginalPostId} not found for sharing.`);
        }
    }

    const newPost: Post = {
      id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      author,
      content: content || "", 
      createdAt: new Date().toISOString(),
      detailedReactions: [],
      shares: 0,
      repliesCount: 0,
      comments: [],
      ...(mediaUrl && { mediaUrl }),
      ...(mediaType && { mediaType }),
      ...(sharedOriginalPostId && { sharedOriginalPostId }),
      ...(sharedOriginalPostData && { sharedOriginalPost: sharedOriginalPostData }),
      ...(blogShareDetails && { blogShareDetails }), // Store blog share details
    };

    mockPosts.unshift(newPost); 

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error('Create Post API error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}
