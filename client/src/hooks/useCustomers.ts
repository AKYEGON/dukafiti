import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '@/contexts/SupabaseAuth';
import type { Customer } from '@shared/schema';

export function useCustomers() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['customers', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID');
      
      console.log('🔄 Fetching customers via React Query');
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Customers fetch error:', error);
        throw error;
      }
      
      console.log('✅ Customers fetched via React Query:', data?.length, 'items');
      return data || [];
    },
    enabled: !!user?.id
  });
}

export function useAddCustomer() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (newCustomer: Omit<Customer, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('No user ID');
      
      console.log('➕ Adding customer via React Query');
      const { data, error } = await supabase
        .from('customers')
        .insert([{ ...newCustomer, user_id: user.id }])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Add customer error:', error);
        throw error;
      }
      
      console.log('✅ Customer added via React Query:', data);
      return data;
    },
    onSuccess: () => {
      console.log('🔄 Invalidating customers cache after add');
      queryClient.invalidateQueries({ queryKey: ['customers', user?.id] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Customer> }) => {
      console.log('🔄 Updating customer via React Query:', id);
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Update customer error:', error);
        throw error;
      }
      
      console.log('✅ Customer updated via React Query:', data);
      return data;
    },
    onSuccess: () => {
      console.log('🔄 Invalidating customers cache after update');
      queryClient.invalidateQueries({ queryKey: ['customers', user?.id] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (id: number) => {
      console.log('🗑️ Deleting customer via React Query:', id);
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('❌ Delete customer error:', error);
        throw error;
      }
      
      console.log('✅ Customer deleted via React Query');
      return id;
    },
    onSuccess: () => {
      console.log('🔄 Invalidating customers cache after delete');
      queryClient.invalidateQueries({ queryKey: ['customers', user?.id] });
    },
  });
}

export function useRecordRepayment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      customerId, 
      amount, 
      method, 
      note 
    }: { 
      customerId: number; 
      amount: number; 
      method: 'cash' | 'mobileMoney'; 
      note?: string; 
    }) => {
      console.log('💳 Recording repayment via React Query:', { customerId, amount, method });
      
      // First, get current customer balance
      const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('balance')
        .eq('id', customerId)
        .single();
      
      if (fetchError) {
        console.error('❌ Fetch customer error:', fetchError);
        throw fetchError;
      }
      
      const currentBalance = parseFloat(customer.balance || '0');
      const newBalance = Math.max(0, currentBalance - amount);
      
      // Update customer balance
      const { data, error } = await supabase
        .from('customers')
        .update({ balance: newBalance.toString() })
        .eq('id', customerId)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Record repayment error:', error);
        throw error;
      }
      
      console.log('✅ Repayment recorded via React Query:', data);
      return data;
    },
    onSuccess: () => {
      console.log('🔄 Invalidating customers cache after repayment');
      queryClient.invalidateQueries({ queryKey: ['customers', user?.id] });
    },
  });
}