/**
 * Simplified Sales Hook with React Query
 * Clean implementation to avoid import issues
 */

import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Order } from '@/types/schema';

export function useSalesSimple() {
  const queryClient = useQueryClient();

  // Basic orders query
  const {
    data: orders,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Failed to fetch orders:', error);
        throw error;
      }
      
      return data || [];
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Basic recent orders query
  const {
    data: recentOrders,
    isLoading: recentOrdersLoading,
    refetch: refreshRecentOrders,
  } = useQuery<Order[]>({
    queryKey: ['recent-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Failed to fetch recent orders:', error);
        throw error;
      }
      
      return data || [];
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Helper functions
  const getTotalSales = useMemo((): number => {
    if (!orders) return 0;
    return orders.reduce((total, order) => total + parseFloat(order.total || '0'), 0);
  }, [orders]);

  const getTotalOrders = useMemo((): number => {
    return orders?.length || 0;
  }, [orders]);

  return {
    // Data
    orders: orders || [],
    recentOrders: recentOrders || [],
    isLoading,
    recentOrdersLoading,
    error,
    isFetching,
    
    // Actions
    refresh: refetch,
    forceRefresh: () => {
      refetch();
      refreshRecentOrders();
    },
    refreshRecentOrders,
    
    // Helper functions
    getTotalSales,
    getTotalOrders,
  };
}