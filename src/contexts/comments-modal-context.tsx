"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Post, User, Identity } from '@/types';

interface CommentsModalContextType {
  isCommentsModalOpen: boolean;
  currentPostId: string | null;
  currentUser: User | Identity | null;
  highlightedCommentId?: string;
  openCommentsModal: (postId: string, user: User | Identity, highlightedCommentId?: string) => void;
  closeCommentsModal: () => void;
}

const CommentsModalContext = createContext<CommentsModalContextType | undefined>(undefined);

export const CommentsModalProvider = ({ children }: { children: ReactNode }) => {
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | Identity | null>(null);
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | undefined>(undefined);

  const openCommentsModal = useCallback((postId: string, user: User | Identity, highlightedCommentId?: string) => {
    setCurrentPostId(postId);
    setCurrentUser(user);
    setHighlightedCommentId(highlightedCommentId);
    setIsCommentsModalOpen(true);
  }, []);

  const closeCommentsModal = useCallback(() => {
    setIsCommentsModalOpen(false);
    setCurrentPostId(null);
    setCurrentUser(null);
    setHighlightedCommentId(undefined);
  }, []);

  return (
    <CommentsModalContext.Provider value={{
      isCommentsModalOpen,
      currentPostId,
      currentUser,
      highlightedCommentId,
      openCommentsModal,
      closeCommentsModal,
    }}>
      {children}
    </CommentsModalContext.Provider>
  );
};

export const useCommentsModal = () => {
  const context = useContext(CommentsModalContext);
  if (context === undefined) {
    throw new Error('useCommentsModal must be used within a CommentsModalProvider');
  }
  return context;
}; 