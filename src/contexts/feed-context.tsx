
"use client";

import type { Post, User, Comment as CommentType, Identity } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useAuth } from './auth-context'; // To get current user for posting

interface FeedContextType {
  posts: Post[];
  isCreatePostModalOpen: boolean;
  openCreatePostModal: () => void;
  closeCreatePostModal: () => void;
  publishPost: (content: string, mediaUrl?: string, mediaType?: 'image' | 'gif') => void;
  addCommentToFeedPost: (postId: string, commentText: string, parentId?: string) => void;
  likeFeedPost: (postId: string) => void;
  likeFeedComment: (postId: string, commentId: string) => void;
}

const FeedContext = createContext<FeedContextType | undefined>(undefined);

interface FeedProviderProps {
  children: ReactNode;
  initialPosts: Post[];
}

export const FeedProvider = ({ children, initialPosts }: FeedProviderProps) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);

  const openCreatePostModal = useCallback(() => setIsCreatePostModalOpen(true), []);
  const closeCreatePostModal = useCallback(() => setIsCreatePostModalOpen(false), []);

  const publishPost = useCallback((content: string, mediaUrl?: string, mediaType?: 'image' | 'gif') => {
    if (!user) return; // Should be handled by UI, but good to check

    const newPost: Post = {
      id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      author: user,
      content,
      createdAt: new Date().toISOString(),
      reactions: 0,
      shares: 0,
      repliesCount: 0,
      comments: [],
      ...(mediaUrl && { mediaUrl }),
      ...(mediaType && { mediaType }),
    };

    setPosts(prevPosts => [newPost, ...prevPosts].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    closeCreatePostModal(); // Close modal if open
  }, [user, closeCreatePostModal]);

  const addCommentToFeedPost = useCallback((postId: string, commentText: string, parentId?: string) => {
    if (!user) return;

    const newComment: CommentType = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      author: user,
      content: commentText,
      createdAt: new Date().toISOString(),
      likes: 0,
      ...(parentId && { parentId }),
    };

    setPosts(prevPosts =>
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
  }, [user]);

  const likeFeedPost = useCallback((postId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, reactions: (post.reactions || 0) + 1 } // Basic like increment
          : post
      )
    );
  }, []);

  const likeFeedComment = useCallback((postId: string, commentId: string) => {
    setPosts(prevPosts =>
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
  }, []);

  return (
    <FeedContext.Provider value={{
      posts,
      isCreatePostModalOpen,
      openCreatePostModal,
      closeCreatePostModal,
      publishPost,
      addCommentToFeedPost,
      likeFeedPost,
      likeFeedComment
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
