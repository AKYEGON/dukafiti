/**
 * Store-Isolated Customers Hook
 * Provides real-time customer management with RLS enforcement
 */

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/SupabaseAuth';
import { 
  getCustomers, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer 
} from '@/lib/store-isolated-data';
import { useToast } from '@/hooks/use-toast';
import type { Customer } from '@/types/schema';

export function useCustomersStore() {
  const { storeId, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Store-isolated customers query
  const {
    data: customers,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery<Customer[]>({
    queryKey: ['customers', storeId],
    queryFn: () => getCustomers(storeId!),
    enabled: isAuthenticated && !!storeId,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: (newCustomer) => {
      // Optimistically update the cache
      queryClient.setQueryData<Customer[]>(['customers', storeId], (old) => {
        return old ? [newCustomer, ...old] : [newCustomer];
      });
      queryClient.invalidateQueries({ queryKey: ['customers', storeId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics', storeId] });
      toast({ title: 'Success', description: 'Customer created successfully' });
    },
    onError: (error) => {
      console.error('Customer creation error:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to create customer', 
        variant: 'destructive' 
      });
    },
  });

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: any }) => 
      updateCustomer(id, updates, storeId!),
    onSuccess: (updatedCustomer) => {
      // Optimistically update the cache
      queryClient.setQueryData<Customer[]>(['customers', storeId], (old) => {
        return old ? old.map(c => c.id === updatedCustomer.id ? updatedCustomer : c) : [updatedCustomer];
      });
      queryClient.invalidateQueries({ queryKey: ['customers', storeId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics', storeId] });
      toast({ title: 'Success', description: 'Customer updated successfully' });
    },
    onError: (error) => {
      console.error('Customer update error:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to update customer', 
        variant: 'destructive' 
      });
    },
  });

  // Delete customer mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: (id: number) => deleteCustomer(id, storeId!),
    onSuccess: (_, deletedId) => {
      // Optimistically update the cache
      queryClient.setQueryData<Customer[]>(['customers', storeId], (old) => {
        return old ? old.filter(c => c.id !== deletedId) : [];
      });
      queryClient.invalidateQueries({ queryKey: ['customers', storeId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics', storeId] });
      toast({ title: 'Success', description: 'Customer deleted successfully' });
    },
    onError: (error) => {
      console.error('Customer deletion error:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to delete customer', 
        variant: 'destructive' 
      });
    },
  });

  // Helper functions
  const getCustomersWithDebt = () => {
    return customers?.filter(customer => 
      parseFloat(customer.balance) > 0
    ) || [];
  };

  const getTotalOutstandingCredit = () => {
    return customers?.reduce((total, customer) => {
      return total + (parseFloat(customer.balance) || 0);
    }, 0) || 0;
  };

  return {
    // Data
    customers: customers || [],
    customersWithDebt: getCustomersWithDebt(),
    totalOutstandingCredit: getTotalOutstandingCredit(),
    
    // Loading states
    isLoading,
    isFetching,
    isCreating: createCustomerMutation.isPending,
    isUpdating: updateCustomerMutation.isPending,
    isDeleting: deleteCustomerMutation.isPending,
    
    // Error states
    error,
    
    // Actions
    createCustomer: createCustomerMutation.mutate,
    updateCustomer: updateCustomerMutation.mutate,
    deleteCustomer: deleteCustomerMutation.mutate,
    refresh: refetch,
    
    // Store info
    storeId,
    isAuthenticated,
  };
}