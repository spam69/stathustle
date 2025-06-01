
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

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: notifications = [], isLoading, error, refetch } = useQuery<Notification[], Error>({
    queryKey: ['notifications', user?.id],
    queryFn: fetchNotificationsAPI,
    enabled: !!user, // Only fetch if user is logged in
    refetchInterval: 60000, // Refetch every 60 seconds
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

  const markOneAsRead = useCallback(async (notificationId: string) => {
    // Optimistically update UI
    queryClient.setQueryData<Notification[]>(['notifications', user?.id], (oldNotifications) =>
      oldNotifications?.map(n => n.id === notificationId ? { ...n, isRead: true } : n) || []
    );
    try {
      await markAsReadMutation.mutateAsync({ notificationId });
    } catch (e) {
      // Revert optimistic update on error if needed, though invalidateQueries will refetch
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    }
  }, [user?.id, queryClient, markAsReadMutation]);

  const markAllAsRead = useCallback(async () => {
     // Optimistically update UI
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


  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      isLoading,
      error,
      fetchNotifications,
      markOneAsRead,
      markAllAsRead,
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
