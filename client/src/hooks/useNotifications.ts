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
  id: number;
  type: string; // Made more flexible to handle legacy types like 'info', 'success'
  title: string;
  message?: string;
  is_read: boolean;
  created_at: string;
  user_id: number;
  payload?: Record<string, any>; // Added payload field for context data
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  // Fetch all notifications directly from Supabase
  const fetchNotifications = useCallback(async () => {
    try {
      console.log('Fetching all notifications from Supabase...');
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', 1) // Current user filter
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }
      
      console.log('Notifications fetched from Supabase:', data?.length || 0, 'notifications');
      const notificationsList = data || [];
      setNotifications(notificationsList);
      
      const unread = notificationsList.filter(n => !n.is_read).length;
      console.log('Unread notifications count:', unread);
      setUnreadCount(unread);
      
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

  // Mark all notifications as read when opening panel
  const markAllAsReadOnOpen = useCallback(async () => {
    const unreadNotifications = notifications.filter(n => !n.is_read);
    
    if (unreadNotifications.length === 0) {
      console.log('No unread notifications to mark as read');
      return;
    }

    console.log(`Marking ${unreadNotifications.length} notifications as read...`);

    // Optimistic update - update UI immediately
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      // Direct Supabase call to mark all as read
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', 1) // Current user
        .eq('is_read', false);

      if (error) {
        console.error('Supabase error marking notifications as read:', error);
        throw error;
      }

      console.log('✅ All notifications marked as read successfully');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      
      // Revert optimistic update on error
      setNotifications(prev => prev.map(n => 
        unreadNotifications.find(unread => unread.id === n.id) 
          ? { ...n, is_read: false } 
          : n
      ));
      setUnreadCount(unreadNotifications.length);
      
      toast({
        title: 'Error updating notifications',
        description: 'Failed to mark notifications as read',
        variant: 'destructive'
      });
    }
  }, [notifications, toast]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: number, showToast: boolean = false) => {
    // Optimistic update - update UI immediately
    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;
    
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, is_read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await markNotificationAsRead(notificationId);
      
      if (showToast) {
        toast({
          title: 'Notification marked as read',
          className: 'bg-green-50 border-green-200 text-green-800',
          duration: 2000
        });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      
      // Revert optimistic update on error
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
      
      toast({
        title: 'Error marking notification as read',
        description: 'Please try again',
        variant: 'destructive'
      });
    }
  }, [notifications, unreadCount, toast]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    const unreadNotifications = notifications.filter(n => !n.is_read);
    
    if (unreadNotifications.length === 0) {
      toast({
        title: 'No unread notifications',
        description: 'All notifications are already marked as read',
        className: 'bg-blue-50 border-blue-200 text-blue-800'
      });
      return;
    }

    // Optimistic update - update UI immediately
    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;
    
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      await markAllNotificationsAsRead();

      toast({
        title: `${unreadNotifications.length} notifications marked as read`,
        description: 'All notifications have been marked as read',
        className: 'bg-green-50 border-green-200 text-green-800'
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      
      // Revert optimistic update on error
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
      
      toast({
        title: 'Error updating notifications',
        description: 'Failed to mark all notifications as read. Please try again.',
        variant: 'destructive'
      });
    }
  }, [notifications, unreadCount, toast]);

  // Create notification (for testing and manual triggers)
  const createNotification = useCallback(async (notification: {
    type: 'low_stock' | 'payment_received' | 'customer_payment' | 'sync_failed' | 'sale_completed';
    title: string;
    message?: string;
    payload?: Record<string, any>;
  }) => {
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
    let mounted = true;
    let subscription: any = null;

    const initializeNotifications = async () => {
      // 1. First, fetch all existing notifications
      await fetchNotifications();
      
      if (!mounted) return;

      // 2. Then set up real-time subscription for new notifications
      console.log('🔗 Setting up real-time subscription for notifications...');
      
      subscription = supabase
        .channel('notifications_realtime_channel')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: 'user_id=eq.1' // Current user filter
        }, (payload) => {
          console.log('🚀 NEW notification received via realtime:', payload.new);
          const newNotification = payload.new as Notification;
          
          if (mounted) {
            // Add new notification to the beginning of the list
            setNotifications(prev => [newNotification, ...prev]);
            
            // Show toast notification for real-time updates
            toast({
              title: newNotification.title,
              description: newNotification.message,
              className: getNotificationToastStyle(newNotification.type)
            });
          }
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: 'user_id=eq.1'
        }, (payload) => {
          console.log('🔄 UPDATED notification received via realtime:', payload.new);
          const updatedNotification = payload.new as Notification;
          
          if (mounted) {
            // Update existing notification in the list
            setNotifications(prev => prev.map(n => 
              n.id === updatedNotification.id ? updatedNotification : n
            ));
          }
        })
        .subscribe((status) => {
          console.log('📊 Real-time subscription status:', status);
        });

      console.log('✅ Real-time subscription created successfully');
    };

    initializeNotifications();

    return () => {
      mounted = false;
      if (subscription) {
        console.log('🔌 Cleaning up real-time subscription');
        supabase.removeChannel(subscription);
      }
    };
  }, []); // Only run once on mount

  // Calculate unread count from current notifications state
  useEffect(() => {
    const count = notifications.filter(n => !n.is_read).length;
    setUnreadCount(count);
  }, [notifications]);

  return {
    notifications,
    setNotifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    markAllAsReadOnOpen,
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