import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Message, Conversation, UserSearchResult } from '@/types/messaging';
import { useAuth } from './auth-context';
import { useMessaging } from '@/hooks/useMessaging';

interface MessagingContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  unreadCount: number;
  isConnected: boolean;
  searchUsers: (query: string) => Promise<UserSearchResult[]>;
  sendMessage: (content: string, type: 'text' | 'file' | 'gif', file?: File) => Promise<void>;
  startConversation: (userId: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  setCurrentConversation: (conversation: Conversation | null) => void;
  isMessagingOpen: boolean;
  openMessagingModal: () => void;
  closeMessagingModal: () => void;
}

const MessagingContext = createContext<ReturnType<typeof useMessaging> | undefined>(undefined);

export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const messaging = useMessaging();

  return (
    <MessagingContext.Provider value={messaging}>
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessagingContext() {
  const context = useContext(MessagingContext);
  if (context === undefined) {
    throw new Error('useMessagingContext must be used within a MessagingProvider');
  }
  return context;
} 