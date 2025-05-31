
"use client";

import { useEffect, useState } from 'react';
import CreatePostForm from '@/components/create-post-form';
import PostCard from '@/components/post-card';
import type { Post as PostType, User, Comment as CommentType } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { mockPosts } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SocialFeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostType[]>(mockPosts);
  const [visiblePostsCount, setVisiblePostsCount] = useState(5); // For pagination

  const handlePostCreated = (newPost: PostType) => {
    setPosts(prevPosts => [newPost, ...prevPosts].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const handleCommentAdded = (postId: string, commentText: string, parentId?: string) => {
    if (!user) return; 

    const newComment: CommentType = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      author: user, 
      content: commentText,
      createdAt: new Date().toISOString(),
      likes: 0,
      ...(parentId && { parentId }),
    };

    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? {
              ...post,
              comments: [...(post.comments || []), newComment].sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()), // Keep flat list sorted by creation for now
              repliesCount: (post.repliesCount || 0) + 1,
            }
          : post
      )
    );
  };
  
  const handleLikeComment = (postId: string, commentId: string) => {
    setPosts(prevPosts => 
      prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: (post.comments || []).map(comment => 
              comment.id === commentId 
                ? { ...comment, likes: (comment.likes || 0) + 1 }
                : comment
            )
          };
        }
        return post;
      })
    );
  };

  const handleLikePost = (postId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, reactions: (post.reactions || 0) + 1 }
          : post
      )
    );
  };


  const loadMorePosts = () => {
    setVisiblePostsCount(prevCount => prevCount + 5);
  };
  
  const displayedPosts = posts.slice(0, visiblePostsCount);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 font-headline text-primary">Social Feed</h1>
      
      <CreatePostForm onPostCreated={handlePostCreated} />
      
      <h2 className="text-xl font-semibold mt-8 mb-3 font-headline">Recent Posts</h2>
      {displayedPosts.length > 0 ? (
        displayedPosts.map(post => (
          <PostCard 
            key={post.id} 
            post={post} 
            onCommentAdded={handleCommentAdded}
            onLikeComment={handleLikeComment}
            onLikePost={handleLikePost}
          />
        ))
      ) : (
        <p className="text-muted-foreground text-center py-8">No posts yet. Be the first to share!</p>
      )}

      {visiblePostsCount < posts.length && (
        <div className="text-center mt-6">
          <Button onClick={loadMorePosts} variant="outline">
            Load More Posts
          </Button>
        </div>
      )}
    </div>
  );
}
