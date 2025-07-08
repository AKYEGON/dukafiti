/**
 * Real-time Data Management Hook
 * Ensures all CRUD operations update immediately without rebuilds
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/SupabaseAuth';
import { useToast } from '@/hooks/use-toast';
import type { Product, Customer, Order, Notification } from '@/types/schema';

// Products Hook
export function useProducts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const channelRef = useRef<any>(null);

  // Fetch products function
  const fetchProducts = useCallback(async (): Promise<Product[]> => {
    if (!user?.id) return [];
    
    console.log('🔄 Fetching products from Supabase...');
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Products fetch error:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive"
      });
      return [];
    }
    
    console.log(`✅ Fetched ${data?.length || 0} products`);
    return data || [];
  }, [user?.id, toast]);

  // Query
  const { data: products = [], isLoading, error, refetch } = useQuery({
    queryKey: ['products', user?.id],
    queryFn: fetchProducts,
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0  // Don't cache data
  });

  // Manual refresh function
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Success",
        description: "Products refreshed"
      });
    } catch (error) {
      console.error('❌ Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch, toast]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔗 Setting up products real-time subscription...');
    
    const channel = supabase
      .channel(`products:store_id=eq.${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'products',
        filter: `store_id=eq.${user.id}`
      }, (payload) => {
        console.log('📡 Products real-time update:', payload);
        
        // Invalidate and refetch immediately
        queryClient.invalidateQueries(['products', user.id]);
        
        toast({
          title: "Data Updated",
          description: "Product list refreshed",
        });
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        console.log('🔌 Products subscription cleaned up');
      }
    };
  }, [user?.id, queryClient, toast]);

  // Mutations
  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('products')
        .insert([{ ...productData, store_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products', user?.id]);
      toast({
        title: "Success",
        description: "Product created successfully"
      });
    },
    onError: (error: any) => {
      console.error('❌ Create product error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive"
      });
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: any) => {
      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .eq('store_id', user?.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products', user?.id]);
      toast({
        title: "Success",
        description: "Product updated successfully"
      });
    },
    onError: (error: any) => {
      console.error('❌ Update product error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive"
      });
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('store_id', user?.id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products', user?.id]);
      toast({
        title: "Success",
        description: "Product deleted successfully"
      });
    },
    onError: (error: any) => {
      console.error('❌ Delete product error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive"
      });
    }
  });

  return {
    products,
    isLoading,
    isRefreshing,
    error,
    refreshData,
    createProduct: createProductMutation.mutate,
    updateProduct: updateProductMutation.mutate,
    deleteProduct: deleteProductMutation.mutate,
    isCreating: createProductMutation.isPending,
    isUpdating: updateProductMutation.isPending,
    isDeleting: deleteProductMutation.isPending
  };
}

// Customers Hook
export function useCustomers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const channelRef = useRef<any>(null);

  // Fetch customers function
  const fetchCustomers = useCallback(async (): Promise<Customer[]> => {
    if (!user?.id) return [];
    
    console.log('🔄 Fetching customers from Supabase...');
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('store_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Customers fetch error:', error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive"
      });
      return [];
    }
    
    console.log(`✅ Fetched ${data?.length || 0} customers`);
    return data || [];
  }, [user?.id, toast]);

  // Query
  const { data: customers = [], isLoading, error, refetch } = useQuery({
    queryKey: ['customers', user?.id],
    queryFn: fetchCustomers,
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
    staleTime: 0,
    cacheTime: 0
  });

  // Manual refresh function
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Success",
        description: "Customers refreshed"
      });
    } catch (error) {
      console.error('❌ Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch, toast]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔗 Setting up customers real-time subscription...');
    
    const channel = supabase
      .channel(`customers:store_id=eq.${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'customers',
        filter: `store_id=eq.${user.id}`
      }, (payload) => {
        console.log('📡 Customers real-time update:', payload);
        queryClient.invalidateQueries(['customers', user.id]);
        
        toast({
          title: "Data Updated",
          description: "Customer list refreshed",
        });
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        console.log('🔌 Customers subscription cleaned up');
      }
    };
  }, [user?.id, queryClient, toast]);

  // Mutations
  const createCustomerMutation = useMutation({
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
      queryClient.invalidateQueries(['customers', user?.id]);
      toast({
        title: "Success",
        description: "Customer created successfully"
      });
    },
    onError: (error: any) => {
      console.error('❌ Create customer error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create customer",
        variant: "destructive"
      });
    }
  });

  const updateCustomerMutation = useMutation({
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
      queryClient.invalidateQueries(['customers', user?.id]);
      toast({
        title: "Success",
        description: "Customer updated successfully"
      });
    },
    onError: (error: any) => {
      console.error('❌ Update customer error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update customer",
        variant: "destructive"
      });
    }
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)
        .eq('store_id', user?.id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['customers', user?.id]);
      toast({
        title: "Success",
        description: "Customer deleted successfully"
      });
    },
    onError: (error: any) => {
      console.error('❌ Delete customer error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer",
        variant: "destructive"
      });
    }
  });

  return {
    customers,
    isLoading,
    isRefreshing,
    error,
    refreshData,
    createCustomer: createCustomerMutation.mutate,
    updateCustomer: updateCustomerMutation.mutate,
    deleteCustomer: deleteCustomerMutation.mutate,
    isCreating: createCustomerMutation.isPending,
    isUpdating: updateCustomerMutation.isPending,
    isDeleting: deleteCustomerMutation.isPending
  };
}

// Orders Hook
export function useOrders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const channelRef = useRef<any>(null);

  // Fetch orders function
  const fetchOrders = useCallback(async (): Promise<Order[]> => {
    if (!user?.id) return [];
    
    console.log('🔄 Fetching orders from Supabase...');
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('store_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Orders fetch error:', error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive"
      });
      return [];
    }
    
    console.log(`✅ Fetched ${data?.length || 0} orders`);
    return data || [];
  }, [user?.id, toast]);

  // Query
  const { data: orders = [], isLoading, error, refetch } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: fetchOrders,
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
    staleTime: 0,
    cacheTime: 0
  });

  // Manual refresh function
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Success",
        description: "Orders refreshed"
      });
    } catch (error) {
      console.error('❌ Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch, toast]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔗 Setting up orders real-time subscription...');
    
    const channel = supabase
      .channel(`orders:store_id=eq.${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `store_id=eq.${user.id}`
      }, (payload) => {
        console.log('📡 Orders real-time update:', payload);
        queryClient.invalidateQueries(['orders', user.id]);
        
        toast({
          title: "Data Updated",
          description: "Orders list refreshed",
        });
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        console.log('🔌 Orders subscription cleaned up');
      }
    };
  }, [user?.id, queryClient, toast]);

  return {
    orders,
    isLoading,
    isRefreshing,
    error,
    refreshData
  };
}

// Notifications Hook
export function useNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const channelRef = useRef<any>(null);

  // Fetch notifications function
  const fetchNotifications = useCallback(async (): Promise<Notification[]> => {
    if (!user?.id) return [];
    
    console.log('🔄 Fetching notifications from Supabase...');
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Notifications fetch error:', error);
      return [];
    }
    
    console.log(`✅ Fetched ${data?.length || 0} notifications`);
    return data || [];
  }, [user?.id]);

  // Query
  const { data: notifications = [], isLoading, error, refetch } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: fetchNotifications,
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
    staleTime: 0,
    cacheTime: 0
  });

  // Manual refresh function
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('❌ Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔗 Setting up notifications real-time subscription...');
    
    const channel = supabase
      .channel(`notifications:user_id=eq.${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('📡 Notifications real-time update:', payload);
        queryClient.invalidateQueries(['notifications', user.id]);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        console.log('🔌 Notifications subscription cleaned up');
      }
    };
  }, [user?.id, queryClient]);

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationIds: string[]) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', notificationIds)
        .eq('user_id', user?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications', user?.id]);
    },
    onError: (error: any) => {
      console.error('❌ Mark as read error:', error);
    }
  });

  return {
    notifications,
    isLoading,
    isRefreshing,
    error,
    refreshData,
    markAsRead: markAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending
  };
}