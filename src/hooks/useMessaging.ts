import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/contexts/auth-context';
import { Message, Conversation, UserSearchResult } from '@/types/messaging';
import { useToast } from '@/hooks/use-toast';

export function useMessaging() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const totalUnread = conversations.reduce(
      (acc, conv) => acc + (conv.unreadCount || 0),
      0
    );
    setUnreadCount(totalUnread);
  }, [conversations]);

  const openMessagingModal = useCallback(() => setIsMessagingOpen(true), []);
  const closeMessagingModal = useCallback(() => {
    setIsMessagingOpen(false);
    setCurrentConversation(null);
    setMessages([]);
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user) {
      console.log('[Client] No user found, skipping WebSocket connection');
      return;
    }

    console.log('[Client] Initializing WebSocket connection for user:', user.id);

    const newSocket = io({
      path: '/api/ws',
      auth: { userId: user.id },
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('[Client] WebSocket connected successfully');
      console.log('[Client] Socket ID:', newSocket.id);
      newSocket.emit('join', user.id);
      console.log('[Client] Emitted join event for user:', user.id);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('[Client] WebSocket disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('[Client] WebSocket connection error:', error);
      setIsConnected(false);
    });

    newSocket.on('message', (message: Message & { clientMessageId?: string }) => {
      console.log('[Client] Received message from server:', message);
      
      setMessages(prev => {
        // If clientMessageId is present, we try to replace an optimistic message.
        if (message.clientMessageId) {
          const optimisticMessageExists = prev.some(m => m.id === message.clientMessageId);
          
          // If the optimistic message is found, replace it.
          if (optimisticMessageExists) {
            return prev.map(m =>
              m.id === message.clientMessageId ? message : m
            );
          }
        }

        // If we're here, it's a new message for the receiver.
        // We still need to prevent duplicates in case of weird network conditions.
        const messageExists = prev.some(m => m.id === message.id);
        if (messageExists) {
          return prev; // Do nothing if the message is already in the list.
        }
        
        // Otherwise, append the new message.
        return [...prev, message];
      });

      updateConversationWithMessage(message);
    });

    newSocket.on('online-users', (users: string[]) => {
      console.log('[Client] Received online users list:', users);
      setOnlineUsers(new Set(users));
    });

    newSocket.on('user-online', (userId: string) => {
      console.log('[Client] User came online:', userId);
      setOnlineUsers(prev => new Set(prev).add(userId));
    });

    newSocket.on('user-offline', (userId: string) => {
      console.log('[Client] User went offline:', userId);
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    newSocket.on('conversation', (conversationUpdate: Partial<Conversation> & { unreadCounts?: Record<string, number> }) => {
      console.log('[Client] Received conversation update:', conversationUpdate);
      setConversations(prev => {
        const index = prev.findIndex(c => c.id === conversationUpdate.id);

        if (index === -1) {
          console.warn(`[Client] Received conversation update for a conversation not in state: ${conversationUpdate.id}`);
          return prev;
        }

        const updated = [...prev];
        const existingConversation = updated[index];
        
        let newUnreadCount = existingConversation.unreadCount;
        if (conversationUpdate.unreadCounts && user) {
          if (typeof conversationUpdate.unreadCounts[user.id] === 'number') {
            newUnreadCount = conversationUpdate.unreadCounts[user.id];
          }
        }

        updated[index] = {
          ...existingConversation,
          ...conversationUpdate,
          unreadCount: newUnreadCount,
        };

        return updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      });
    });

    setSocket(newSocket);

    // Load initial conversations
    fetchConversations();

    return () => {
      console.log('[Client] Cleaning up WebSocket connection');
      newSocket.close();
    };
    // eslint-disable-next-line
  }, [user]);

  // Mark messages as read
  const markAsRead = useCallback((conversationId: string) => {
    if (socket) {
      socket.emit('read', { conversationId });
    }
  }, [socket]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      console.log('[Client] Fetching conversations for user:', user?.id);
      const response = await fetch('/api/conversations', {
        headers: {
          'x-authorized': 'true',
          'x-user-id': user?.id || ''
        }
      });
      if (!response.ok) throw new Error('Failed to fetch conversations');
      const data = await response.json();
      console.log('[Client] Fetched conversations:', data.conversations);
      setConversations(data.conversations);
    } catch (error) {
      console.error('[Client] Error fetching conversations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversations',
        variant: 'destructive'
      });
    }
  }, [user, toast]);

  // Update conversation with new message
  const updateConversationWithMessage = useCallback((message: Message) => {
    console.log('[Client] Updating conversation with message:', message);
    
    // If the message is for the currently open conversation, mark it as read immediately.
    if (currentConversation?.id && currentConversation.id === message.conversationId && message.receiverId === user?.id) {
      markAsRead(currentConversation.id);
    }

    setConversations(prev => {
      const conversation = prev.find(c =>
        c.participants &&
        c.participants.includes(message.senderId) &&
        c.participants.includes(message.receiverId)
      );

      if (!conversation) {
        console.log('[Client] No conversation found for message, fetching all conversations again.');
        fetchConversations();
        return prev;
      }

      const updatedConversation = {
        ...conversation,
        lastMessage: message,
        updatedAt: new Date(),
        unreadCount: conversation.unreadCount,
      };
      
      const filtered = prev.filter(c => c.id !== conversation.id);
      return [updatedConversation, ...filtered];
    });
  }, [user, fetchConversations, currentConversation, markAsRead]);

  // Update conversations with online status
  useEffect(() => {
    setConversations(prev =>
      prev.map(c => {
        const participantId = c.participants.find(p => p !== user?.id);
        if (participantId && c.participant) {
          return {
            ...c,
            participant: {
              ...c.participant,
              isOnline: onlineUsers.has(participantId),
            }
          };
        }
        return c;
      })
    );
  }, [onlineUsers, user]);

  useEffect(() => {
    if (currentConversation) {
      const participantId = currentConversation.participants.find(p => p !== user?.id);
      if (participantId && currentConversation.participant) {
        setCurrentConversation(prev => {
          if (!prev || !prev.participant) return prev;
          const isOnline = onlineUsers.has(participantId);
          if (prev.participant.isOnline === isOnline) return prev;
          
          return {
            ...prev,
            participant: {
              ...prev.participant,
              isOnline,
            }
          };
        });
      }
    }
  }, [onlineUsers, user, currentConversation]);

  useEffect(() => {
    if (socket && user) {
      const handleMessage = (message: Message & { clientMessageId: string }) => {
        console.log('[Client] Received message:', message);

        if (message.clientMessageId) {
          setMessages(prev =>
            prev.map(m =>
              m.id === message.clientMessageId ? { ...message, id: message.id } : m
            )
          );
        } else if (message.receiverId === user.id) {
          // If the message is for the current user and it's not an optimistic one
          if (currentConversation?.id === message.conversationId) {
            setMessages(prev => [...prev, message]);
          }
        }
        
        updateConversationWithMessage(message);
      };

      socket.on('message', handleMessage);

      return () => {
        socket.off('message', handleMessage);
      };
    }
  }, [socket, user, currentConversation, updateConversationWithMessage]);

  // Search users
  const searchUsers = async (query: string): Promise<UserSearchResult[]> => {
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
        headers: { 
          'x-authorized': 'true',
          'x-user-id': user?.id || ''
        }
      });
      if (!response.ok) throw new Error('Failed to search users');
      return response.json();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to search users',
        variant: 'destructive'
      });
      return [];
    }
  };

  // Send message
  const sendMessage = async (content: string, type: 'text' | 'file' | 'gif', file?: File) => {
    if (!socket || !currentConversation) {
      console.log('[Client] Cannot send message - socket or conversation not available');
      console.log('[Client] Socket available:', !!socket);
      console.log('[Client] Current conversation:', currentConversation);
      return;
    }
    
    try {
      console.log('[Client] Sending message:', { content, type, currentConversation });
      
      let fileUrl;
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('/api/chat/upload', {
          method: 'POST',
          body: formData,
          headers: {
            'x-authorized': 'true',
            'x-user-id': user?.id || ''
          }
        });
        if (!response.ok) throw new Error('Failed to upload file');
        const data = await response.json();
        fileUrl = data.url;
      }
      
      const receiverId = currentConversation.participants.find(p => p !== user?.id);
      console.log('[Client] Message receiver ID:', receiverId);
      
      const clientMessageId = uuidv4();
      const message: Partial<Message> & { clientMessageId: string } = {
        content,
        type,
        fileUrl,
        fileName: file?.name,
        fileType: file?.type,
        fileSize: file?.size,
        receiverId,
        clientMessageId
      };
      
      const optimisticMessage: Message = {
        id: clientMessageId,
        senderId: user?.id || '',
        receiverId: receiverId || '',
        content: type === 'file' && file ? file.name : content,
        type,
        fileUrl,
        fileName: file?.name,
        fileType: file?.type,
        fileSize: file?.size,
        createdAt: new Date(),
        read: false
      };
      
      console.log('[Client] Emitting message via WebSocket:', message);
      socket.emit('message', {
        ...message,
        content: type === 'file' && file ? `[File: ${file.name}]` : content,
      });
      
      setMessages(prev => [...prev, optimisticMessage]);
      
    } catch (error) {
      console.error('[Client] Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    }
  };

  // Start new conversation
  const startConversation = async (userId: string) => {
    try {
      console.log('[Client] Starting new conversation with user:', userId);
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-authorized': 'true',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({ participantId: userId })
      });
      if (!response.ok) throw new Error('Failed to create conversation');
      const conversation = await response.json();
      console.log('[Client] Created new conversation:', conversation);
      setCurrentConversation(conversation);
      setConversations(prev => {
        // Remove any conversation with the same id, then add the new one to the top
        const filtered = prev.filter(c => c.id !== conversation.id);
        return [conversation, ...filtered];
      });
      openMessagingModal();
    } catch (error) {
      console.error('[Client] Error starting conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to start conversation',
        variant: 'destructive'
      });
    }
  };

  // Load more messages
  const loadMoreMessages = async () => {
    if (!currentConversation || messages.length === 0) return;
    try {
      const response = await fetch(
        `/api/messages?conversationId=${currentConversation.id}&before=${messages[0]?.id}`
      );
      if (!response.ok) throw new Error('Failed to load messages');
      const newMessages: Message[] = await response.json();
      // Prepend the new (older) messages after reversing them
      setMessages(prev => [...newMessages.reverse(), ...prev]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load more messages',
        variant: 'destructive'
      });
    }
  };

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      console.log('[Client] Loading messages for conversation:', conversationId);
      const response = await fetch(`/api/messages?conversationId=${conversationId}`, {
        headers: {
          'x-authorized': 'true',
          'x-user-id': user?.id || ''
        }
      });
      if (!response.ok) throw new Error('Failed to load messages');
      const messages: Message[] = await response.json();
      console.log('[Client] Loaded messages:', messages);
      // API returns newest first, so reverse to show oldest first.
      setMessages(messages.reverse());
    } catch (error) {
      console.error('[Client] Error loading messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive'
      });
    }
  }, [user, toast]);

  // Set current conversation and load its messages
  const setCurrentConversationAndLoadMessages = useCallback((conversation: Conversation | null) => {
    console.log('[Client] Setting current conversation:', conversation);
    setCurrentConversation(conversation);
    if (conversation) {
      loadMessages(conversation.id);
      markAsRead(conversation.id);
      openMessagingModal();
    } else {
      setMessages([]);
    }
  }, [loadMessages, openMessagingModal, markAsRead]);

  return {
    conversations,
    currentConversation,
    messages,
    unreadCount,
    isConnected,
    onlineUsers,
    isMessagingOpen,
    searchUsers,
    sendMessage,
    startConversation,
    loadMoreMessages,
    setCurrentConversation: setCurrentConversationAndLoadMessages,
    markAsRead,
    openMessagingModal,
    closeMessagingModal
  };
} 