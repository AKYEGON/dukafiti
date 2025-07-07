/**
 * Enhanced Customers Hook with Real-time Updates
 * Provides comprehensive customer management with optimistic updates
 */

import { useCallback, useMemo } from 'react';
import { getCustomers } from '@/lib/supabase-data';
import { useEnhancedQuery } from './useEnhancedQuery';
import { useOptimisticUpdates } from './useOptimisticUpdates';
import type { Customer } from '@/types/schema';

export function useCustomers() {
  const { optimisticCreateCustomer, optimisticUpdateCustomer } = useOptimisticUpdates();

  // Enhanced query with real-time capabilities
  const {
    data: customers,
    isLoading,
    error,
    refresh,
    forceRefresh,
    updateData,
    isStale,
    isFetching,
  } = useEnhancedQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: getCustomers,
    enableRealtime: true,
    staleTime: 60 * 1000, // 1 minute
  });

  // Optimistic customer creation
  const createCustomerOptimistically = useCallback((customer: Partial<Customer>) => {
    return optimisticCreateCustomer(customer);
  }, [optimisticCreateCustomer]);

  // Optimistic customer update
  const updateCustomerOptimistically = useCallback((customerId: number, updates: Partial<Customer>) => {
    optimisticUpdateCustomer(customerId, updates);
  }, [optimisticUpdateCustomer]);

  // Helper functions with proper memoization
  const getCustomerById = useCallback((id: number): Customer | undefined => {
    return customers?.find(customer => customer.id === id);
  }, [customers]);

  const getCustomersByBalance = useCallback((hasDebt: boolean = true): Customer[] => {
    if (!customers) return [];
    return customers.filter(customer => {
      const balance = parseFloat(customer.balance?.toString() || '0');
      return hasDebt ? balance > 0 : balance <= 0;
    });
  }, [customers]);

  const getTotalCustomers = useMemo((): number => {
    return customers?.length || 0;
  }, [customers]);

  const getTotalOutstandingDebt = useMemo((): number => {
    if (!customers) return 0;
    return customers.reduce((total, customer) => {
      const balance = parseFloat(customer.balance?.toString() || '0');
      return total + Math.max(0, balance);
    }, 0);
  }, [customers]);

  const getCustomersWithHighDebt = useCallback((threshold: number = 1000): Customer[] => {
    if (!customers) return [];
    return customers.filter(customer => {
      const balance = parseFloat(customer.balance?.toString() || '0');
      return balance >= threshold;
    });
  }, [customers]);

  // Enhanced search function
  const searchCustomers = useCallback((query: string): Customer[] => {
    if (!customers || !query.trim()) return customers || [];
    
    const searchTerm = query.toLowerCase().trim();
    return customers.filter(customer => 
      customer.name?.toLowerCase().includes(searchTerm) ||
      customer.phone?.toLowerCase().includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm)
    );
  }, [customers]);

  // Sort customers
  const sortCustomers = useCallback((sortBy: string): Customer[] => {
    if (!customers) return [];
    
    const sorted = [...customers];
    
    switch (sortBy) {
      case 'name-asc':
        return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      case 'name-desc':
        return sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
      case 'balance-asc':
        return sorted.sort((a, b) => parseFloat(a.balance?.toString() || '0') - parseFloat(b.balance?.toString() || '0'));
      case 'balance-desc':
        return sorted.sort((a, b) => parseFloat(b.balance?.toString() || '0') - parseFloat(a.balance?.toString() || '0'));
      case 'recent':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      default:
        return sorted;
    }
  }, [customers]);

  return {
    // Data
    customers: customers || [],
    isLoading,
    error,
    isStale,
    isFetching,
    
    // Actions
    refresh,
    forceRefresh,
    createCustomerOptimistically,
    updateCustomerOptimistically,
    
    // Helper functions
    getCustomerById,
    getCustomersByBalance,
    getTotalCustomers,
    getTotalOutstandingDebt,
    getCustomersWithHighDebt,
    searchCustomers,
    sortCustomers,
  };
}

export default useCustomers;