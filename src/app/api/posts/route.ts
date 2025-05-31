
import { NextResponse } from 'next/server';
import { mockPosts, mockUsers, mockIdentities, mockAdminUser } from '@/lib/mock-data';
import type { Post, User, Identity } from '@/types';

export async function GET() {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  // Attempt to populate sharedOriginalPost if not already present in mockPosts before returning
  const postsWithPopulatedShares = mockPosts.map(post => {
    if (post.sharedOriginalPostId && !post.sharedOriginalPost) {
      const original = mockPosts.find(p => p.id === post.sharedOriginalPostId);
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
    const { content, authorId, mediaUrl, mediaType, sharedOriginalPostId } = await request.json();

    if (!content && !sharedOriginalPostId) { // Content can be empty if it's just a share
      return NextResponse.json({ message: 'Content or a shared post ID is required' }, { status: 400 });
    }
    if(!authorId){
        return NextResponse.json({ message: 'AuthorId is required' }, { status: 400 });
    }


    let author: User | Identity | undefined = mockUsers.find(u => u.id === authorId);
    if (!author) {
      author = mockIdentities.find(i => i.id === authorId);
    }
     // Fallback to admin user if no authorId provided for dev (SHOULD NOT HAPPEN IN PROD)
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
            // Optionally, handle if original post to share is not found, e.g., return error
            // For now, we'll allow sharing a non-existent post ID, it just won't render the embed.
            console.warn(`Original post with ID ${sharedOriginalPostId} not found for sharing.`);
        }
    }


    const newPost: Post = {
      id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      author,
      content: content || "", // Content can be empty if it's purely a share
      createdAt: new Date().toISOString(),
      detailedReactions: [],
      shares: 0,
      repliesCount: 0,
      comments: [],
      ...(mediaUrl && { mediaUrl }),
      ...(mediaType && { mediaType }),
      ...(sharedOriginalPostId && { sharedOriginalPostId }),
      ...(sharedOriginalPostData && { sharedOriginalPost: sharedOriginalPostData }), // Embed full data if found
    };

    mockPosts.unshift(newPost); // Add to the beginning of the array

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error('Create Post API error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}
