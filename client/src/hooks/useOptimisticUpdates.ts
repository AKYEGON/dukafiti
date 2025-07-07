/**
 * Optimistic Updates Hook
 * Provides immediate UI updates before server confirmation
 */

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { Product, Customer, Order } from '@/types/schema';

export function useOptimisticUpdates() {
  const queryClient = useQueryClient();

  // Optimistic product creation
  const optimisticCreateProduct = useCallback((product: Partial<Product>) => {
    const tempId = Date.now(); // Temporary ID
    const optimisticProduct = {
      id: tempId,
      ...product,
      created_at: new Date().toISOString(),
      sales_count: 0,
    } as Product;

    queryClient.setQueryData(['products'], (old: Product[] | undefined) => {
      if (!old) return [optimisticProduct];
      return [optimisticProduct, ...old];
    });

    return { tempId, optimisticProduct };
  }, [queryClient]);

  // Optimistic product update
  const optimisticUpdateProduct = useCallback((id: number, updates: Partial<Product>) => {
    queryClient.setQueryData(['products'], (old: Product[] | undefined) => {
      if (!old) return old;
      return old.map(product => 
        product.id === id ? { ...product, ...updates } : product
      );
    });
  }, [queryClient]);

  // Optimistic stock update
  const optimisticUpdateStock = useCallback((id: number, newStock: number) => {
    queryClient.setQueryData(['products'], (old: Product[] | undefined) => {
      if (!old) return old;
      return old.map(product => 
        product.id === id ? { ...product, stock: newStock } : product
      );
    });
  }, [queryClient]);

  // Optimistic customer creation
  const optimisticCreateCustomer = useCallback((customer: Partial<Customer>) => {
    const tempId = Date.now();
    const optimisticCustomer = {
      id: tempId,
      ...customer,
      created_at: new Date().toISOString(),
    } as Customer;

    queryClient.setQueryData(['customers'], (old: Customer[] | undefined) => {
      if (!old) return [optimisticCustomer];
      return [optimisticCustomer, ...old];
    });

    return { tempId, optimisticCustomer };
  }, [queryClient]);

  // Optimistic customer update
  const optimisticUpdateCustomer = useCallback((id: number, updates: Partial<Customer>) => {
    queryClient.setQueryData(['customers'], (old: Customer[] | undefined) => {
      if (!old) return old;
      return old.map(customer => 
        customer.id === id ? { ...customer, ...updates } : customer
      );
    });
  }, [queryClient]);

  // Optimistic sale processing
  const optimisticProcessSale = useCallback((sale: {
    items: Array<{ productId: number; quantity: number }>;
    total: number;
    customer_name?: string;
    payment_method: string;
  }) => {
    const tempId = Date.now();
    const optimisticOrder = {
      id: tempId,
      customer_name: sale.customer_name || 'Walk-in Customer',
      total: sale.total,
      status: 'completed',
      payment_method: sale.payment_method,
      created_at: new Date().toISOString(),
    } as Order;

    // Add to orders
    queryClient.setQueryData(['orders'], (old: Order[] | undefined) => {
      if (!old) return [optimisticOrder];
      return [optimisticOrder, ...old];
    });

    // Add to recent orders
    queryClient.setQueryData(['recent-orders'], (old: Order[] | undefined) => {
      if (!old) return [optimisticOrder];
      const updated = [optimisticOrder, ...old];
      return updated.slice(0, 10);
    });

    // Update product stock optimistically
    sale.items.forEach(item => {
      queryClient.setQueryData(['products'], (old: Product[] | undefined) => {
        if (!old) return old;
        return old.map(product => {
          if (product.id === item.productId && product.stock !== null) {
            return {
              ...product,
              stock: Math.max(0, product.stock - item.quantity),
              sales_count: (product.sales_count || 0) + item.quantity,
            };
          }
          return product;
        });
      });
    });

    return { tempId, optimisticOrder };
  }, [queryClient]);

  // Rollback function for failed operations
  const rollbackOptimisticUpdate = useCallback((queryKey: string[], originalData: any) => {
    queryClient.setQueryData(queryKey, originalData);
  }, [queryClient]);

  // Confirm optimistic update (replace temp ID with real ID)
  const confirmOptimisticUpdate = useCallback((
    queryKey: string[], 
    tempId: number, 
    realData: any
  ) => {
    queryClient.setQueryData(queryKey, (old: any[] | undefined) => {
      if (!old) return [realData];
      return old.map(item => item.id === tempId ? realData : item);
    });
  }, [queryClient]);

  return {
    optimisticCreateProduct,
    optimisticUpdateProduct,
    optimisticUpdateStock,
    optimisticCreateCustomer,
    optimisticUpdateCustomer,
    optimisticProcessSale,
    rollbackOptimisticUpdate,
    confirmOptimisticUpdate,
  };
}

export default useOptimisticUpdates;