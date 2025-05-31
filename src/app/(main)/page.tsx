"use client";

import { useEffect, useState } from 'react';
import CreatePostForm from '@/components/create-post-form';
import PostCard from '@/components/post-card';
import type { Post as PostType, User } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { mockPosts, mockUser1 } from '@/lib/mock-data'; // Using mockUser1 for initial interests
import { recommendSportsContent, RecommendSportsContentInput } from '@/ai/flows/recommend-sports-content';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default function SocialFeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostType[]>(mockPosts);
  const [recommendedPosts, setRecommendedPosts] = useState<PostType[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [visiblePostsCount, setVisiblePostsCount] = useState(5); // For pagination

  const handlePostCreated = (newPost: PostType) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
    // Potentially refresh recommendations or add to available content for AI
  };

  const fetchRecommendations = async () => {
    if (!user || !user.sportInterests || user.sportInterests.length === 0) {
      // No user or no interests, so no recommendations, or show generic popular posts
      setRecommendedPosts([]);
      return;
    }

    setIsLoadingRecommendations(true);
    setRecommendationError(null);

    try {
      const userInterestsStrings = user.sportInterests.map(interest => `${interest.sport} (${interest.level})`);
      
      // Convert all posts to string representations for the AI
      // In a real app, this might be more sophisticated, like using post titles, summaries, or keywords.
      const availableContent = posts.map(p => `${p.author.username}: ${p.content.substring(0, 100)}...`);

      if (availableContent.length === 0) {
        setRecommendedPosts([]);
        setIsLoadingRecommendations(false);
        return;
      }

      const input: RecommendSportsContentInput = {
        userSportsInterests: userInterestsStrings,
        availableContent: availableContent,
      };
      
      const result = await recommendSportsContent(input);
      
      // Map AI string recommendations back to actual PostType objects
      // This is a simplified mapping. In a real app, AI might return IDs or more structured data.
      const mappedRecommendedPosts = result.recommendedContent.map(contentString => {
        // Find the original post that matches the content string (or part of it)
        return posts.find(p => `${p.author.username}: ${p.content.substring(0, 100)}...` === contentString);
      }).filter((p): p is PostType => p !== undefined); // Type guard to filter out undefined

      setRecommendedPosts(mappedRecommendedPosts);

    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
      setRecommendationError("Could not load personalized recommendations at this time.");
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [user, posts]); // Re-fetch if user or posts change

  const loadMorePosts = () => {
    setVisiblePostsCount(prevCount => prevCount + 5);
  };
  
  const displayedPosts = posts.slice(0, visiblePostsCount);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 font-headline text-primary">Social Feed</h1>
      
      <CreatePostForm onPostCreated={handlePostCreated} />

      {recommendationError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Recommendation Error</AlertTitle>
          <AlertDescription>{recommendationError}</AlertDescription>
        </Alert>
      )}

      {isLoadingRecommendations && (
        <div className="flex justify-center items-center my-6 p-4 border rounded-md bg-card">
          <Loader2 className="h-6 w-6 animate-spin mr-2 text-primary" />
          <p className="text-muted-foreground">Loading personalized recommendations...</p>
        </div>
      )}

      {!isLoadingRecommendations && recommendedPosts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3 font-headline flex items-center">
            For You 
            <Button variant="ghost" size="icon" onClick={fetchRecommendations} className="ml-2">
              <RefreshCw className="h-4 w-4"/>
            </Button>
          </h2>
          {recommendedPosts.map(post => (
            <PostCard key={`rec-${post.id}`} post={post} />
          ))}
          <hr className="my-6 border-border"/>
        </div>
      )}
      
      <h2 className="text-xl font-semibold mb-3 font-headline">Recent Posts</h2>
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
