/**
 * Store-Isolated Sales Hook
 * Provides real-time sales management with RLS enforcement
 */

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/SupabaseAuth';
import { 
  getOrders, 
  getRecentOrders, 
  createOrder 
} from '@/lib/store-isolated-data';
import { useToast } from '@/hooks/use-toast';
import type { Order } from '@/types/schema';

export function useSalesStore() {
  const { storeId, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Store-isolated orders query
  const {
    data: orders,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery<Order[]>({
    queryKey: ['orders', storeId],
    queryFn: () => getOrders(storeId!),
    enabled: isAuthenticated && !!storeId,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Store-isolated recent orders query
  const {
    data: recentOrders,
    isLoading: recentOrdersLoading,
    refetch: refetchRecentOrders,
  } = useQuery<Order[]>({
    queryKey: ['recent-orders', storeId],
    queryFn: () => getRecentOrders(storeId!, 10),
    enabled: isAuthenticated && !!storeId,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (newOrder) => {
      // Optimistically update the cache
      queryClient.setQueryData<Order[]>(['orders', storeId], (old) => {
        return old ? [newOrder, ...old] : [newOrder];
      });
      queryClient.setQueryData<Order[]>(['recent-orders', storeId], (old) => {
        const updated = old ? [newOrder, ...old] : [newOrder];
        return updated.slice(0, 10); // Keep only latest 10
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['orders', storeId] });
      queryClient.invalidateQueries({ queryKey: ['recent-orders', storeId] });
      queryClient.invalidateQueries({ queryKey: ['products', storeId] }); // For stock updates
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics', storeId] });
      
      toast({ title: 'Success', description: 'Sale completed successfully' });
    },
    onError: (error) => {
      console.error('Order creation error:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to complete sale', 
        variant: 'destructive' 
      });
    },
  });

  // Helper functions
  const getTotalSales = () => {
    return orders?.reduce((total, order) => {
      return total + (parseFloat(order.total) || 0);
    }, 0) || 0;
  };

  const getTotalOrders = () => {
    return orders?.length || 0;
  };

  const getTodaysSales = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return orders?.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= today;
    }) || [];
  };

  const getTodaysRevenue = () => {
    const todaysSales = getTodaysSales();
    return todaysSales.reduce((total, order) => {
      return total + (parseFloat(order.total) || 0);
    }, 0);
  };

  return {
    // Data
    orders: orders || [],
    recentOrders: recentOrders || [],
    todaysSales: getTodaysSales(),
    
    // Calculated values
    totalSales: getTotalSales(),
    totalOrders: getTotalOrders(),
    todaysRevenue: getTodaysRevenue(),
    
    // Loading states
    isLoading,
    isFetching,
    recentOrdersLoading,
    isCreatingOrder: createOrderMutation.isPending,
    
    // Error states
    error,
    
    // Actions
    createOrder: createOrderMutation.mutate,
    refresh: refetch,
    refreshRecentOrders: refetchRecentOrders,
    
    // Store info
    storeId,
    isAuthenticated,
  };
}