/**
 * Real-time Store Data Hook with RLS
 * Provides real-time updates for store-isolated data
 */

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/SupabaseAuth';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealTimeStoreOptions {
  enabled?: boolean;
  showNotifications?: boolean;
}

export function useRealTimeStore(options: RealTimeStoreOptions = {}) {
  const { enabled = true, showNotifications = true } = options;
  const { storeId, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const channelsRef = useRef<RealtimeChannel[]>([]);

  // Optimized refresh function
  const refreshStoreData = useCallback((table: string) => {
    if (!storeId) return;
    
    // Invalidate specific queries for this store
    queryClient.invalidateQueries({ queryKey: [table, storeId] });
    
    // Also invalidate dashboard data if it's a core table
    if (['products', 'customers', 'orders'].includes(table)) {
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics', storeId] });
    }
    
    if (showNotifications) {
      toast({
        title: 'Data Updated',
        description: `${table} data has been updated`,
        duration: 2000,
      });
    }
  }, [storeId, queryClient, toast, showNotifications]);

  // Setup real-time subscriptions
  useEffect(() => {
    if (!enabled || !isAuthenticated || !storeId) return;

    console.log('🔄 Setting up real-time subscriptions for store:', storeId);

    const tables = ['products', 'customers', 'orders', 'order_items', 'notifications'];
    
    // Clean up existing channels
    channelsRef.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    channelsRef.current = [];

    // Create new channels for each table
    tables.forEach(table => {
      const channel = supabase
        .channel(`store-${storeId}-${table}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
            filter: `store_id=eq.${storeId}`, // Only listen to changes for this store
          },
          (payload) => {
            console.log(`📡 Real-time update for ${table}:`, payload);
            refreshStoreData(table);
          }
        )
        .subscribe((status) => {
          console.log(`📡 Subscription status for ${table}:`, status);
        });

      channelsRef.current.push(channel);
    });

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up real-time subscriptions');
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [enabled, isAuthenticated, storeId, refreshStoreData]);

  // Manual refresh all store data
  const forceRefresh = useCallback(() => {
    if (!storeId) return;
    
    const tables = ['products', 'customers', 'orders', 'notifications'];
    tables.forEach(table => {
      queryClient.invalidateQueries({ queryKey: [table, storeId] });
    });
    
    queryClient.invalidateQueries({ queryKey: ['dashboard-metrics', storeId] });
    
    console.log('🔄 Force refreshed all store data');
  }, [storeId, queryClient]);

  return {
    storeId,
    isAuthenticated,
    refreshStoreData,
    forceRefresh,
    subscriptionsActive: channelsRef.current.length > 0,
  };
}