import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Notification {
  id: number;
  user_id?: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function useNotifications() {
  const [list, setList] = useState<Notification[]>([]);

  // 1. Initial fetch
  useEffect(() => {
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }
      
      setList(data || []);
    };

    fetchNotifications();
  }, []);

  // 2. Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('notifications-changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications' 
        }, 
        (payload) => {
          setList(prev => [payload.new as Notification, ...prev]);
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          setList(prev => prev.map(n => 
            n.id === payload.new.id ? payload.new as Notification : n
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 3. Mark all read on panel open
  const markAllRead = async () => {
    const unreadNotifications = list.filter(n => !n.is_read);
    
    if (unreadNotifications.length === 0) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false);

    if (error) {
      console.error('Error marking notifications as read:', error);
      return;
    }

    setList(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  // 4. Create new notification
  const createNotification = async (notification: {
    type: string;
    title: string;
    message: string;
    user_id?: number;
  }) => {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        ...notification,
        user_id: notification.user_id || 1, // Default user_id to 1 if not provided
        is_read: false
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return;
    }

    // Note: The real-time subscription will automatically add this to the list
    return data;
  };

  return { 
    list, 
    markAllRead,
    createNotification,
    unreadCount: list.filter(n => !n.is_read).length
  };
}