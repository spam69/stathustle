
"use client";

import type { Notification } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const NOTIFICATIONS_PAGE_SIZE = 5; // Number of notifications to fetch per page

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
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const fetchNotificationsAPI = async (page: number = 1, limit: number = NOTIFICATIONS_PAGE_SIZE): Promise<PaginatedNotificationsResponse> => {
  const response = await fetch(`/api/notifications?page=${page}&limit=${limit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch notifications');
  }
  return response.json();
};

const markNotificationAsReadAPI = async (notificationId?: string): Promise<{ message: string }> => {
  const response = await fetch('/api/notifications/mark-read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notificationId ? { notificationId } : {}),
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

const deleteReadNotificationsAPI = async (): Promise<{ message: string }> => {
  const response = await fetch('/api/notifications/delete-read', {
    method: 'POST',
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
  const [currentPage, setCurrentPage] = useState<number>(0); // Start at 0, first fetch will be page 1
  const [totalServerNotificationsCount, setTotalServerNotificationsCount] = useState<number>(0);
  
  const queryKey = ['notifications', user?.id, 'initial'];

  const { isLoading: isLoadingInitial, error, refetch: fetchInitialNotifications } = useQuery<PaginatedNotificationsResponse, Error>({
    queryKey: queryKey,
    queryFn: () => fetchNotificationsAPI(1, NOTIFICATIONS_PAGE_SIZE), // Fetch page 1 initially
    enabled: !!user,
    refetchInterval: 60000, 
    staleTime: 30000,
    onSuccess: (data) => {
      setDisplayedNotifications(data.items);
      setCurrentPage(data.currentPage);
      setTotalServerNotificationsCount(data.totalItems);
    },
  });

  const unreadCount = displayedNotifications.filter(n => !n.isRead).length;
  const hasMoreNotifications = displayedNotifications.length < totalServerNotificationsCount;

  const loadMoreMutation = useMutation<PaginatedNotificationsResponse, Error, void>({
    mutationFn: () => fetchNotificationsAPI(currentPage + 1, NOTIFICATIONS_PAGE_SIZE),
    onSuccess: (data) => {
      setDisplayedNotifications(prev => [...prev, ...data.items]);
      setCurrentPage(data.currentPage);
      // totalServerNotificationsCount is set by initial fetch and assumed not to change during load more
    },
    onError: (error) => {
      toast({ title: "Error", description: `Could not load more notifications: ${error.message}`, variant: "destructive" });
    }
  });

  const markAsReadMutation = useMutation< { message: string }, Error, { notificationId?: string } >({
    mutationFn: ({ notificationId }) => markNotificationAsReadAPI(notificationId),
    onSuccess: (data, variables) => {
      toast({ title: "Notifications Updated", description: data.message });
      setDisplayedNotifications(prev => 
        prev.map(n => {
          if (variables.notificationId && n.id === variables.notificationId) return { ...n, isRead: true };
          if (!variables.notificationId) return { ...n, isRead: true }; 
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
      setTotalServerNotificationsCount(prev => Math.max(0, prev -1)); // Adjust total count
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteReadNotificationsMutation = useMutation< { message: string }, Error, void >({
    mutationFn: () => deleteReadNotificationsAPI(),
    onSuccess: (data) => {
      toast({ title: "Notifications Cleared", description: data.message });
      const readCount = displayedNotifications.filter(n => n.isRead).length;
      setDisplayedNotifications(prev => prev.filter(n => !n.isRead));
      setTotalServerNotificationsCount(prev => Math.max(0, prev - readCount)); // Adjust total count
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });


  const markOneAsRead = useCallback(async (notificationId: string) => {
    await markAsReadMutation.mutateAsync({ notificationId });
  }, [markAsReadMutation]);

  const markAllAsRead = useCallback(async () => {
    await markAsReadMutation.mutateAsync({});
  }, [markAsReadMutation]);
  
  const loadMoreNotifications = useCallback(() => {
    if (hasMoreNotifications && !loadMoreMutation.isPending) {
      loadMoreMutation.mutate();
    }
  }, [hasMoreNotifications, loadMoreMutation]);


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
    