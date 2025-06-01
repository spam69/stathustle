
"use client";

import type { Notification } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const NOTIFICATIONS_PER_PAGE_CLIENT = 10;

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
  isLoadingInitial: boolean;
  isFetchingMore: boolean;
  hasMoreNotifications: boolean;
  error: Error | null;
  fetchInitialNotifications: () => void; // Renamed for clarity
  loadMoreNotifications: () => void;
  markOneAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  isDeletingNotification: boolean;
  deleteReadNotifications: () => Promise<void>;
  isDeletingReadNotifications: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const fetchNotificationsAPI = async (page: number = 1, limit: number = NOTIFICATIONS_PER_PAGE_CLIENT): Promise<PaginatedNotificationsResponse> => {
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
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMoreNotifications, setHasMoreNotifications] = useState<boolean>(true);
  
  const queryKey = ['notifications', user?.id, 'initial'];

  const { isLoading: isLoadingInitial, error, refetch: fetchInitialNotifications } = useQuery<PaginatedNotificationsResponse, Error>({
    queryKey: queryKey,
    queryFn: () => fetchNotificationsAPI(1, NOTIFICATIONS_PER_PAGE_CLIENT),
    enabled: !!user,
    refetchInterval: 60000, // Keep periodic refetch for the first page
    staleTime: 30000,
    onSuccess: (data) => {
      setDisplayedNotifications(data.items);
      setCurrentPage(data.currentPage);
      setHasMoreNotifications(data.hasMore);
    },
  });

  const unreadCount = displayedNotifications.filter(n => !n.isRead).length;

  const loadMoreMutation = useMutation<PaginatedNotificationsResponse, Error, void>({
    mutationFn: () => fetchNotificationsAPI(currentPage + 1, NOTIFICATIONS_PER_PAGE_CLIENT),
    onSuccess: (data) => {
      setDisplayedNotifications(prev => [...prev, ...data.items]);
      setCurrentPage(data.currentPage);
      setHasMoreNotifications(data.hasMore);
    },
    onError: (error) => {
      toast({ title: "Error", description: `Could not load more notifications: ${error.message}`, variant: "destructive" });
    }
  });

  const markAsReadMutation = useMutation< { message: string }, Error, { notificationId?: string } >({
    mutationFn: ({ notificationId }) => markNotificationAsReadAPI(notificationId),
    onSuccess: (data, variables) => {
      toast({ title: "Notifications Updated", description: data.message });
      // Optimistically update local state
      setDisplayedNotifications(prev => 
        prev.map(n => {
          if (variables.notificationId && n.id === variables.notificationId) return { ...n, isRead: true };
          if (!variables.notificationId) return { ...n, isRead: true }; // Mark all as read
          return n;
        })
      );
      // Invalidate initial query or refetch if needed for other counts, but local update is faster for UI
      // queryClient.invalidateQueries({ queryKey: queryKey }); 
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
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteReadNotificationsMutation = useMutation< { message: string }, Error, void >({
    mutationFn: () => deleteReadNotificationsAPI(),
    onSuccess: (data) => {
      toast({ title: "Notifications Cleared", description: data.message });
      setDisplayedNotifications(prev => prev.filter(n => !n.isRead));
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });


  const markOneAsRead = useCallback(async (notificationId: string) => {
    try {
      await markAsReadMutation.mutateAsync({ notificationId });
    } catch (e) {
      // Error handled by mutation's onError
    }
  }, [markAsReadMutation]);

  const markAllAsRead = useCallback(async () => {
    try {
      await markAsReadMutation.mutateAsync({});
    } catch (e) {
       // Error handled by mutation's onError
    }
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
