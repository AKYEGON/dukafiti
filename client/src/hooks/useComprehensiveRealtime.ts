/**
 * Comprehensive Real-time Data Management Hook
 * Single source of truth for all inventory and customer operations
 * Provides immediate UI updates with proper error handling and rollback
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

interface UseComprehensiveRealtimeReturn {
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

export function useComprehensiveRealtime(): UseComprehensiveRealtimeReturn {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(true);
  const [pendingOperations, setPendingOperations] = useState(0);
  const subscriptionsRef = useRef<any[]>([]);

  // Get current user for store isolation
  const getCurrentUser = useCallback(async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new Error('User not authenticated');
    }
    return user;
  }, []);

  // Products Query with optimistic caching
  const {
    data: products = [],
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts
  } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const user = await getCurrentUser();
      console.log('🔍 Fetching products for store:', user.id);
      const data = await getProducts(user.id);
      console.log('✅ Products fetched:', data?.length || 0);
      return data || [];
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Customers Query with optimistic caching
  const {
    data: customers = [],
    isLoading: customersLoading,
    error: customersError,
    refetch: refetchCustomers
  } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const user = await getCurrentUser();
      console.log('🔍 Fetching customers for store:', user.id);
      const data = await getCustomers(user.id);
      console.log('✅ Customers fetched:', data?.length || 0);
      return data || [];
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Helper function for optimistic updates
  const performOptimisticUpdate = useCallback((
    queryKey: string[],
    updateFn: (oldData: any) => any,
    rollbackFn?: () => void
  ) => {
    const previousData = queryClient.getQueryData(queryKey);
    
    // Apply optimistic update
    queryClient.setQueryData(queryKey, updateFn);
    
    return {
      rollback: () => {
        queryClient.setQueryData(queryKey, previousData);
        rollbackFn?.();
      }
    };
  }, [queryClient]);

  // Products Mutations
  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      setPendingOperations(prev => prev + 1);
      console.log('➕ Creating product:', productData.name);
      
      const tempId = Date.now();
      const tempProduct = { ...productData, id: tempId };
      
      // Optimistic update
      const { rollback } = performOptimisticUpdate(
        ['products'],
        (old: Product[]) => [tempProduct, ...(old || [])]
      );
      
      try {
        const result = await createProduct(productData);
        console.log('✅ Product created successfully:', result);
        
        // Replace temp product with real one
        queryClient.setQueryData(['products'], (old: Product[]) => 
          (old || []).map(p => p.id === tempId ? result : p)
        );
        
        return result;
      } catch (error) {
        console.error('❌ Product creation failed:', error);
        rollback();
        throw error;
      } finally {
        setPendingOperations(prev => prev - 1);
      }
    },
    onSuccess: async () => {
      await Promise.all([
        refetchProducts(),
        queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      ]);
      toast({ title: "Product created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create product", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      setPendingOperations(prev => prev + 1);
      console.log('✏️ Updating product:', id, updates);
      
      // Optimistic update
      const { rollback } = performOptimisticUpdate(
        ['products'],
        (old: Product[]) => (old || []).map(p => p.id === id ? { ...p, ...updates } : p)
      );
      
      try {
        const result = await updateProduct(id, updates);
        console.log('✅ Product updated successfully:', result);
        return result;
      } catch (error) {
        console.error('❌ Product update failed:', error);
        rollback();
        throw error;
      } finally {
        setPendingOperations(prev => prev - 1);
      }
    },
    onSuccess: async () => {
      await Promise.all([
        refetchProducts(),
        queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      ]);
      toast({ title: "Product updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update product", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      setPendingOperations(prev => prev + 1);
      console.log('🗑️ Deleting product:', id);
      
      // Optimistic update
      const { rollback } = performOptimisticUpdate(
        ['products'],
        (old: Product[]) => (old || []).filter(p => p.id !== id)
      );
      
      try {
        await deleteProduct(id);
        console.log('✅ Product deleted successfully');
      } catch (error) {
        console.error('❌ Product deletion failed:', error);
        rollback();
        throw error;
      } finally {
        setPendingOperations(prev => prev - 1);
      }
    },
    onSuccess: async () => {
      await Promise.all([
        refetchProducts(),
        queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      ]);
      toast({ title: "Product deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete product", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const restockProductMutation = useMutation({
    mutationFn: async (restockData: any) => {
      setPendingOperations(prev => prev + 1);
      console.log('📦 Restocking product:', restockData.productId, restockData.quantity);
      
      // Optimistic update
      const { rollback } = performOptimisticUpdate(
        ['products'],
        (old: Product[]) => (old || []).map(p => 
          p.id === restockData.productId 
            ? { ...p, stock: (p.stock || 0) + restockData.quantity }
            : p
        )
      );
      
      try {
        const result = await restockProduct(restockData);
        console.log('✅ Product restocked successfully:', result);
        return result;
      } catch (error) {
        console.error('❌ Product restock failed:', error);
        rollback();
        throw error;
      } finally {
        setPendingOperations(prev => prev - 1);
      }
    },
    onSuccess: async () => {
      await Promise.all([
        refetchProducts(),
        queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      ]);
      toast({ title: "Product restocked successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to restock product", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Customer Mutations
  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: any) => {
      setPendingOperations(prev => prev + 1);
      console.log('➕ Creating customer:', customerData.name);
      
      const tempId = Date.now();
      const tempCustomer = { ...customerData, id: tempId };
      
      // Optimistic update
      const { rollback } = performOptimisticUpdate(
        ['customers'],
        (old: Customer[]) => [tempCustomer, ...(old || [])]
      );
      
      try {
        const result = await createCustomer(customerData);
        console.log('✅ Customer created successfully:', result);
        
        // Replace temp customer with real one
        queryClient.setQueryData(['customers'], (old: Customer[]) => 
          (old || []).map(c => c.id === tempId ? result : c)
        );
        
        return result;
      } catch (error) {
        console.error('❌ Customer creation failed:', error);
        rollback();
        throw error;
      } finally {
        setPendingOperations(prev => prev - 1);
      }
    },
    onSuccess: async () => {
      await Promise.all([
        refetchCustomers(),
        queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      ]);
      toast({ title: "Customer created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create customer", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      setPendingOperations(prev => prev + 1);
      console.log('✏️ Updating customer:', id, updates);
      
      // Optimistic update
      const { rollback } = performOptimisticUpdate(
        ['customers'],
        (old: Customer[]) => (old || []).map(c => c.id === id ? { ...c, ...updates } : c)
      );
      
      try {
        const result = await updateCustomer(id, updates);
        console.log('✅ Customer updated successfully:', result);
        return result;
      } catch (error) {
        console.error('❌ Customer update failed:', error);
        rollback();
        throw error;
      } finally {
        setPendingOperations(prev => prev - 1);
      }
    },
    onSuccess: async () => {
      await Promise.all([
        refetchCustomers(),
        queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      ]);
      toast({ title: "Customer updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update customer", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: number) => {
      setPendingOperations(prev => prev + 1);
      console.log('🗑️ Deleting customer:', id);
      
      // Optimistic update
      const { rollback } = performOptimisticUpdate(
        ['customers'],
        (old: Customer[]) => (old || []).filter(c => c.id !== id)
      );
      
      try {
        await deleteCustomer(id);
        console.log('✅ Customer deleted successfully');
      } catch (error) {
        console.error('❌ Customer deletion failed:', error);
        rollback();
        throw error;
      } finally {
        setPendingOperations(prev => prev - 1);
      }
    },
    onSuccess: async () => {
      await Promise.all([
        refetchCustomers(),
        queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      ]);
      toast({ title: "Customer deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete customer", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const recordRepaymentMutation = useMutation({
    mutationFn: async ({ customerId, amount, method, note }: any) => {
      setPendingOperations(prev => prev + 1);
      console.log('💰 Recording repayment:', customerId, amount);
      
      // Optimistic update
      const { rollback } = performOptimisticUpdate(
        ['customers'],
        (old: Customer[]) => (old || []).map(c => 
          c.id === customerId 
            ? { ...c, balance: Math.max(0, parseFloat(c.balance || '0') - amount).toString() }
            : c
        )
      );
      
      try {
        const result = await recordCustomerRepayment(customerId, amount, method, note);
        console.log('✅ Repayment recorded successfully:', result);
        return result;
      } catch (error) {
        console.error('❌ Repayment recording failed:', error);
        rollback();
        throw error;
      } finally {
        setPendingOperations(prev => prev - 1);
      }
    },
    onSuccess: async () => {
      await Promise.all([
        refetchCustomers(),
        queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      ]);
      toast({ title: "Payment recorded successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to record payment", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Real-time subscriptions
  useEffect(() => {
    console.log('🔄 Setting up comprehensive real-time subscriptions');
    
    // Products subscription
    const productsChannel = supabase
      .channel('products-comprehensive')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'products'
      }, (payload) => {
        console.log('📡 Product change:', payload.eventType, payload.new?.name || payload.old?.name);
        
        setTimeout(() => {
          if (payload.eventType === 'INSERT') {
            queryClient.setQueryData(['products'], (old: Product[]) => 
              [payload.new, ...(old || [])]
            );
          } else if (payload.eventType === 'UPDATE') {
            queryClient.setQueryData(['products'], (old: Product[]) => 
              (old || []).map(p => p.id === payload.new.id ? payload.new : p)
            );
          } else if (payload.eventType === 'DELETE') {
            queryClient.setQueryData(['products'], (old: Product[]) => 
              (old || []).filter(p => p.id !== payload.old.id)
            );
          }
          
          queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
        }, 50);
      })
      .subscribe();

    // Customers subscription  
    const customersChannel = supabase
      .channel('customers-comprehensive')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'customers'
      }, (payload) => {
        console.log('📡 Customer change:', payload.eventType, payload.new?.name || payload.old?.name);
        
        setTimeout(() => {
          if (payload.eventType === 'INSERT') {
            queryClient.setQueryData(['customers'], (old: Customer[]) => 
              [payload.new, ...(old || [])]
            );
          } else if (payload.eventType === 'UPDATE') {
            queryClient.setQueryData(['customers'], (old: Customer[]) => 
              (old || []).map(c => c.id === payload.new.id ? payload.new : c)
            );
          } else if (payload.eventType === 'DELETE') {
            queryClient.setQueryData(['customers'], (old: Customer[]) => 
              (old || []).filter(c => c.id !== payload.old.id)
            );
          }
          
          queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
        }, 50);
      })
      .subscribe();

    subscriptionsRef.current = [productsChannel, customersChannel];

    return () => {
      console.log('🔄 Cleaning up comprehensive real-time subscriptions');
      subscriptionsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      subscriptionsRef.current = [];
    };
  }, [queryClient]);

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
    pendingOperations
  };
}