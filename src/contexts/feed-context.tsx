
"use client";

import type { Post, User, Comment as CommentType, Identity } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useAuth } from './auth-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface FeedContextType {
  posts: Post[];
  isPostsLoading: boolean;
  postsError: Error | null;
  isCreatePostModalOpen: boolean;
  openCreatePostModal: () => void;
  closeCreatePostModal: () => void;
  publishPost: (data: { content: string; mediaUrl?: string; mediaType?: 'image' | 'gif' }) => void;
  addCommentToFeedPost: (data: { postId: string; content: string; parentId?: string }) => void;
  likeFeedPost: (postId: string) => void;
  likeFeedComment: (data: { postId: string; commentId: string }) => void;
  isPublishingPost: boolean;
  isCommenting: boolean;
  isLikingPost: boolean;
  isLikingComment: boolean;
}

const FeedContext = createContext<FeedContextType | undefined>(undefined);

// API interaction functions
const fetchPosts = async (): Promise<Post[]> => {
  const response = await fetch('/api/posts');
  if (!response.ok) throw new Error('Failed to fetch posts');
  return response.json();
};

const createPost = async (newPostData: { content: string; authorId: string; mediaUrl?: string; mediaType?: 'image' | 'gif' }): Promise<Post> => {
  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newPostData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create post');
  }
  return response.json();
};

const addComment = async (commentData: { postId: string; content: string; authorId: string; parentId?: string }): Promise<CommentType> => {
  const { postId, ...payload } = commentData;
  const response = await fetch(`/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to add comment');
  }
  return response.json();
};

const likePost = async (postId: string): Promise<Post> => {
  const response = await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed to like post');
  return response.json();
};

const likeComment = async (ids: { postId: string; commentId: string }): Promise<CommentType> => {
  const response = await fetch(`/api/posts/${ids.postId}/comments/${ids.commentId}/like`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed to like comment');
  return response.json();
};


interface FeedProviderProps {
  children: ReactNode;
  // initialPosts prop removed as we fetch from API
}

export const FeedProvider = ({ children }: FeedProviderProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);

  const { data: posts = [], isLoading: isPostsLoading, error: postsError } = useQuery<Post[], Error>({
    queryKey: ['posts'],
    queryKeyHash: 'posts',
    queryFn: fetchPosts,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const openCreatePostModal = useCallback(() => setIsCreatePostModalOpen(true), []);
  const closeCreatePostModal = useCallback(() => setIsCreatePostModalOpen(false), []);

  const publishPostMutation = useMutation<Post, Error, { content: string; mediaUrl?: string; mediaType?: 'image' | 'gif' }>({
    mutationFn: (postData) => {
      if (!user) throw new Error("User not logged in");
      return createPost({ ...postData, authorId: user.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      closeCreatePostModal();
      toast({ title: "Success", description: "Your post has been published!" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to publish post.", variant: "destructive" });
    }
  });

  const addCommentMutation = useMutation<CommentType, Error, { postId: string; content: string; parentId?: string }>({
    mutationFn: (commentData) => {
      if (!user) throw new Error("User not logged in");
      return addComment({ ...commentData, authorId: user.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast({ title: "Success", description: "Comment posted!"});
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to post comment.", variant: "destructive" });
    }
  });

  const likePostMutation = useMutation<Post, Error, string>({
    mutationFn: likePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      // toast({ title: "Success", description: "Post liked!" }); // Optional: can be too noisy
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to like post.", variant: "destructive" });
    }
  });

  const likeCommentMutation = useMutation<CommentType, Error, { postId: string; commentId: string }>({
    mutationFn: likeComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      // toast({ title: "Success", description: "Comment liked!" }); // Optional
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to like comment.", variant: "destructive" });
    }
  });


  return (
    <FeedContext.Provider value={{
      posts,
      isPostsLoading,
      postsError,
      isCreatePostModalOpen,
      openCreatePostModal,
      closeCreatePostModal,
      publishPost: publishPostMutation.mutate,
      addCommentToFeedPost: addCommentMutation.mutate,
      likeFeedPost: likePostMutation.mutate,
      likeFeedComment: likeCommentMutation.mutate,
      isPublishingPost: publishPostMutation.isPending,
      isCommenting: addCommentMutation.isPending,
      isLikingPost: likePostMutation.isPending,
      isLikingComment: likeCommentMutation.isPending,
    }}>
      {children}
    </FeedContext.Provider>
  );
};

export const useFeed = () => {
  const context = useContext(FeedContext);
  if (context === undefined) {
    throw new Error('useFeed must be used within a FeedProvider');
  }
  return context;
};

    