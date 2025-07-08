/**
 * Enhanced Reports Hook with Real-time Updates
 * Provides comprehensive reporting data with automatic refresh
 */

import { useCallback, useMemo } from 'react';
import { 
  getReportsSummary, 
  getReportsTrend, 
  getTopProducts, 
  getTopCustomers,
  getCustomerCredits 
} from '@/lib/supabase-data';
import { useEnhancedQuery } from './useEnhancedQuery';
import type { 
  ReportsSummary, 
  TrendData, 
  TopProduct, 
  TopCustomer, 
  CustomerCredit 
} from '@/types/schema';

export function useReports() {
  // Summary data with different time periods
  const useSummaryData = (period: string = 'weekly') => {
    return useEnhancedQuery<ReportsSummary>({
      queryKey: ['reports-summary', period],
      queryFn: () => getReportsSummary(period),
      enableRealtime: true,
      staleTime: 60 * 1000, // 1 minute
    });
  };

  // Trend data with different periods
  const useTrendData = (period: string = 'daily') => {
    return useEnhancedQuery<TrendData[]>({
      queryKey: ['reports-trend', period],
      queryFn: () => getReportsTrend(period),
      enableRealtime: true,
      staleTime: 30 * 1000, // 30 seconds
    });
  };

  // Top products data
  const useTopProducts = (period: string = 'weekly') => {
    return useEnhancedQuery<TopProduct[]>({
      queryKey: ['top-products', period],
      queryFn: () => getTopProducts(period),
      enableRealtime: true,
      staleTime: 60 * 1000, // 1 minute
    });
  };

  // Top customers data
  const useTopCustomers = (period: string = 'weekly') => {
    return useEnhancedQuery<TopCustomer[]>({
      queryKey: ['top-customers', period],
      queryFn: () => getTopCustomers(period),
      enableRealtime: true,
      staleTime: 60 * 1000, // 1 minute
    });
  };

  // Customer credits data
  const useCustomerCredits = () => {
    return useEnhancedQuery<CustomerCredit[]>({
      queryKey: ['customer-credits'],
      queryFn: getCustomerCredits,
      enableRealtime: true,
      staleTime: 30 * 1000, // 30 seconds
    });
  };

  // Refresh all reports data
  const refreshAllReports = useCallback(() => {
    // This will be implemented by the calling component
    // by calling individual refresh functions
  }, []);

  return {
    useSummaryData,
    useTrendData,
    useTopProducts,
    useTopCustomers,
    useCustomerCredits,
    refreshAllReports,
  };
}

export default useReports;