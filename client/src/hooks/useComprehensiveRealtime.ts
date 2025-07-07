/**
 * Comprehensive Real-time Data Management System
 * Provides automatic data synchronization with intelligent caching and error handling
 */

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface ComprehensiveRealtimeOptions {
  enabled?: boolean;
  tables?: string[];
  onUpdate?: (table: string, payload: any) => void;
  autoRefresh?: boolean;
  showNotifications?: boolean;
}

export function useComprehensiveRealtime(options: ComprehensiveRealtimeOptions = {}) {
  const { 
    enabled = true, 
    tables = ['products', 'customers', 'orders', 'notifications'],
    onUpdate,
    autoRefresh = true,
    showNotifications = true
  } = options;
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const subscriptionsRef = useRef<any[]>([]);
  const lastUpdateRef = useRef<Record<string, number>>({});

  // Optimized data refresh with debouncing
  const refreshData = useCallback((table: string, force = false) => {
    const now = Date.now();
    const lastUpdate = lastUpdateRef.current[table] || 0;
    
    // Debounce updates to prevent excessive API calls
    if (!force && now - lastUpdate < 1000) return;
    
    lastUpdateRef.current[table] = now;
    
    // Invalidate and refetch specific queries immediately
    queryClient.invalidateQueries({ queryKey: [table] });
    
    // Invalidate related dashboard data
    if (['products', 'customers', 'orders'].includes(table)) {
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    }
    
    // Force immediate data refresh
    if (autoRefresh) {
      queryClient.refetchQueries({ queryKey: [table] });
      
      // Also refresh related queries
      if (table === 'orders') {
        queryClient.refetchQueries({ queryKey: ['dashboard-metrics'] });
      }
      if (table === 'products') {
        queryClient.refetchQueries({ queryKey: ['dashboard-metrics'] });
      }
    }
  }, [queryClient, autoRefresh]);

  const handleRealtimeNotification = useCallback((table: string, payload: any) => {
    if (!showNotifications) return;
    
    const { eventType } = payload;
    
    if (eventType === 'INSERT') {
      switch (table) {
        case 'orders':
          toast({
            title: 'New Sale Recorded',
            description: 'Sales data updated in real-time',
          });
          break;
        case 'notifications':
          toast({
            title: 'New Notification',
            description: 'You have a new notification',
          });
          break;
        case 'products':
          toast({
            title: 'Inventory Updated',
            description: 'Product inventory has been updated',
          });
          break;
        case 'customers':
          toast({
            title: 'Customer Added',
            description: 'New customer has been added',
          });
          break;
      }
    } else if (eventType === 'UPDATE') {
      switch (table) {
        case 'products':
          toast({
            title: 'Stock Updated',
            description: 'Product stock levels have changed',
          });
          break;
        case 'customers':
          toast({
            title: 'Customer Updated',
            description: 'Customer information has been updated',
          });
          break;
      }
    }
  }, [showNotifications, toast]);

  useEffect(() => {
    if (!enabled) return;

    const setupSubscriptions = async () => {
      // Clear existing subscriptions to prevent duplicates
      subscriptionsRef.current.forEach(sub => {
        if (sub) {
          try {
            supabase.removeChannel(sub);
          } catch (error) {
            console.warn('Error removing subscription:', error);
          }
        }
      });
      subscriptionsRef.current = [];

      // Set up enhanced subscriptions for each table
      for (const table of tables) {
        try {
          const subscription = supabase
            .channel(`${table}_comprehensive_${Date.now()}`)
            .on(
              'postgres_changes',
              { 
                event: '*', 
                schema: 'public', 
                table: table 
              },
              (payload) => {
                console.log(`📊 Real-time update for ${table}:`, payload);
                
                // Immediate data refresh
                refreshData(table, true);
                
                // Call custom update handler
                if (onUpdate) {
                  try {
                    onUpdate(table, payload);
                  } catch (error) {
                    console.error('Custom update handler error:', error);
                  }
                }
                
                // Show user notifications
                handleRealtimeNotification(table, payload);
              }
            )
            .subscribe((status, err) => {
              if (err) {
                console.error(`Subscription error for ${table}:`, err);
                // Retry subscription after delay
                setTimeout(() => setupSubscriptions(), 5000);
              } else {
                console.log(`✅ Subscribed to ${table} changes:`, status);
              }
            });

          subscriptionsRef.current.push(subscription);
        } catch (error) {
          console.error(`Failed to set up subscription for ${table}:`, error);
        }
      }
    };

    setupSubscriptions();

    // Enhanced cleanup function
    return () => {
      subscriptionsRef.current.forEach(sub => {
        if (sub) {
          try {
            supabase.removeChannel(sub);
          } catch (error) {
            console.warn('Error during cleanup:', error);
          }
        }
      });
      subscriptionsRef.current = [];
    };
  }, [enabled, tables.join(','), refreshData, onUpdate, handleRealtimeNotification]);

  // Manual refresh function
  const forceRefresh = useCallback((table?: string) => {
    if (table) {
      refreshData(table, true);
    } else {
      tables.forEach(t => refreshData(t, true));
    }
  }, [refreshData, tables]);

  return {
    isConnected: subscriptionsRef.current.length > 0,
    activeSubscriptions: subscriptionsRef.current.length,
    forceRefresh,
    refreshData,
    disconnect: () => {
      subscriptionsRef.current.forEach(sub => {
        if (sub) {
          try {
            supabase.removeChannel(sub);
          } catch (error) {
            console.warn('Error disconnecting:', error);
          }
        }
      });
      subscriptionsRef.current = [];
    }
  };
}

// Hook for Page Visibility API integration
export function useVisibilityRefresh() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refresh all data when user returns to the tab
        queryClient.invalidateQueries();
        queryClient.refetchQueries();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [queryClient]);
}