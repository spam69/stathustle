
"use client";

import type { Post as PostType } from '@/types';
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FeedContextType {
  isCreatePostModalOpen: boolean;
  openCreatePostModal: () => void;
  closeCreatePostModal: () => void;
  publishPost: (newPost: PostType) => void;
}

const FeedContext = createContext<FeedContextType | undefined>(undefined);

export const FeedProvider = ({ children, initialPosts, setInitialPosts }: { children: ReactNode, initialPosts: PostType[], setInitialPosts: React.Dispatch<React.SetStateAction<PostType[]>> }) => {
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);

  const openCreatePostModal = () => setIsCreatePostModalOpen(true);
  const closeCreatePostModal = () => setIsCreatePostModalOpen(false);

  const publishPost = (newPost: PostType) => {
    // This function is now responsible for updating the posts list
    // which is managed by SocialFeedPage.
    // The SocialFeedPage will pass its 'setPosts' function or a wrapper.
    // For now, we'll assume the component using this provider handles the actual state update.
    // This context primarily handles modal state and the trigger for adding a post.
    setInitialPosts(prevPosts => [newPost, ...prevPosts].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    closeCreatePostModal(); // Close modal after publishing
  };

  return (
    <FeedContext.Provider value={{ isCreatePostModalOpen, openCreatePostModal, closeCreatePostModal, publishPost }}>
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
