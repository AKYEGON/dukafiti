/**
 * Dynamic Data Hook - Ensures Real-time Updates for All Entities
 * This hook eliminates all build-time data baking and provides truly dynamic data
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/SupabaseAuth';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChannel } from '@supabase/supabase-js';

interface DynamicDataOptions {
  table: string;
  queryKey: string[];
  fetchFunction: () => Promise<any>;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
}

export function useDynamicData(options: DynamicDataOptions) {
  const { table, queryKey, fetchFunction, onInsert, onUpdate, onDelete } = options;
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Force refresh data from server
  const forceRefresh = useCallback(async () => {
    try {
      const freshData = await fetchFunction();
      queryClient.setQueryData(queryKey, freshData);
      queryClient.invalidateQueries({ queryKey });
      return freshData;
    } catch (error) {
      console.error(`Failed to refresh ${table}:`, error);
      throw error;
    }
  }, [fetchFunction, queryKey, queryClient, table]);

  // Optimistic update function
  const updateDataOptimistically = useCallback((updater: (oldData: any) => any) => {
    queryClient.setQueryData(queryKey, updater);
  }, [queryClient, queryKey]);

  // Setup real-time subscription
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const setupRealtime = async () => {
      // Clean up existing channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      // Create new channel for this table
      const channel = supabase
        .channel(`${table}-changes-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: table,
          },
          (payload) => {
            console.log(`[${table}] INSERT:`, payload);
            
            // Update query cache with new data
            updateDataOptimistically((oldData: any[]) => {
              if (!oldData) return [payload.new];
              return [...oldData, payload.new];
            });

            // Custom insert handler
            if (onInsert) onInsert(payload);

            // Force refresh to ensure consistency
            setTimeout(() => forceRefresh(), 100);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: table,
          },
          (payload) => {
            console.log(`[${table}] UPDATE:`, payload);
            
            // Update query cache with updated data
            updateDataOptimistically((oldData: any[]) => {
              if (!oldData) return [payload.new];
              return oldData.map(item => 
                item.id === payload.new.id ? payload.new : item
              );
            });

            // Custom update handler
            if (onUpdate) onUpdate(payload);

            // Force refresh to ensure consistency
            setTimeout(() => forceRefresh(), 100);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: table,
          },
          (payload) => {
            console.log(`[${table}] DELETE:`, payload);
            
            // Update query cache by removing deleted item
            updateDataOptimistically((oldData: any[]) => {
              if (!oldData) return [];
              return oldData.filter(item => item.id !== payload.old.id);
            });

            // Custom delete handler
            if (onDelete) onDelete(payload);

            // Force refresh to ensure consistency
            setTimeout(() => forceRefresh(), 100);
          }
        )
        .subscribe((status) => {
          console.log(`[${table}] Subscription status:`, status);
          setIsConnected(status === 'SUBSCRIBED');
          
          if (status === 'SUBSCRIBED') {
            // Force initial refresh when connected
            forceRefresh();
          }
        });

      channelRef.current = channel;
    };

    setupRealtime();

    // Cleanup on unmount or dependency change
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsConnected(false);
      }
    };
  }, [isAuthenticated, user, table, onInsert, onUpdate, onDelete, updateDataOptimistically, forceRefresh]);

  // Page visibility listener - refresh when user returns to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        forceRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [forceRefresh, isAuthenticated]);

  return {
    forceRefresh,
    updateDataOptimistically,
    isConnected,
  };
}