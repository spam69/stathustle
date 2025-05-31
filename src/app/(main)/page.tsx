
"use client";

import { useEffect, useState } from 'react';
import CreatePostForm from '@/components/create-post-form';
import PostCard from '@/components/post-card';
import type { Post as PostType, User, Comment as CommentType } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { mockPosts, mockUser1 } from '@/lib/mock-data'; // Assuming mockUser1 can be the current user for new comments
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

  const handleCommentAdded = (postId: string, commentText: string) => {
    if (!user) return; // Should be handled by PostCard, but good to double check

    const newComment: CommentType = {
      id: `comment-${Date.now()}`,
      author: user, // Use the currently logged-in user
      content: commentText,
      createdAt: new Date().toISOString(),
    };

    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? {
              ...post,
              comments: [...(post.comments || []), newComment],
              repliesCount: (post.comments?.length || 0) + 1, // Update repliesCount
            }
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
          <PostCard key={post.id} post={post} onCommentAdded={handleCommentAdded} />
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
