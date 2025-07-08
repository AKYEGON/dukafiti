/**
 * Store-Isolated Dashboard Hook
 * Provides real-time dashboard metrics with RLS enforcement
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/SupabaseAuth';
import { getDashboardMetrics } from '@/lib/store-isolated-data';
import { useToast } from '@/hooks/use-toast';

export function useDashboardStore() {
  const { storeId, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Store-isolated dashboard metrics query
  const {
    data: metrics,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['dashboard-metrics', storeId],
    queryFn: () => getDashboardMetrics(storeId!),
    enabled: isAuthenticated && !!storeId,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Force refresh all dashboard data
  const refreshDashboard = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-metrics', storeId] });
    queryClient.invalidateQueries({ queryKey: ['products', storeId] });
    queryClient.invalidateQueries({ queryKey: ['customers', storeId] });
    queryClient.invalidateQueries({ queryKey: ['orders', storeId] });
    queryClient.invalidateQueries({ queryKey: ['recent-orders', storeId] });
    queryClient.invalidateQueries({ queryKey: ['notifications', storeId] });
  };

  return {
    // Data
    metrics: metrics || {
      totalRevenue: "0.00",
      totalOrders: 0,
      totalProducts: 0,
      totalCustomers: 0,
      revenueGrowth: "0.0",
      ordersGrowth: "0.0",
      lowStockCount: 0,
      activeCustomersCount: 0
    },
    
    // Loading states
    isLoading,
    isFetching,
    
    // Error states
    error,
    
    // Actions
    refresh: refetch,
    refreshDashboard,
    
    // Store info
    storeId,
    isAuthenticated,
  };
}