/**
 * Enhanced Notifications Hook with Real-time Updates
 * Provides comprehensive notification management with optimistic updates
 */

import { useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/SupabaseAuth';
import { supabase } from '@/lib/supabase';
import { useEnhancedQuery } from './useEnhancedQuery';
import { useOptimisticUpdates } from './useOptimisticUpdates';
import type { Notification } from '@/types/schema';

export function useNotifications() {
  const { user } = useAuth();

  // Enhanced query for notifications
  const {
    data: notifications,
    isLoading,
    error,
    refresh,
    forceRefresh,
    updateData,
    isStale,
    isFetching,
  } = useEnhancedQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Failed to fetch notifications:', error);
        throw error;
      }
      
      return data || [];
    },
    enableRealtime: true,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Unread count with memoization
  const unreadCount = useMemo(() => {
    return notifications?.filter(n => !n.is_read).length || 0;
  }, [notifications]);

  // Mark all as read
  const markAllRead = useCallback(async () => {
    const unreadNotifications = notifications?.filter(n => !n.is_read) || [];
    
    if (unreadNotifications.length === 0) return;

    // Optimistic update
    updateData((old: Notification[] | undefined) => {
      if (!old) return old;
      return old.map(n => ({ ...n, is_read: true }));
    });

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false);

      if (error) {
        console.error('Failed to mark notifications as read:', error);
        // Rollback optimistic update
        refresh();
        throw error;
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }, [notifications, updateData, refresh]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: number) => {
    // Optimistic update
    updateData((old: Notification[] | undefined) => {
      if (!old) return old;
      return old.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      );
    });

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Failed to mark notification as read:', error);
        // Rollback optimistic update
        refresh();
        throw error;
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }, [updateData, refresh]);

  // Create new notification
  const createNotification = useCallback(async (notification: {
    type: string;
    title: string;
    message: string;
    user_id?: number;
  }) => {
    const newNotification = {
      type: notification.type,
      title: notification.title,
      message: notification.message,
      user_id: notification.user_id || user?.id || 1,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([newNotification])
        .select()
        .single();

      if (error) {
        console.error('Failed to create notification:', error);
        throw error;
      }

      // Real-time subscription will handle adding to cache
      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }, [user?.id]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: number) => {
    // Optimistic update
    updateData((old: Notification[] | undefined) => {
      if (!old) return old;
      return old.filter(n => n.id !== notificationId);
    });

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Failed to delete notification:', error);
        // Rollback optimistic update
        refresh();
        throw error;
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }, [updateData, refresh]);

  // Get notifications by type
  const getNotificationsByType = useCallback((type: string): Notification[] => {
    return notifications?.filter(n => n.type === type) || [];
  }, [notifications]);

  // Get recent notifications (last 24 hours)
  const getRecentNotifications = useCallback((hours: number = 24): Notification[] => {
    if (!notifications) return [];
    
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hours);
    
    return notifications.filter(n => 
      new Date(n.created_at) >= cutoff
    );
  }, [notifications]);

  return {
    // Data
    notifications: notifications || [],
    list: notifications || [], // Legacy compatibility
    isLoading,
    error,
    unreadCount,
    isStale,
    isFetching,
    
    // Actions
    refresh,
    forceRefresh,
    markAllRead,
    markAsRead,
    createNotification,
    deleteNotification,
    
    // Helper functions
    getNotificationsByType,
    getRecentNotifications,
  };
}

export default useNotifications;