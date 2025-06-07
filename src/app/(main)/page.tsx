
"use client";

import { useState } from 'react';
import CreatePostForm from '@/components/create-post-form';
import PostCard from '@/components/post-card';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { useFeed } from '@/contexts/feed-context';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, RefreshCw } from 'lucide-react'; // Added RefreshCw

// This component now becomes the default export
export default function SocialFeedPageContent() {
  const { user } = useAuth();
  const { 
    posts: feedPosts, 
    publishPost, 
    addCommentToFeedPost, 
    reactToPost, // Updated from likeFeedPost
    reactToComment, // Updated from likeFeedComment
    isPostsLoading,
    postsError,
    isPublishingPost,
  } = useFeed();
  
  const [visiblePostsCount, setVisiblePostsCount] = useState(5);
  const [isRefreshing, setIsRefreshing] = useState(false); // For manual refresh

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refetch or re-evaluation of posts
    // In a real app: await queryClient.invalidateQueries(['posts']);
    await new Promise(resolve => setTimeout(resolve, 700)); // Simulate network delay
    // Forcing a re-slice for mock:
    setVisiblePostsCount(0); 
    setTimeout(() => setVisiblePostsCount(5), 50); // Trigger re-slicing
    setIsRefreshing(false);
  };

  const handleInlinePostCreated = (newPostData: {content: string; mediaUrl?: string; mediaType?: "image" | "gif"}) => {
    publishPost(newPostData);
  };
  
  const loadMorePosts = () => {
    setVisiblePostsCount(prevCount => prevCount + 5);
  };
  
  const displayedPosts = feedPosts.slice(0, visiblePostsCount);

  if (isPostsLoading && !isRefreshing) { // Don't show main skeleton if only refreshing
    return (
      <div className="w-full border-x border-border min-h-screen"> {/* Removed max-w-2xl mx-auto */}
        <header className="sticky top-0 z-10 backdrop-blur-md bg-background/80 p-4 border-b border-border">
          <h1 className="text-xl font-bold font-headline text-foreground">Home</h1>
        </header>
        {user && <div className="p-4 border-b border-border"><Skeleton className="h-40 w-full rounded-lg" /></div> }
        <div className="p-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="mb-0.5 p-4 border-b border-border bg-transparent">
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="h-10 w-10 rounded-full" />
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
      </div>
    );
  }

  if (postsError && !isRefreshing) {
    return (
      <div className="w-full border-x border-border min-h-screen"> {/* Removed max-w-2xl mx-auto */}
         <header className="sticky top-0 z-10 backdrop-blur-md bg-background/80 p-4 border-b border-border">
          <h1 className="text-xl font-bold font-headline text-foreground">Home</h1>
        </header>
        <div className="p-6 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-bold font-headline">Error Loading Feed</h2>
          <p className="text-muted-foreground">{postsError.message}</p>
          <Button onClick={handleRefresh} variant="outline" className="mt-4">
             <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full border-x border-border min-h-screen"> {/* Removed max-w-2xl mx-auto */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-background/80 p-4 border-b border-border flex justify-between items-center">
        <h1 className="text-xl font-bold font-headline text-foreground">Home</h1>
        <Button onClick={handleRefresh} variant="ghost" size="icon" disabled={isRefreshing} aria-label="Refresh feed">
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} />
        </Button>
      </header>
      
      {user && (
        <div className="p-0 border-b border-border"> {/* No padding for CreatePostForm card */}
            <CreatePostForm onPostCreated={handleInlinePostCreated} isSubmitting={isPublishingPost} /> 
        </div>
      )}
      
      {/* Recent Posts title removed to match Twitter-like UI */}
      {displayedPosts.length > 0 ? (
        displayedPosts.map(post => (
          <PostCard 
            key={post.id} 
            post={post}
          />
        ))
      ) : (
        <p className="text-muted-foreground text-center py-12">No posts yet. Be the first to share!</p>
      )}

      {visiblePostsCount < feedPosts.length && (
        <div className="text-center py-6 border-t border-border">
          <Button onClick={loadMorePosts} variant="outline" className="rounded-full">
            Load More Posts
          </Button>
        </div>
      )}
    </div>
  );
}

// The old SocialFeedPage wrapper is no longer needed as SocialFeedPageContent is now the default export.
// export default function SocialFeedPage() {
//   return <SocialFeedPageContent />;
// }
