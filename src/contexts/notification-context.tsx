"use client";

import type { Notification } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const NOTIFICATIONS_PAGE_SIZE = 5; 

interface PaginatedNotificationsResponse {
  items: Notification[];
  hasMore: boolean;
  currentPage: number;
  totalItems: number;
  totalPages: number;
}

interface NotificationContextType {
  displayedNotifications: Notification[];
  unreadCount: number;
  totalServerNotificationsCount: number;
  isLoadingInitial: boolean;
  isFetchingMore: boolean;
  hasMoreNotifications: boolean;
  error: Error | null;
  fetchInitialNotifications: () => void; 
  loadMoreNotifications: () => void;
  markOneAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  isDeletingNotification: boolean;
  deleteReadNotifications: () => Promise<void>;
  isDeletingReadNotifications: boolean;

  // For Modal
  isNotificationModalOpen: boolean;
  activeNotification: Notification | null;
  openNotificationInModal: (notification: Notification) => void;
  closeNotificationModal: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const fetchNotificationsAPI = async (userId: string, page: number = 1, limit: number = NOTIFICATIONS_PAGE_SIZE): Promise<PaginatedNotificationsResponse> => {
  const response = await fetch(`/api/notifications?userId=${userId}&page=${page}&limit=${limit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch notifications');
  }
  return response.json();
};

const markNotificationAsReadAPI = async (notificationId?: string, userId?: string): Promise<{ message: string }> => {
  console.log('Frontend: Marking as read', { notificationId, userId });
  const response = await fetch('/api/notifications/mark-read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notificationId ? { notificationId, userId } : { userId }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to mark notifications as read');
  }
  return response.json();
};

const deleteNotificationAPI = async (notificationId: string): Promise<{ message: string }> => {
  const response = await fetch(`/api/notifications/${notificationId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete notification');
  }
  return response.json();
};

const deleteReadNotificationsAPI = async (userId?: string): Promise<{ message: string }> => {
  const response = await fetch('/api/notifications/delete-read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete read notifications');
  }
  return response.json();
};


export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [displayedNotifications, setDisplayedNotifications] = useState<Notification[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(0); 
  const [totalServerNotificationsCount, setTotalServerNotificationsCount] = useState<number>(0);

  // Modal State
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [activeNotification, setActiveNotification] = useState<Notification | null>(null);
  
  const queryKey = ['notifications', user?.id]; 

  const { data, isLoading: isLoadingInitial, error, refetch: fetchInitialNotificationsQuery } = useQuery<PaginatedNotificationsResponse, Error, PaginatedNotificationsResponse, typeof queryKey>({
    queryKey: queryKey,
    queryFn: () => user?.id ? fetchNotificationsAPI(user.id, 1, NOTIFICATIONS_PAGE_SIZE) : Promise.resolve({ items: [], hasMore: false, currentPage: 1, totalItems: 0, totalPages: 1 }),
    enabled: !!user,
    refetchInterval: 60000, 
    staleTime: 30000,
  });

  useEffect(() => {
    if (data) {
      // Ensure every notification has an id property
      const itemsWithId = data.items.map(n => ({
        ...n,
        id: n.id || (n as any)._id,
      }));
      setDisplayedNotifications(itemsWithId);
      setCurrentPage(data.currentPage);
      setTotalServerNotificationsCount(data.totalItems);
    }
    if (error) {
      console.error('[NotificationContext] Initial fetch error:', error);
    }
  }, [data, error]);

  const unreadCount = displayedNotifications.filter(n => !n.isRead).length;
  const hasMoreNotifications = displayedNotifications.length < totalServerNotificationsCount;

  const loadMoreMutation = useMutation<PaginatedNotificationsResponse, Error, void>({
    mutationFn: () => {
        if (!hasMoreNotifications || currentPage === 0) { 
             // console.log("[NotificationContext] Load more skipped, no more or initial load pending/failed.", {hasMoreNotifications, currentPage});
             return Promise.reject(new Error("No more notifications to load or initial load pending."));
        }
        // console.log(`[NotificationContext] Loading more notifications, current page: ${currentPage}, requesting page: ${currentPage + 1}`);
        return user?.id ? fetchNotificationsAPI(user.id, currentPage + 1, NOTIFICATIONS_PAGE_SIZE) : Promise.resolve({ items: [], hasMore: false, currentPage: 1, totalItems: 0, totalPages: 1 });
    },
    onSuccess: (data) => {
      console.log('[NotificationContext] Loaded more notifications:', data.items);
      setDisplayedNotifications(prev => {
        const newItems = data.items.filter(item => !prev.find(pItem => pItem.id === item.id));
        return [...prev, ...newItems];
      });
      setCurrentPage(data.currentPage);
    },
    onError: (error) => {
      if (error.message !== "No more notifications to load or initial load pending.") {
        toast({ title: "Error", description: `Could not load more notifications: ${error.message}`, variant: "destructive" });
      }
      // console.error('[NotificationContext] Load more error:', error);
    }
  });

  const markAsReadMutation = useMutation< { message: string }, Error, { notificationId?: string } >({
    mutationFn: ({ notificationId }) => markNotificationAsReadAPI(notificationId, user?.id),
    onSuccess: (data, variables) => {
      // Invalidate the notifications query to force a refetch
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      
      // Update local state optimistically
      setDisplayedNotifications(prev => 
        prev.map(n => {
          if (variables.notificationId && n.id === variables.notificationId && !n.isRead) return { ...n, isRead: true };
          if (!variables.notificationId && !n.isRead) return { ...n, isRead: true }; 
          return n;
        })
      );
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteNotificationMutation = useMutation< { message: string }, Error, { notificationId: string } >({
    mutationFn: ({ notificationId }) => deleteNotificationAPI(notificationId),
    onSuccess: (data, variables) => {
      toast({ title: "Notification Deleted", description: data.message });
      setDisplayedNotifications(prev => prev.filter(n => n.id !== variables.notificationId));
      setTotalServerNotificationsCount(prev => Math.max(0, prev -1)); 
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteReadNotificationsMutation = useMutation< { message: string }, Error, void >({
    mutationFn: () => deleteReadNotificationsAPI(user?.id),
    onSuccess: (data) => {
      toast({ title: "Notifications Cleared", description: data.message });
      const readCount = displayedNotifications.filter(n => n.isRead).length;
      setDisplayedNotifications(prev => prev.filter(n => !n.isRead));
      setTotalServerNotificationsCount(prev => Math.max(0, prev - readCount)); 
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });


  const markOneAsRead = useCallback(async (notificationId: string) => {
    const notification = displayedNotifications.find(n => n.id === notificationId);
    if (notification && !notification.isRead) {
      await markAsReadMutation.mutateAsync({ notificationId });
    }
  }, [markAsReadMutation, displayedNotifications]);

  const markAllAsRead = useCallback(async () => {
    if (unreadCount > 0) {
        await markAsReadMutation.mutateAsync({});
    }
  }, [markAsReadMutation, unreadCount]);
  
  const loadMoreNotifications = useCallback(() => {
    if (hasMoreNotifications && !loadMoreMutation.isPending && currentPage > 0) {
      loadMoreMutation.mutate();
    }
  }, [hasMoreNotifications, loadMoreMutation, currentPage]);
  
  const fetchInitialNotifications = useCallback(() => {
    fetchInitialNotificationsQuery();
  }, [fetchInitialNotificationsQuery]);

  const openNotificationInModal = useCallback((notification: Notification) => {
    setActiveNotification(notification);
    setIsNotificationModalOpen(true);
    // Also mark as read when opened in modal
    if (!notification.isRead) {
      markOneAsRead(notification.id);
    }
  }, [markOneAsRead]);

  const closeNotificationModal = useCallback(() => {
    setIsNotificationModalOpen(false);
    setActiveNotification(null);
  }, []);


  return (
    <NotificationContext.Provider value={{
      displayedNotifications,
      unreadCount,
      totalServerNotificationsCount,
      isLoadingInitial,
      isFetchingMore: loadMoreMutation.isPending,
      hasMoreNotifications,
      error,
      fetchInitialNotifications,
      loadMoreNotifications,
      markOneAsRead,
      markAllAsRead,
      deleteNotification: async (notificationId) => { await deleteNotificationMutation.mutateAsync({notificationId}); },
      isDeletingNotification: deleteNotificationMutation.isPending,
      deleteReadNotifications: async () => { await deleteReadNotificationsMutation.mutateAsync(); },
      isDeletingReadNotifications: deleteReadNotificationsMutation.isPending,
      // Modal
      isNotificationModalOpen,
      activeNotification,
      openNotificationInModal,
      closeNotificationModal,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

