/**
 * Simple Customers Hook - Clean solution without conflicts
 * Direct Supabase integration with minimal dependencies
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/SupabaseAuth';
import { useToast } from '@/hooks/use-toast';
import type { Customer } from '@/types/schema';

export function useSimpleCustomers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch customers
  const { data: customers = [], isLoading, error, refetch } = useQuery({
    queryKey: ['customers', user?.id],
    queryFn: async (): Promise<Customer[]> => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('store_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 0
  });

  // Create customer
  const createMutation = useMutation({
    mutationFn: async (customerData: any) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('customers')
        .insert([{ ...customerData, store_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "Success",
        description: "Customer created successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create customer",
        variant: "destructive"
      });
    }
  });

  // Update customer
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: any) => {
      const { data, error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', id)
        .eq('store_id', user?.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "Success",
        description: "Customer updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update customer",
        variant: "destructive"
      });
    }
  });

  // Delete customer
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Delete related orders and order items first (cascade delete)
      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('customer_id', id)
        .eq('store_id', user.id);
      
      if (orders && orders.length > 0) {
        // Delete order items first
        for (const order of orders) {
          await supabase
            .from('order_items')
            .delete()
            .eq('order_id', order.id);
        }
        
        // Then delete orders
        await supabase
          .from('orders')
          .delete()
          .eq('customer_id', id)
          .eq('store_id', user.id);
      }
      
      // Delete any payments
      await supabase
        .from('payments')
        .delete()
        .eq('customer_id', id)
        .eq('store_id', user.id);
      
      // Finally delete the customer
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)
        .eq('store_id', user.id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast({
        title: "Success",
        description: "Customer deleted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer",
        variant: "destructive"
      });
    }
  });

  // Record repayment
  const recordRepaymentMutation = useMutation({
    mutationFn: async ({ customerId, amount }: { customerId: number; amount: number }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Get current customer data
      const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('balance')
        .eq('id', customerId)
        .eq('store_id', user.id)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Calculate new balance
      const currentBalance = parseFloat(customer.balance) || 0;
      const newBalance = Math.max(0, currentBalance - amount);
      
      const { data, error } = await supabase
        .from('customers')
        .update({ balance: newBalance.toFixed(2) })
        .eq('id', customerId)
        .eq('store_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast({
        title: "Success",
        description: "Payment recorded successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record payment",
        variant: "destructive"
      });
    }
  });

  return {
    customers,
    isLoading,
    error,
    refetch,
    createCustomer: createMutation.mutate,
    updateCustomer: updateMutation.mutate,
    deleteCustomer: deleteMutation.mutate,
    recordRepayment: recordRepaymentMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isRecordingRepayment: recordRepaymentMutation.isPending
  };
}