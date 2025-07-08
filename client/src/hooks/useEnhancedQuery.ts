/**
 * Enhanced Query Hook with Real-time Updates and Manual Refresh
 * Wraps React Query with additional real-time capabilities
 */

import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface EnhancedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  queryKey: (string | number)[];
  queryFn: () => Promise<T>;
  enableRealtime?: boolean;
  manualRefreshToast?: boolean;
}

export function useEnhancedQuery<T>(options: EnhancedQueryOptions<T>) {
  const {
    queryKey,
    queryFn,
    enableRealtime = true,
    manualRefreshToast = true,
    ...queryOptions
  } = options;

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const lastRefreshRef = useRef<number>(0);

  // Enhanced query with proper error handling and caching
  const query = useQuery<T>({
    queryKey,
    queryFn: async () => {
      try {
        const data = await queryFn();
        return data;
      } catch (error) {
        console.error(`Query failed for ${queryKey.join('-')}:`, error);
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error instanceof Error && error.message.includes('401')) return false;
      if (error instanceof Error && error.message.includes('403')) return false;
      return failureCount < 2;
    },
    ...queryOptions,
  });

  // Manual refresh with throttling
  const refresh = useCallback(async () => {
    const now = Date.now();
    
    // Throttle refreshes to max 1 per second
    if (now - lastRefreshRef.current < 1000) {
      return;
    }
    
    lastRefreshRef.current = now;

    try {
      await queryClient.invalidateQueries({ queryKey });
      
      if (manualRefreshToast) {
        toast({
          title: "Data Refreshed",
          description: "Latest data has been loaded",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Manual refresh failed:', error);
      toast({
        title: "Refresh Failed",
        description: "Could not load latest data. Please try again.",
        variant: "destructive",
      });
    }
  }, [queryClient, queryKey, manualRefreshToast, toast]);

  // Force refresh (bypasses throttling)
  const forceRefresh = useCallback(async () => {
    lastRefreshRef.current = 0;
    await refresh();
  }, [refresh]);

  // Update data optimistically
  const updateData = useCallback((updater: (old: T | undefined) => T) => {
    queryClient.setQueryData(queryKey, updater);
  }, [queryClient, queryKey]);

  // Get current cached data
  const getCachedData = useCallback((): T | undefined => {
    return queryClient.getQueryData(queryKey);
  }, [queryClient, queryKey]);

  return {
    ...query,
    refresh,
    forceRefresh,
    updateData,
    getCachedData,
    isStale: query.isStale,
    isFetching: query.isFetching,
    lastUpdated: query.dataUpdatedAt,
  };
}

export default useEnhancedQuery;