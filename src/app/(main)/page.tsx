
"use client";

import { useEffect, useState } from 'react';
import CreatePostForm from '@/components/create-post-form';
import PostCard from '@/components/post-card';
import type { Post as PostType, User } from '@/types';
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
    setPosts(prevPosts => [newPost, ...prevPosts]);
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
          <PostCard key={post.id} post={post} />
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
