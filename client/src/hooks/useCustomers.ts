import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/SupabaseAuth';
import type { Customer } from '@shared/schema';
import { 
  getCustomers, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer, 
  recordCustomerRepayment 
} from '@/lib/supabase-data';

export function useCustomers() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      console.log('👥 Fetching customers via React Query');
      return await getCustomers();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!user?.id
  });
}

export function useAddCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newCustomer: any) => {
      console.log('➕ Adding customer via React Query using createCustomer');
      return await createCustomer(newCustomer);
    },
    onSuccess: () => {
      console.log('🔄 Invalidating customers cache after add');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      console.log('🔄 Updating customer via React Query using updateCustomer');
      return await updateCustomer(id, updates);
    },
    onSuccess: () => {
      console.log('🔄 Invalidating customers cache after update');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      console.log('🗑️ Deleting customer via React Query using deleteCustomer');
      return await deleteCustomer(id);
    },
    onSuccess: () => {
      console.log('🔄 Invalidating customers cache after delete');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useRecordRepayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ customerId, amount, method, note }: { 
      customerId: number; 
      amount: number; 
      method: string; 
      note?: string 
    }) => {
      console.log('💰 Recording repayment via React Query');
      return await recordCustomerRepayment(customerId, amount, method, note);
    },
    onSuccess: () => {
      console.log('🔄 Invalidating customers cache after repayment');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}