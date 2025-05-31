"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { User, Post } from '@/types';
import { mockUsers, mockPosts } from '@/lib/mock-data';
import PostCard from '@/components/post-card';
import UserProfileCard from '@/components/user-profile-card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (username) {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        const foundUser = mockUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (foundUser) {
          setProfileUser(foundUser);
          const postsByUser = mockPosts.filter(p => p.author.id === foundUser.id);
          setUserPosts(postsByUser);
        } else {
          setProfileUser(null); // User not found
        }
        setLoading(false);
      }, 500);
    }
  }, [username]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <Skeleton className="h-64 w-full mb-6 rounded-lg" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="max-w-3xl mx-auto text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold font-headline">User Not Found</h1>
        <p className="text-muted-foreground">The profile for @{username} could not be found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <UserProfileCard profileUser={profileUser} />
      
      <h2 className="text-2xl font-bold mt-8 mb-4 font-headline">Posts by {profileUser.username}</h2>
      {userPosts.length > 0 ? (
        userPosts.map(post => (
          <PostCard key={post.id} post={post} />
        ))
      ) : (
        <p className="text-muted-foreground text-center py-8">@{profileUser.username} hasn't posted anything yet.</p>
      )}
    </div>
  );
}
