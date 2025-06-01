
"use client";

import type { Notification } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: Error | null;
  fetchNotifications: () => void;
  markOneAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  isDeletingNotification: boolean;
  deleteReadNotifications: () => Promise<void>;
  isDeletingReadNotifications: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const fetchNotificationsAPI = async (): Promise<Notification[]> => {
  const response = await fetch('/api/notifications');
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

  const { data: notifications = [], isLoading, error, refetch } = useQuery<Notification[], Error>({
    queryKey: ['notifications', user?.id],
    queryFn: fetchNotificationsAPI,
    enabled: !!user, 
    refetchInterval: 60000, 
    staleTime: 30000,
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsReadMutation = useMutation< { message: string }, Error, { notificationId?: string } >({
    mutationFn: ({ notificationId }) => markNotificationAsReadAPI(notificationId),
    onSuccess: (data, variables) => {
      toast({ title: "Notifications Updated", description: data.message });
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteNotificationMutation = useMutation< { message: string }, Error, { notificationId: string } >({
    mutationFn: ({ notificationId }) => deleteNotificationAPI(notificationId),
    onSuccess: (data, variables) => {
      toast({ title: "Notification Deleted", description: data.message });
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteReadNotificationsMutation = useMutation< { message: string }, Error, void >({
    mutationFn: () => deleteReadNotificationsAPI(),
    onSuccess: (data) => {
      toast({ title: "Notifications Cleared", description: data.message });
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });


  const markOneAsRead = useCallback(async (notificationId: string) => {
    queryClient.setQueryData<Notification[]>(['notifications', user?.id], (oldNotifications) =>
      oldNotifications?.map(n => n.id === notificationId ? { ...n, isRead: true } : n) || []
    );
    try {
      await markAsReadMutation.mutateAsync({ notificationId });
    } catch (e) {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    }
  }, [user?.id, queryClient, markAsReadMutation]);

  const markAllAsRead = useCallback(async () => {
    queryClient.setQueryData<Notification[]>(['notifications', user?.id], (oldNotifications) =>
      oldNotifications?.map(n => ({ ...n, isRead: true })) || []
    );
    try {
      await markAsReadMutation.mutateAsync({});
    } catch (e) {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    }
  }, [user?.id, queryClient, markAsReadMutation]);
  
  const fetchNotifications = useCallback(() => {
    if (user) {
      refetch();
    }
  }, [user, refetch]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await deleteNotificationMutation.mutateAsync({ notificationId });
    } catch (e) {
      // Error is handled by mutation's onError
    }
  }, [deleteNotificationMutation]);

  const deleteReadNotifications = useCallback(async () => {
    try {
      await deleteReadNotificationsMutation.mutateAsync();
    } catch (e) {
      // Error is handled by mutation's onError
    }
  }, [deleteReadNotificationsMutation]);


  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      isLoading,
      error,
      fetchNotifications,
      markOneAsRead,
      markAllAsRead,
      deleteNotification,
      isDeletingNotification: deleteNotificationMutation.isPending,
      deleteReadNotifications,
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
