
"use client";

import { useState } from 'react';
import CreatePostForm from '@/components/create-post-form';
import PostCard from '@/components/post-card';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { useFeed } from '@/contexts/feed-context';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';

function SocialFeedContent() {
  const { user } = useAuth();
  const { 
    posts: feedPosts, 
    publishPost, 
    addCommentToFeedPost, 
    likeFeedPost, 
    likeFeedComment,
    isPostsLoading,
    postsError,
    isPublishingPost,
  } = useFeed();
  
  const [visiblePostsCount, setVisiblePostsCount] = useState(5);

  const handleInlinePostCreated = (newPostData: {content: string; mediaUrl?: string; mediaType?: "image" | "gif"}) => {
    publishPost(newPostData); // publishPost from context
    // Toast is handled within the mutation's onSuccess in FeedContext
  };
  
  const loadMorePosts = () => {
    setVisiblePostsCount(prevCount => prevCount + 5);
  };
  
  const displayedPosts = feedPosts.slice(0, visiblePostsCount);

  if (isPostsLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 font-headline text-primary">Social Feed</h1>
        {user && <Skeleton className="h-48 w-full mb-6 rounded-lg" /> }
        <h2 className="text-xl font-semibold mt-8 mb-3 font-headline">Recent Posts</h2>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="mb-4 p-4 border rounded-lg shadow-sm bg-card">
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6 mb-3" />
            <Skeleton className="h-32 w-full rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (postsError) {
    return (
      <div className="max-w-2xl mx-auto text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold font-headline">Error Loading Feed</h1>
        <p className="text-muted-foreground">{postsError.message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 font-headline text-primary">Social Feed</h1>
      
      {user && <CreatePostForm onPostCreated={handleInlinePostCreated} isSubmitting={isPublishingPost} /> }
      
      <h2 className="text-xl font-semibold mt-8 mb-3 font-headline">Recent Posts</h2>
      {displayedPosts.length > 0 ? (
        displayedPosts.map(post => (
          <PostCard 
            key={post.id} 
            post={post} 
            onCommentAdded={(postId, content, parentId) => addCommentToFeedPost({ postId, content, parentId })}
            onLikeComment={(postId, commentId) => likeFeedComment({ postId, commentId })}
            onLikePost={likeFeedPost}
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
  return <SocialFeedContent />;
}

    