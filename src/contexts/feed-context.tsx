
"use client";

import type { Post, User, Comment as CommentType, Identity } from '@/types';
import type { ReactionType } from '@/lib/reactions'; // Import ReactionType
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
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
  reactToPost: (data: { postId: string; reactionType: ReactionType | null }) => void; // Updated
  reactToComment: (data: { postId: string; commentId: string; reactionType: ReactionType | null }) => void; // Updated
  isPublishingPost: boolean;
  isCommenting: boolean;
  isReactingToPost: boolean; // Updated
  isReactingToComment: boolean; // Updated
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

// Updated: reactToPostAPI
const reactToPostAPI = async (data: { postId: string; reactionType: ReactionType | null; userId: string }): Promise<Post> => {
  const { postId, ...payload } = data;
  const response = await fetch(`/api/posts/${postId}/react`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload), // userId is part of payload now
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to react to post');
  }
  return response.json();
};

// Updated: reactToCommentAPI
const reactToCommentAPI = async (data: { postId: string; commentId: string; reactionType: ReactionType | null; userId: string }): Promise<Post> => { // API returns whole post
  const { postId, commentId, ...payload } = data;
  const response = await fetch(`/api/posts/${postId}/comments/${commentId}/react`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload), // userId is part of payload now
  });
   if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to react to comment');
  }
  return response.json();
};


interface FeedProviderProps {
  children: ReactNode;
}

export const FeedProvider = ({ children }: FeedProviderProps) => {
  const { user } = useAuth(); // User is always mockAdminUser in current dev setup
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);

  const { data: posts = [], isLoading: isPostsLoading, error: postsError } = useQuery<Post[], Error>({
    queryKey: ['posts'],
    queryKeyHash: 'posts',
    queryFn: fetchPosts,
    staleTime: 1000 * 60 * 1, // 1 minute for faster updates during dev
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
    onSuccess: (newComment, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] }); // Could be more targeted
      toast({ title: "Success", description: "Comment posted!"});
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to post comment.", variant: "destructive" });
    }
  });

  // Updated: reactToPostMutation
  const reactToPostMutation = useMutation<Post, Error, { postId: string; reactionType: ReactionType | null }>({
    mutationFn: (data) => {
      if (!user) throw new Error("User not logged in");
      return reactToPostAPI({ ...data, userId: user.id });
    },
    onSuccess: (updatedPost) => {
      // Optimistically update the specific post in the query cache
      queryClient.setQueryData(['posts'], (oldData: Post[] | undefined) => {
        return oldData?.map(post => post.id === updatedPost.id ? updatedPost : post) || [];
      });
      // Or just invalidate, which is simpler for now
      // queryClient.invalidateQueries({ queryKey: ['posts'] });
      // Toast can be added if desired, e.g., "Reaction updated!"
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to react to post.", variant: "destructive" });
    }
  });

  // Updated: reactToCommentMutation
  const reactToCommentMutation = useMutation<Post, Error, { postId: string; commentId: string; reactionType: ReactionType | null }>({
    mutationFn: (data) => {
      if (!user) throw new Error("User not logged in");
      return reactToCommentAPI({ ...data, userId: user.id });
    },
    onSuccess: (updatedPostContainingComment) => {
       // Optimistically update the specific post in the query cache
      queryClient.setQueryData(['posts'], (oldData: Post[] | undefined) => {
        return oldData?.map(post => post.id === updatedPostContainingComment.id ? updatedPostContainingComment : post) || [];
      });
      // Or just invalidate
      // queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to react to comment.", variant: "destructive" });
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
      reactToPost: reactToPostMutation.mutate,
      reactToComment: reactToCommentMutation.mutate,
      isPublishingPost: publishPostMutation.isPending,
      isCommenting: addCommentMutation.isPending,
      isReactingToPost: reactToPostMutation.isPending,
      isReactingToComment: reactToCommentMutation.isPending,
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
