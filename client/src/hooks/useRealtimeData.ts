/**
 * Unified Real-time Data Management Hook
 * Provides comprehensive real-time subscriptions and data management for all entities
 */

import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/SupabaseAuth';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeDataOptions {
  enableProducts?: boolean;
  enableOrders?: boolean;
  enableCustomers?: boolean;
  enableNotifications?: boolean;
}

export function useRealtimeData(options: UseRealtimeDataOptions = {}) {
  const {
    enableProducts = true,
    enableOrders = true,
    enableCustomers = true,
    enableNotifications = true,
  } = options;

  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const channelsRef = useRef<RealtimeChannel[]>([]);

  // Cleanup function
  const cleanup = useCallback(() => {
    channelsRef.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    channelsRef.current = [];
  }, []);

  // Manual refresh function
  const refreshAll = useCallback(() => {
    const queries = ['products', 'customers', 'orders', 'notifications', 'dashboard-metrics', 'recent-orders'];
    queries.forEach(key => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
    
    toast({
      title: "Data Refreshed",
      description: "All data has been updated with the latest changes.",
    });
  }, [queryClient, toast]);

  // Page visibility handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        // Refresh all data when tab becomes visible
        refreshAll();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, refreshAll]);

  // Main subscription effect
  useEffect(() => {
    if (!isAuthenticated || !user) {
      cleanup();
      return;
    }

    // Products subscription
    if (enableProducts) {
      const productsChannel = supabase
        .channel('products-realtime')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'products' },
          (payload) => {
            console.log('Product INSERT:', payload.new);
            
            // Update products cache
            queryClient.setQueryData(['products'], (old: any[] | undefined) => {
              if (!old) return [payload.new];
              return [payload.new, ...old];
            });
            
            // Invalidate dependent queries
            queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
            
            toast({
              title: "New Product Added",
              description: `${payload.new.name} has been added to inventory`,
            });
          }
        )
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'products' },
          (payload) => {
            console.log('Product UPDATE:', payload.new);
            
            // Update products cache
            queryClient.setQueryData(['products'], (old: any[] | undefined) => {
              if (!old) return [payload.new];
              return old.map(item => item.id === payload.new.id ? payload.new : item);
            });
            
            // Invalidate dependent queries  
            queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
            
            // Check for low stock
            if (payload.new.stock !== null && payload.new.low_stock_threshold && 
                payload.new.stock <= payload.new.low_stock_threshold) {
              toast({
                title: "Low Stock Alert",
                description: `${payload.new.name} is running low (${payload.new.stock} remaining)`,
                variant: "destructive",
              });
            }
          }
        )
        .on('postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'products' },
          (payload) => {
            console.log('Product DELETE:', payload.old);
            
            // Update products cache
            queryClient.setQueryData(['products'], (old: any[] | undefined) => {
              if (!old) return [];
              return old.filter(item => item.id !== payload.old.id);
            });
            
            // Invalidate dependent queries
            queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
          }
        )
        .subscribe();

      channelsRef.current.push(productsChannel);
    }

    // Orders subscription
    if (enableOrders) {
      const ordersChannel = supabase
        .channel('orders-realtime')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orders' },
          (payload) => {
            console.log('Order INSERT:', payload.new);
            
            // Update orders cache
            queryClient.setQueryData(['orders'], (old: any[] | undefined) => {
              if (!old) return [payload.new];
              return [payload.new, ...old];
            });
            
            // Update recent orders
            queryClient.setQueryData(['recent-orders'], (old: any[] | undefined) => {
              if (!old) return [payload.new];
              const updated = [payload.new, ...old];
              return updated.slice(0, 10); // Keep only 10 most recent
            });
            
            // Invalidate dependent queries
            queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
            queryClient.invalidateQueries({ queryKey: ['reports-summary'] });
            queryClient.invalidateQueries({ queryKey: ['reports-trend'] });
            
            toast({
              title: "New Sale Completed",
              description: `Sale of ${payload.new.total} completed`,
            });
          }
        )
        .subscribe();

      channelsRef.current.push(ordersChannel);
    }

    // Customers subscription
    if (enableCustomers) {
      const customersChannel = supabase
        .channel('customers-realtime')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'customers' },
          (payload) => {
            console.log('Customer change:', payload);
            
            // Update customers cache
            if (payload.eventType === 'INSERT') {
              queryClient.setQueryData(['customers'], (old: any[] | undefined) => {
                if (!old) return [payload.new];
                return [payload.new, ...old];
              });
            } else if (payload.eventType === 'UPDATE') {
              queryClient.setQueryData(['customers'], (old: any[] | undefined) => {
                if (!old) return [payload.new];
                return old.map(item => item.id === payload.new.id ? payload.new : item);
              });
            } else if (payload.eventType === 'DELETE') {
              queryClient.setQueryData(['customers'], (old: any[] | undefined) => {
                if (!old) return [];
                return old.filter(item => item.id !== payload.old.id);
              });
            }
            
            // Invalidate dependent queries
            queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
            queryClient.invalidateQueries({ queryKey: ['customer-credits'] });
            queryClient.invalidateQueries({ queryKey: ['top-customers'] });
          }
        )
        .subscribe();

      channelsRef.current.push(customersChannel);
    }

    // Notifications subscription
    if (enableNotifications) {
      const notificationsChannel = supabase
        .channel('notifications-realtime')
        .on('postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Notification INSERT:', payload.new);
            
            // Update notifications cache
            queryClient.setQueryData(['notifications'], (old: any[] | undefined) => {
              if (!old) return [payload.new];
              return [payload.new, ...old];
            });
            
            // Show toast for new notification
            toast({
              title: payload.new.title,
              description: payload.new.message,
              variant: payload.new.type === 'low_stock' ? 'destructive' : 'default',
            });
          }
        )
        .on('postgres_changes',
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Notification UPDATE:', payload.new);
            
            // Update notifications cache
            queryClient.setQueryData(['notifications'], (old: any[] | undefined) => {
              if (!old) return [payload.new];
              return old.map(item => item.id === payload.new.id ? payload.new : item);
            });
          }
        )
        .subscribe();

      channelsRef.current.push(notificationsChannel);
    }

    // Cleanup on unmount or dependency change
    return cleanup;
  }, [isAuthenticated, user, enableProducts, enableOrders, enableCustomers, enableNotifications, queryClient, toast, cleanup]);

  return {
    refreshAll,
    isSubscribed: channelsRef.current.length > 0,
  };
}

export default useRealtimeData;