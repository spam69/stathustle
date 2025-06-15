"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { User, Post, Comment as CommentType, Identity } from '@/types'; 
import PostCard from '@/components/post-card';
import UserProfileCard from '@/components/user-profile-card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useFeed } from '@/contexts/feed-context'; // For post interactions

const POSTS_PER_PAGE = 5;

const fetchProfile = async (username: string): Promise<User | Identity> => {
  const response = await fetch(`/api/profiles/${username}`);
  if (!response.ok) {
    if (response.status === 404) throw new Error('Profile not found');
    throw new Error('Network response was not ok');
  }
  return response.json();
};

// Fetching posts is now handled by FeedContext, we filter them client-side for this profile page
// If we need specific "user posts" endpoint, that can be added later.

export default function UserProfilePage() {
  const params = useParams();
  const { user: currentUser } = useAuth(); 
  const username = params.username as string;
  
  const { 
    posts: allFeedPosts, 
    addCommentToFeedPost, 
    likeFeedPost, 
    likeFeedComment,
    isPostsLoading: isFeedLoading, // Use feed loading state
  } = useFeed();

  const { data: profileData, isLoading: isProfileLoading, error: profileError } = useQuery<User | Identity, Error>({
    queryKey: ['profile', username],
    queryFn: () => fetchProfile(username),
    enabled: !!username,
  });

  const [profileUser, setProfileUser] = useState<User | Identity | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [visiblePostsCount, setVisiblePostsCount] = useState(POSTS_PER_PAGE);

  // Keep profileUser in sync with profileData
  useEffect(() => {
    if (profileData) setProfileUser(profileData);
  }, [profileData]);

  useEffect(() => {
    if (profileUser && allFeedPosts) {
      const postsByAuthor = allFeedPosts
        .filter(p => p.author.id === profileUser.id)
        .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setUserPosts(postsByAuthor);
    }
  }, [profileUser, allFeedPosts]);

  const loadMorePosts = () => {
    setVisiblePostsCount(prevCount => prevCount + POSTS_PER_PAGE);
  };

  const displayedPosts = userPosts.slice(0, visiblePostsCount);
  
  const isLoading = isProfileLoading || isFeedLoading;

  if (isLoading) {
    return (
      <div className="w-full p-4 md:p-6"> {/* Changed from max-w-3xl mx-auto */}
        <Skeleton className="h-64 w-full mb-6 rounded-lg" /> {/* UserProfileCard Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-lg" />)} {/* PostCard Skeletons */}
        </div>
      </div>
    );
  }

  if (profileError || !profileUser) {
    return (
      <div className="w-full p-4 md:p-6 text-center py-10"> {/* Changed from max-w-3xl mx-auto */}
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold font-headline">Profile Not Found</h1>
        <p className="text-muted-foreground">{profileError ? profileError.message : `The profile for @${username} could not be found.`}</p>
      </div>
    );
  }

  return (
    <div className="w-full"> {/* Removed max-w-3xl mx-auto, padding can be added here or within children as needed */}
      <UserProfileCard profileUser={profileUser} setProfileUser={setProfileUser} />
      
      <div className="p-4 md:p-6"> {/* Added padding for the posts section */}
        <h2 className="text-2xl font-bold mt-8 mb-4 font-headline">
          Posts by {profileUser.isIdentity ? (profileUser as Identity).displayName || profileUser.username : profileUser.username}
        </h2>
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
          <p className="text-muted-foreground text-center py-8">@{profileData.username} hasn't posted anything yet.</p>
        )}

        {visiblePostsCount < userPosts.length && (
          <div className="text-center mt-6">
            <Button onClick={loadMorePosts} variant="outline">
              Load More Posts
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
