/**
 * Store-Isolated Data Hook
 * All data queries filter by current user's store_id
 */

import { useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/SupabaseAuth';
import { useToast } from '@/hooks/use-toast';

export function useStoreData() {
  const { storeId, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Store-isolated products query
  const {
    data: products,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ['products', storeId],
    queryFn: async () => {
      if (!storeId) throw new Error('No store ID');
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated && !!storeId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Store-isolated customers query
  const {
    data: customers,
    isLoading: customersLoading,
    error: customersError,
    refetch: refetchCustomers,
  } = useQuery({
    queryKey: ['customers', storeId],
    queryFn: async () => {
      if (!storeId) throw new Error('No store ID');
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated && !!storeId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Store-isolated orders query
  const {
    data: orders,
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ['orders', storeId],
    queryFn: async () => {
      if (!storeId) throw new Error('No store ID');
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated && !!storeId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Store-isolated notifications query
  const {
    data: notifications,
    isLoading: notificationsLoading,
    error: notificationsError,
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: ['notifications', storeId],
    queryFn: async () => {
      if (!storeId) throw new Error('No store ID');
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated && !!storeId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Mutation for creating product (auto includes store_id via triggers)
  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', storeId] });
      toast({ title: 'Success', description: 'Product created successfully' });
    },
    onError: (error) => {
      console.error('Product creation error:', error);
      toast({ title: 'Error', description: 'Failed to create product', variant: 'destructive' });
    },
  });

  // Mutation for creating customer (auto includes store_id via triggers)
  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: any) => {
      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', storeId] });
      toast({ title: 'Success', description: 'Customer created successfully' });
    },
    onError: (error) => {
      console.error('Customer creation error:', error);
      toast({ title: 'Error', description: 'Failed to create customer', variant: 'destructive' });
    },
  });

  // Mutation for creating order (auto includes store_id via triggers)
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', storeId] });
      queryClient.invalidateQueries({ queryKey: ['products', storeId] }); // Refresh products for stock updates
      toast({ title: 'Success', description: 'Order created successfully' });
    },
    onError: (error) => {
      console.error('Order creation error:', error);
      toast({ title: 'Error', description: 'Failed to create order', variant: 'destructive' });
    },
  });

  // Force refresh all store data
  const refreshAllData = useCallback(() => {
    if (storeId) {
      refetchProducts();
      refetchCustomers();
      refetchOrders();
      refetchNotifications();
    }
  }, [storeId, refetchProducts, refetchCustomers, refetchOrders, refetchNotifications]);

  return {
    // Data
    products: products || [],
    customers: customers || [],
    orders: orders || [],
    notifications: notifications || [],
    
    // Loading states
    productsLoading,
    customersLoading,
    ordersLoading,
    notificationsLoading,
    
    // Errors
    productsError,
    customersError,
    ordersError,
    notificationsError,
    
    // Mutations
    createProduct: createProductMutation.mutate,
    createCustomer: createCustomerMutation.mutate,
    createOrder: createOrderMutation.mutate,
    
    // Mutation states
    creatingProduct: createProductMutation.isPending,
    creatingCustomer: createCustomerMutation.isPending,
    creatingOrder: createOrderMutation.isPending,
    
    // Actions
    refreshAllData,
    refetchProducts,
    refetchCustomers,
    refetchOrders,
    refetchNotifications,
    
    // Store info
    storeId,
    isAuthenticated,
  };
}