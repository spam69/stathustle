import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PostModel from '@/models/Post.model';
import type { Post as PostType } from '@/types';

export async function GET(request: Request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ message: 'Search query is required' }, { status: 400 });
    }

    // Search in both content and tags
    const posts = await PostModel.find({
      $or: [
        { content: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } }
      ]
    })
    .populate('author')
    .populate({
      path: 'sharedOriginalPostId',
      populate: { path: 'author' }
    })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

    // Transform posts for client
    const transformedPosts = posts.map(post => ({
      id: post._id.toString(),
      author: {
        id: post.author._id.toString(),
        username: post.author.username,
        profilePictureUrl: post.author.profilePictureUrl,
        isIdentity: post.author.isIdentity || false,
        displayName: post.author.displayName || post.author.username,
      },
      content: post.content || "",
      mediaUrl: post.mediaUrl,
      mediaType: post.mediaType,
      tags: post.tags || [],
      createdAt: post.createdAt?.toISOString(),
      shares: post.shares || 0,
      repliesCount: post.repliesCount || 0,
      sharedOriginalPostId: post.sharedOriginalPostId?._id?.toString(),
      blogShareDetails: post.blogShareDetails,
    }));

    return NextResponse.json(transformedPosts);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ message: 'Error performing search' }, { status: 500 });
  }
} 