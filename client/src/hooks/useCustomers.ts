/**
 * Enhanced Customers Hook with Real-time Updates
 * Provides comprehensive customer management with optimistic updates
 */

import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCustomers } from '@/lib/supabase-data';
import { useDynamicData } from './useDynamicData';
import type { Customer } from '@/types/schema';

export function useCustomers() {
  const queryClient = useQueryClient();
  const [localCustomers, setLocalCustomers] = useState<Customer[]>([]);

  // Runtime data fetching with useQuery
  const {
    data: customers,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const data = await getCustomers();
      setLocalCustomers(data || []);
      return data;
    },
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Real-time subscription with dynamic data hook
  const { forceRefresh, updateDataOptimistically, isConnected } = useDynamicData({
    table: 'customers',
    queryKey: ['customers'],
    fetchFunction: getCustomers,
    onInsert: (payload) => {
      console.log('Customer inserted:', payload.new);
      setLocalCustomers(prev => [...(prev || []), payload.new]);
    },
    onUpdate: (payload) => {
      console.log('Customer updated:', payload.new);
      setLocalCustomers(prev => 
        (prev || []).map(c => c.id === payload.new.id ? payload.new : c)
      );
    },
    onDelete: (payload) => {
      console.log('Customer deleted:', payload.old);
      setLocalCustomers(prev => 
        (prev || []).filter(c => c.id !== payload.old.id)
      );
    },
  });

  // Use local customers if available, fallback to query data
  const currentCustomers = localCustomers.length > 0 ? localCustomers : (customers || []);

  // Optimistic customer creation
  const createCustomerOptimistically = useCallback((customer: Partial<Customer>) => {
    const newCustomer = { ...customer, id: Date.now() } as Customer;
    setLocalCustomers(prev => [...(prev || []), newCustomer]);
    
    // Update query cache immediately
    updateDataOptimistically((oldData: Customer[]) => 
      [...(oldData || []), newCustomer]
    );
    
    return newCustomer;
  }, [updateDataOptimistically]);

  // Optimistic customer update
  const updateCustomerOptimistically = useCallback((customerId: number, updates: Partial<Customer>) => {
    setLocalCustomers(prev => 
      prev.map(c => c.id === customerId ? { ...c, ...updates } : c)
    );
    
    // Update query cache immediately
    updateDataOptimistically((oldData: Customer[]) => 
      (oldData || []).map(c => c.id === customerId ? { ...c, ...updates } : c)
    );
  }, [updateDataOptimistically]);

  // Helper functions with proper memoization
  const getCustomerById = useCallback((id: number): Customer | undefined => {
    return currentCustomers?.find(customer => customer.id === id);
  }, [currentCustomers]);

  const getCustomersByBalance = useCallback((hasDebt: boolean = true): Customer[] => {
    if (!currentCustomers) return [];
    return currentCustomers.filter(customer => {
      const balance = parseFloat(customer.balance?.toString() || '0');
      return hasDebt ? balance > 0 : balance <= 0;
    });
  }, [currentCustomers]);

  const getTotalCustomers = useMemo((): number => {
    return currentCustomers?.length || 0;
  }, [currentCustomers]);

  const getTotalOutstandingDebt = useMemo((): number => {
    if (!currentCustomers) return 0;
    return currentCustomers.reduce((total, customer) => {
      const balance = parseFloat(customer.balance?.toString() || '0');
      return total + Math.max(0, balance);
    }, 0);
  }, [currentCustomers]);

  const getCustomersWithHighDebt = useCallback((threshold: number = 1000): Customer[] => {
    if (!currentCustomers) return [];
    return currentCustomers.filter(customer => {
      const balance = parseFloat(customer.balance?.toString() || '0');
      return balance >= threshold;
    });
  }, [currentCustomers]);

  // Enhanced search function
  const searchCustomers = useCallback((query: string): Customer[] => {
    if (!currentCustomers || !query.trim()) return currentCustomers || [];
    
    const searchTerm = query.toLowerCase().trim();
    return currentCustomers.filter(customer => 
      customer.name?.toLowerCase().includes(searchTerm) ||
      customer.phone?.toLowerCase().includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm)
    );
  }, [currentCustomers]);

  // Sort customers
  const sortCustomers = useCallback((sortBy: string): Customer[] => {
    if (!currentCustomers) return [];
    
    const sorted = [...currentCustomers];
    
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
  }, [currentCustomers]);

  return {
    // Data - use currentCustomers for real-time updates
    customers: currentCustomers,
    isLoading,
    error,
    isStale: false, // Always fresh with real-time updates
    isFetching,
    isConnected,
    
    // Actions
    refresh: refetch,
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