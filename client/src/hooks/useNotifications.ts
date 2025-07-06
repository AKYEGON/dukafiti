import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  createNotification as createNotificationAPI,
  getUnreadNotificationCount
} from '@/lib/supabase-data';

export interface Notification {
  id: string;
  type: string; // Made more flexible to handle legacy types like 'info', 'success'
  title: string;
  message?: string;
  is_read: boolean;
  created_at: string;
  user_id: number;
  metadata?: Record<string, any>;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  // Fetch all notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotifications(50);
      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Error loading notifications',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);

      // Update local state
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      
      if (unreadIds.length === 0) return;

      await markAllNotificationsAsRead();

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);

      toast({
        title: 'All notifications marked as read',
        className: 'bg-green-50 border-green-200 text-green-800'
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: 'Error updating notifications',
        variant: 'destructive'
      });
    }
  }, [notifications, toast]);

  // Create notification (for testing and manual triggers)
  const createNotification = useCallback(async (notification: Omit<Notification, 'id' | 'created_at' | 'user_id'>) => {
    try {
      const data = await createNotificationAPI(notification);
      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }, []);

  // Initialize notifications and set up real-time subscription
  useEffect(() => {
    fetchNotifications();

    // Set up real-time subscription
    const subscription = supabase
      .channel('notifications-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      }, (payload) => {
        const newNotification = payload.new as Notification;
        
        // Add to state
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Show toast notification
        toast({
          title: newNotification.title,
          description: newNotification.message,
          className: getNotificationToastStyle(newNotification.type)
        });
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchNotifications, toast]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    createNotification,
    refetch: fetchNotifications
  };
}

// Helper function to get toast styling based on notification type
function getNotificationToastStyle(type: string): string {
  switch (type) {
    case 'low_stock':
      return 'bg-orange-50 border-orange-200 text-orange-800';
    case 'payment_received':
    case 'customer_payment':
      return 'bg-green-50 border-green-200 text-green-800';
    case 'sync_failed':
      return 'bg-red-50 border-red-200 text-red-800';
    case 'sale_completed':
      return 'bg-blue-50 border-blue-200 text-blue-800';
    // Handle legacy notification types
    case 'success':
      return 'bg-green-50 border-green-200 text-green-800';
    case 'info':
      return 'bg-blue-50 border-blue-200 text-blue-800';
    default:
      return 'bg-gray-50 border-gray-200 text-gray-800';
  }
}