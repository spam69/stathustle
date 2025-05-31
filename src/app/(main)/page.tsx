
"use client";

import { useEffect, useState } from 'react';
import CreatePostForm from '@/components/create-post-form';
import PostCard from '@/components/post-card';
import type { Post as PostType } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { useFeed } from '@/contexts/feed-context'; // Import useFeed
import { useToast } from '@/hooks/use-toast';

function SocialFeedContent() {
  const { user } = useAuth();
  const { 
    posts: feedPosts, // Renamed to avoid conflict with local state if any
    publishPost, 
    addCommentToFeedPost, 
    likeFeedPost, 
    likeFeedComment 
  } = useFeed(); // Use context
  const { toast } = useToast();

  const [visiblePostsCount, setVisiblePostsCount] = useState(5);

  const handleInlinePostCreated = (newPostData: {content: string; mediaUrl?: string; mediaType?: "image" | "gif"}) => {
    publishPost(newPostData.content, newPostData.mediaUrl, newPostData.mediaType);
    toast({ title: "Success", description: "Your post has been published!" });
  };
  
  const loadMorePosts = () => {
    setVisiblePostsCount(prevCount => prevCount + 5);
  };
  
  // Use posts from context
  const displayedPosts = feedPosts.slice(0, visiblePostsCount);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 font-headline text-primary">Social Feed</h1>
      
      {user && <CreatePostForm onPostCreated={handleInlinePostCreated} /> }
      
      <h2 className="text-xl font-semibold mt-8 mb-3 font-headline">Recent Posts</h2>
      {displayedPosts.length > 0 ? (
        displayedPosts.map(post => (
          <PostCard 
            key={post.id} 
            post={post} 
            onCommentAdded={addCommentToFeedPost} // Use context function
            onLikeComment={likeFeedComment} // Use context function
            onLikePost={likeFeedPost} // Use context function
          />
        ))
      ) : (
        <p className="text-muted-foreground text-center py-8">No posts yet. Be the first to share!</p>
      )}

      {visiblePostsCount < feedPosts.length && (
        <div className="text-center mt-6">
          <Button onClick={loadMorePosts} variant="outline">
            Load More Posts
          </Button>
        </div>
      )}
    </div>
  );
}

export default function SocialFeedPage() {
  // FeedProvider is now in MainLayout, so it's not needed here directly.
  // SocialFeedContent will consume the context.
  return (
      <SocialFeedContent />
  );
}
