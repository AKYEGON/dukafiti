import { useQuery } from "@tanstack/react-query";
import { getDashboardMetrics, getRecentOrders } from "@/lib/supabase-data";

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ["/api/dashboard/metrics"],
    queryFn: getDashboardMetrics,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useRecentOrders() {
  return useQuery({
    queryKey: ["/api/dashboard/recent-orders"],
    queryFn: getRecentOrders,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}