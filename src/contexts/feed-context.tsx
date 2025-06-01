
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
  openCreatePostModal: (postToShare?: Post) => void; // Can optionally take a post to share
  closeCreatePostModal: () => void;
  postToShare: Post | null; // State to hold the post being shared

  publishPost: (data: { content: string; mediaUrl?: string; mediaType?: 'image' | 'gif'; sharedOriginalPostId?: string }) => void;
  addCommentToFeedPost: (data: { postId: string; content: string; parentId?: string }) => void;
  reactToPost: (data: { postId: string; reactionType: ReactionType | null }) => void;
  reactToComment: (data: { postId: string; commentId: string; reactionType: ReactionType | null }) => void;
  
  fetchSinglePost: (postId: string) => Promise<Post | null>; // For fetching original shared post

  isPublishingPost: boolean;
  isCommenting: boolean;
  isReactingToPost: boolean;
  isReactingToComment: boolean;
}

const FeedContext = createContext<FeedContextType | undefined>(undefined);

// API interaction functions
const fetchPostsAPI = async (): Promise<Post[]> => {
  const response = await fetch('/api/posts');
  if (!response.ok) throw new Error('Failed to fetch posts');
  const postsData: Post[] = await response.json();
  // Attempt to populate sharedOriginalPost if not already present
  return postsData.map(post => {
    if (post.sharedOriginalPostId && !post.sharedOriginalPost) {
      const original = postsData.find(p => p.id === post.sharedOriginalPostId);
      if (original) {
        return { ...post, sharedOriginalPost: original };
      }
    }
    return post;
  });
};

const createPostAPI = async (newPostData: { content: string; authorId: string; mediaUrl?: string; mediaType?: 'image' | 'gif', sharedOriginalPostId?: string }): Promise<Post> => {
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

const addCommentAPI = async (commentData: { postId: string; content: string; authorId: string; parentId?: string }): Promise<CommentType> => {
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

const reactToPostAPI = async (data: { postId: string; reactionType: ReactionType | null; userId: string }): Promise<Post> => {
  const { postId, ...payload } = data;
  const response = await fetch(`/api/posts/${postId}/react`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to react to post');
  }
  return response.json();
};

const reactToCommentAPI = async (data: { postId: string; commentId: string; reactionType: ReactionType | null; userId: string }): Promise<Post> => {
  const { postId, commentId, ...payload } = data;
  const response = await fetch(`/api/posts/${postId}/comments/${commentId}/react`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
   if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to react to comment');
  }
  return response.json();
};

const fetchSinglePostAPI = async (postId: string): Promise<Post | null> => {
  const response = await fetch(`/api/posts/${postId}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Failed to fetch post ${postId}`);
  }
  return response.json();
};


interface FeedProviderProps {
  children: ReactNode;
}

export const FeedProvider = ({ children }: FeedProviderProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [postToShare, setPostToShare] = useState<Post | null>(null); // For sharing flow

  const { data: posts = [], isLoading: isPostsLoading, error: postsError } = useQuery<Post[], Error>({
    queryKey: ['posts'],
    queryFn: fetchPostsAPI,
    staleTime: 1000 * 60 * 1, 
  });

  const openCreatePostModal = useCallback((postForSharing?: Post) => {
    if (postForSharing) {
      setPostToShare(postForSharing);
    } else {
      setPostToShare(null); // Explicitly set to null if no post is being shared
    }
    setIsCreatePostModalOpen(true);
  }, []);

  const closeCreatePostModal = useCallback(() => {
    setIsCreatePostModalOpen(false);
    setPostToShare(null); // Clear postToShare when modal closes
  }, []);

  const publishPostMutation = useMutation<Post, Error, { content: string; mediaUrl?: string; mediaType?: 'image' | 'gif', sharedOriginalPostId?: string }>({
    mutationFn: (postData) => {
      if (!user) throw new Error("User not logged in");
      return createPostAPI({ ...postData, authorId: user.id });
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
      return addCommentAPI({ ...commentData, authorId: user.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast({ title: "Success", description: "Comment posted!"});
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to post comment.", variant: "destructive" });
    }
  });

  const reactToPostMutation = useMutation<Post, Error, { postId: string; reactionType: ReactionType | null }>({
    mutationFn: (data) => {
      if (!user) throw new Error("User not logged in");
      return reactToPostAPI({ ...data, userId: user.id });
    },
    onSuccess: (updatedPost) => {
      queryClient.setQueryData(['posts'], (oldData: Post[] | undefined) => {
        return oldData?.map(post => post.id === updatedPost.id ? updatedPost : post) || [];
      });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to react to post.", variant: "destructive" });
    }
  });

  const reactToCommentMutation = useMutation<Post, Error, { postId: string; commentId: string; reactionType: ReactionType | null }>({
    mutationFn: (data) => {
      if (!user) throw new Error("User not logged in");
      return reactToCommentAPI({ ...data, userId: user.id });
    },
    onSuccess: (updatedPostContainingComment) => {
      queryClient.setQueryData(['posts'], (oldData: Post[] | undefined) => {
        return oldData?.map(post => post.id === updatedPostContainingComment.id ? updatedPostContainingComment : post) || [];
      });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to react to comment.", variant: "destructive" });
    }
  });

  const fetchSinglePost = useCallback(async (postId: string): Promise<Post | null> => {
    try {
      // Check cache first
      const cachedPosts = queryClient.getQueryData<Post[]>(['posts']);
      const cachedPost = cachedPosts?.find(p => p.id === postId);
      if (cachedPost) {
        // If it's a share and original data is missing, try to find it in cache
        if (cachedPost.sharedOriginalPostId && !cachedPost.sharedOriginalPost) {
            const original = cachedPosts?.find(p => p.id === cachedPost.sharedOriginalPostId);
            if (original) return {...cachedPost, sharedOriginalPost: original };
        }
        return cachedPost;
      }
      // Fetch from API if not in cache
      const post = await fetchSinglePostAPI(postId);
      if (post) {
         // If the fetched post is a share, try to fetch its original post if not embedded
        if (post.sharedOriginalPostId && !post.sharedOriginalPost) {
            const original = await fetchSinglePostAPI(post.sharedOriginalPostId);
            if (original) post.sharedOriginalPost = original;
        }
        // Optionally update cache here, though PostCard will manage its own state for display
      }
      return post;
    } catch (error) {
      console.error("Error fetching single post:", error);
      toast({ title: "Error", description: `Could not fetch post details for ${postId}.`, variant: "destructive"});
      return null;
    }
  }, [queryClient, toast]);


  return (
    <FeedContext.Provider value={{
      posts,
      isPostsLoading,
      postsError,
      isCreatePostModalOpen,
      openCreatePostModal,
      closeCreatePostModal,
      postToShare, // Provide postToShare to consumers
      publishPost: publishPostMutation.mutate,
      addCommentToFeedPost: addCommentMutation.mutate,
      reactToPost: reactToPostMutation.mutate,
      reactToComment: reactToCommentMutation.mutate,
      fetchSinglePost,
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

