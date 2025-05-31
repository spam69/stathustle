
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { User, Post, Comment as CommentType, Identity } from '@/types'; 
import { mockUsers, mockPosts, mockIdentities } from '@/lib/mock-data';
import PostCard from '@/components/post-card';
import UserProfileCard from '@/components/user-profile-card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';

const POSTS_PER_PAGE = 5;

export default function UserProfilePage() {
  const params = useParams();
  const { user: currentUser } = useAuth(); 
  const username = params.username as string;
  const [profileData, setProfileData] = useState<User | Identity | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [visiblePostsCount, setVisiblePostsCount] = useState(POSTS_PER_PAGE);

  useEffect(() => {
    if (username) {
      setLoading(true);
      setVisiblePostsCount(POSTS_PER_PAGE); 
      setTimeout(() => {
        let foundProfile: User | Identity | undefined = mockUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (!foundProfile) {
          foundProfile = mockIdentities.find(i => i.username.toLowerCase() === username.toLowerCase());
        }

        if (foundProfile) {
          setProfileData(foundProfile);
          const postsByAuthor = mockPosts
            .filter(p => p.author.id === foundProfile!.id) // Check against foundProfile's ID
            .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setUserPosts(postsByAuthor);
        } else {
          setProfileData(null); 
        }
        setLoading(false);
      }, 500);
    }
  }, [username]);

  const handleCommentAddedOnProfilePage = (postId: string, commentText: string, parentId?: string) => {
    if (!currentUser) return;

    const newComment: CommentType = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      author: currentUser, // Comment author is always the logged-in user
      content: commentText,
      createdAt: new Date().toISOString(),
      likes: 0,
      ...(parentId && { parentId }),
    };

    setUserPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? {
              ...post,
              comments: [...(post.comments || []), newComment].sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
              repliesCount: (post.repliesCount || 0) + 1,
            }
          : post
      )
    );
  };

  const handleLikeCommentOnProfilePage = (postId: string, commentId: string) => {
    setUserPosts(prevPosts => 
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

  const handleLikePostOnProfilePage = (postId: string) => {
    setUserPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, reactions: (post.reactions || 0) + 1 }
          : post
      )
    );
  };

  const loadMorePosts = () => {
    setVisiblePostsCount(prevCount => prevCount + POSTS_PER_PAGE);
  };

  const displayedPosts = userPosts.slice(0, visiblePostsCount);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <Skeleton className="h-64 w-full mb-6 rounded-lg" /> {/* UserProfileCard Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-lg" />)} {/* PostCard Skeletons */}
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="max-w-3xl mx-auto text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold font-headline">Profile Not Found</h1>
        <p className="text-muted-foreground">The profile for @{username} could not be found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <UserProfileCard profileUser={profileData} />
      
      <h2 className="text-2xl font-bold mt-8 mb-4 font-headline">
        Posts by {profileData.isIdentity ? (profileData as Identity).displayName || profileData.username : profileData.username}
      </h2>
      {displayedPosts.length > 0 ? (
        displayedPosts.map(post => (
          <PostCard 
            key={post.id} 
            post={post} 
            onCommentAdded={handleCommentAddedOnProfilePage}
            onLikeComment={handleLikeCommentOnProfilePage}
            onLikePost={handleLikePostOnProfilePage}
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
  );
}
