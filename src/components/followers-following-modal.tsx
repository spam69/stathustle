"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import Link from 'next/link';
import type { User, Identity } from "@/types";
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';

interface FollowersFollowingModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileUser: User | Identity;
  setProfileUser: (user: User | Identity) => void;
  type: 'followers' | 'following';
}

export default function FollowersFollowingModal({ isOpen, onClose, profileUser, setProfileUser, type }: FollowersFollowingModalProps) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<(User | Identity)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followStates, setFollowStates] = useState<Record<string, boolean>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, profileUser, type]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const userIds = type === 'followers' ? profileUser.followers : profileUser.following;
      if (!userIds || userIds.length === 0) {
        setUsers([]);
        return;
      }

      const response = await fetch(`/api/profiles/batch?ids=${userIds.join(',')}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);

      // Initialize follow states
      const states: Record<string, boolean> = {};
      data.forEach((user: User | Identity) => {
        if (currentUser) {
          states[user.id] = user.followers?.includes(currentUser.id) || false;
        }
      });
      setFollowStates(states);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowAction = async (userId: string, action: 'follow' | 'unfollow') => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to follow users and identities.",
        variant: "destructive"
      });
      return;
    }

    setLoadingStates(prev => ({ ...prev, [userId]: true }));
    try {
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          followerId: currentUser.id,
          followerModel: currentUser.isIdentity ? 'Identity' : 'User',
          followingId: userId,
          followingModel: users.find(u => u.id === userId)?.isIdentity ? 'Identity' : 'User',
          action
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to perform follow action');
      }

      setFollowStates(prev => ({ ...prev, [userId]: action === 'follow' }));
      
      // Update parent profileUser state
      setProfileUser(prev => {
        if (!prev) return prev;
        if (type === 'followers') {
          return {
            ...prev,
            followers: action === 'unfollow'
              ? (prev.followers || []).filter(id => id !== userId)
              : [...(prev.followers || []), userId]
          };
        } else {
          return {
            ...prev,
            following: action === 'unfollow'
              ? (prev.following || []).filter(id => id !== userId)
              : [...(prev.following || []), userId]
          };
        }
      });
      
      // Remove user from modal list immediately on unfollow
      if (action === 'unfollow') {
        setUsers(prev => prev.filter(u => u.id !== userId));
      }
      
      toast({
        title: action === 'follow' ? "Following" : "Unfollowed",
        description: `You are now ${action === 'follow' ? 'following' : 'not following'} this user`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform follow action. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [userId]: false }));
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center">
            {type === 'followers' ? 'Followers' : 'Following'}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No {type} yet
            </p>
          ) : (
            <div className="space-y-4">
              {users.map(user => {
                const displayName = user.isIdentity ? (user as Identity).displayName || user.username : user.username;
                const isFollowing = followStates[user.id];
                const isLoading = loadingStates[user.id];

                return (
                  <div key={user.id} className="flex items-center justify-between gap-3">
                    <Link href={`/profile/${user.username}`} className="flex items-center gap-3 flex-1">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.profilePictureUrl} alt={displayName} />
                        <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{displayName}</p>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                      </div>
                    </Link>
                    {currentUser && user.id !== currentUser.id && (
                      <Button
                        variant={isFollowing ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleFollowAction(user.id, isFollowing ? 'unfollow' : 'follow')}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isFollowing ? (
                          <UserMinus className="h-4 w-4" />
                        ) : (
                          <UserPlus className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 