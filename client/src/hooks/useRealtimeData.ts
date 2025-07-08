/**
 * Enhanced Real-time Data Management Hook
 * Provides comprehensive real-time subscriptions and optimistic updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { 
  getProducts, 
  getCustomers, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  restockProduct,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  recordCustomerRepayment
} from '@/lib/supabase-data';
import type { Product, Customer } from '@/types/schema';

interface UseRealtimeDataReturn {
  // Products
  products: Product[];
  productsLoading: boolean;
  productsError: any;
  refreshProducts: () => Promise<void>;
  
  // Customers  
  customers: Customer[];
  customersLoading: boolean;
  customersError: any;
  refreshCustomers: () => Promise<void>;
  
  // Mutations
  createProductMutation: any;
  updateProductMutation: any;
  deleteProductMutation: any;
  restockProductMutation: any;
  createCustomerMutation: any;
  updateCustomerMutation: any;
  deleteCustomerMutation: any;
  recordRepaymentMutation: any;
  
  // Status
  isConnected: boolean;
  pendingOperations: number;
}

export function useRealtimeData(): UseRealtimeDataReturn {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(true);
  const [pendingOperations, setPendingOperations] = useState(0);
  const subscriptionsRef = useRef<any[]>([]);

  // Get current user for store isolation
  const getCurrentUser = useCallback(async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      console.log('⚠️ No authenticated user, using demo mode');
      return null; // Allow demo mode
    }
    return user;
  }, []);

  // Enhanced Products Query with better error handling
  const {
    data: products = [],
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts
  } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          // Demo mode - get all products
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          return data || [];
        }
        
        return await getProducts(user.id);
      } catch (error) {
        console.error('❌ Products fetch error:', error);
        
        // Fallback: try to get any accessible products
        try {
          const { data, error: fallbackError } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
          
          if (fallbackError) throw fallbackError;
          console.log('✅ Using fallback products data');
          return data || [];
        } catch (fallbackError) {
          console.error('❌ Fallback products fetch failed:', fallbackError);
          throw error; // Throw original error
        }
      }
    },
    staleTime: 30000, // 30 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Enhanced Customers Query with better error handling
  const {
    data: customers = [],
    isLoading: customersLoading,
    error: customersError,
    refetch: refetchCustomers
  } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          // Demo mode - get all customers
          const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          return data || [];
        }
        
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('store_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('❌ Customers fetch error:', error);
        
        // Fallback: try to get any accessible customers
        try {
          const { data, error: fallbackError } = await supabase
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
          
          if (fallbackError) throw fallbackError;
          console.log('✅ Using fallback customers data');
          return data || [];
        } catch (fallbackError) {
          console.error('❌ Fallback customers fetch failed:', fallbackError);
          throw error;
        }
      }
    },
    staleTime: 30000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Enhanced Real-time Subscriptions
  useEffect(() => {
    console.log('🔄 Setting up real-time subscriptions...');
    
    // Products subscription
    const productsChannel = supabase
      .channel('products-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          console.log('📦 Products change detected:', payload);
          
          queryClient.setQueryData<Product[]>(['products'], (old) => {
            if (!old) return old;
            
            switch (payload.eventType) {
              case 'INSERT':
                return [payload.new as Product, ...old];
              case 'UPDATE':
                return old.map(p => p.id === payload.new.id ? payload.new as Product : p);
              case 'DELETE':
                return old.filter(p => p.id !== payload.old.id);
              default:
                return old;
            }
          });
          
          // Also invalidate related queries
          queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
        }
      )
      .subscribe();

    // Customers subscription
    const customersChannel = supabase
      .channel('customers-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'customers' },
        (payload) => {
          console.log('👥 Customers change detected:', payload);
          
          queryClient.setQueryData<Customer[]>(['customers'], (old) => {
            if (!old) return old;
            
            switch (payload.eventType) {
              case 'INSERT':
                return [payload.new as Customer, ...old];
              case 'UPDATE':
                return old.map(c => c.id === payload.new.id ? payload.new as Customer : c);
              case 'DELETE':
                return old.filter(c => c.id !== payload.old.id);
              default:
                return old;
            }
          });
          
          queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
        }
      )
      .subscribe();

    subscriptionsRef.current = [productsChannel, customersChannel];

    return () => {
      console.log('🔄 Cleaning up subscriptions...');
      subscriptionsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      subscriptionsRef.current = [];
    };
  }, [queryClient]);

  // Enhanced Product Mutations with optimistic updates
  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onMutate: async (newProduct) => {
      setPendingOperations(prev => prev + 1);
      
      // Optimistic update
      const tempProduct = {
        id: Date.now(), // Temporary ID
        ...newProduct,
        created_at: new Date().toISOString(),
        sales_count: 0
      };
      
      queryClient.setQueryData<Product[]>(['products'], (old) => {
        return old ? [tempProduct, ...old] : [tempProduct];
      });
      
      return { tempProduct };
    },
    onSuccess: (data, variables, context) => {
      setPendingOperations(prev => prev - 1);
      
      // Replace temp product with real one
      queryClient.setQueryData<Product[]>(['products'], (old) => {
        if (!old) return [data];
        return old.map(p => p.id === context?.tempProduct.id ? data : p);
      });
      
      toast({ title: "Product created successfully" });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
    onError: (error, variables, context) => {
      setPendingOperations(prev => prev - 1);
      
      // Remove temp product
      queryClient.setQueryData<Product[]>(['products'], (old) => {
        return old ? old.filter(p => p.id !== context?.tempProduct.id) : [];
      });
      
      toast({ 
        title: "Failed to create product", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: any }) => updateProduct(id, updates),
    onMutate: async ({ id, updates }) => {
      setPendingOperations(prev => prev + 1);
      
      // Optimistic update
      queryClient.setQueryData<Product[]>(['products'], (old) => {
        return old ? old.map(p => p.id === id ? { ...p, ...updates } : p) : [];
      });
    },
    onSuccess: () => {
      setPendingOperations(prev => prev - 1);
      toast({ title: "Product updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
    onError: (error) => {
      setPendingOperations(prev => prev - 1);
      refetchProducts(); // Revert on error
      toast({ 
        title: "Failed to update product", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: deleteProduct,
    onMutate: async (productId) => {
      setPendingOperations(prev => prev + 1);
      
      // Optimistic update
      queryClient.setQueryData<Product[]>(['products'], (old) => {
        return old ? old.filter(p => p.id !== productId) : [];
      });
    },
    onSuccess: () => {
      setPendingOperations(prev => prev - 1);
      toast({ title: "Product deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
    onError: (error) => {
      setPendingOperations(prev => prev - 1);
      refetchProducts(); // Revert on error
      toast({ 
        title: "Failed to delete product", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const restockProductMutation = useMutation({
    mutationFn: ({ id, quantity, costPrice }: { id: number; quantity: number; costPrice: number }) => 
      restockProduct(id, quantity, costPrice),
    onSuccess: () => {
      toast({ title: "Stock updated successfully" });
      refetchProducts();
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to update stock", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Customer Mutations (similar pattern)
  const createCustomerMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      toast({ title: "Customer created successfully" });
      refetchCustomers();
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to create customer", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: any }) => updateCustomer(id, updates),
    onSuccess: () => {
      toast({ title: "Customer updated successfully" });
      refetchCustomers();
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to update customer", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      toast({ title: "Customer deleted successfully" });
      refetchCustomers();
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to delete customer", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const recordRepaymentMutation = useMutation({
    mutationFn: ({ customerId, amount }: { customerId: number; amount: number }) => 
      recordCustomerRepayment(customerId, amount),
    onSuccess: () => {
      toast({ title: "Payment recorded successfully" });
      refetchCustomers();
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to record payment", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Manual refresh functions
  const refreshProducts = useCallback(async () => {
    console.log('🔄 Manually refreshing products');
    await refetchProducts();
    queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
  }, [refetchProducts, queryClient]);

  const refreshCustomers = useCallback(async () => {
    console.log('🔄 Manually refreshing customers');
    await refetchCustomers();
    queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
  }, [refetchCustomers, queryClient]);

  return {
    // Products
    products,
    productsLoading,
    productsError,
    refreshProducts,
    
    // Customers
    customers,
    customersLoading,
    customersError,
    refreshCustomers,
    
    // Mutations
    createProductMutation,
    updateProductMutation,
    deleteProductMutation,
    restockProductMutation,
    createCustomerMutation,
    updateCustomerMutation,
    deleteCustomerMutation,
    recordRepaymentMutation,
    
    // Status
    isConnected,
    pendingOperations,
  };
}