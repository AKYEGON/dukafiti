/**
 * Optimistic Updates Hook
 * Provides optimistic UI updates for better user experience
 */

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import type { Product, Order, Customer } from '@/types/schema';

export function useOptimisticUpdates() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const optimisticProcessSale = useCallback(
    async (saleData: any) => {
      try {
        // Optimistically update inventory
        queryClient.setQueryData<Product[]>(['products'], (old) => {
          if (!old) return old;
          return old.map((product) => {
            const saleItem = saleData.items?.find((item: any) => item.product_id === product.id);
            if (saleItem) {
              return {
                ...product,
                stock: Math.max(0, product.stock - saleItem.quantity),
                sales_count: (product.sales_count || 0) + saleItem.quantity,
              };
            }
            return product;
          });
        });

        // Optimistically update orders
        queryClient.setQueryData<Order[]>(['orders'], (old) => {
          if (!old) return [];
          const newOrder: Order = {
            id: Date.now(), // temporary ID
            customer_name: saleData.customer_name || 'Walk-in Customer',
            total: saleData.total,
            status: 'completed',
            payment_method: saleData.payment_method || 'cash',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          return [newOrder, ...old];
        });

        // Show success toast
        toast({
          title: "Sale processed",
          description: `Sale of ${saleData.total ? `KES ${saleData.total.toFixed(2)}` : 'items'} completed successfully`,
        });

      } catch (error) {
        console.error('Optimistic update failed:', error);
        toast({
          title: "Update failed",
          description: "Failed to update interface",
          variant: "destructive",
        });
      }
    },
    [queryClient, toast]
  );

  const optimisticUpdateProduct = useCallback(
    async (productId: number, updates: Partial<Product>) => {
      try {
        queryClient.setQueryData<Product[]>(['products'], (old) => {
          if (!old) return old;
          return old.map((product) =>
            product.id === productId ? { ...product, ...updates } : product
          );
        });
      } catch (error) {
        console.error('Optimistic product update failed:', error);
      }
    },
    [queryClient]
  );

  const optimisticUpdateCustomer = useCallback(
    async (customerId: number, updates: Partial<Customer>) => {
      try {
        queryClient.setQueryData<Customer[]>(['customers'], (old) => {
          if (!old) return old;
          return old.map((customer) =>
            customer.id === customerId ? { ...customer, ...updates } : customer
          );
        });
      } catch (error) {
        console.error('Optimistic customer update failed:', error);
      }
    },
    [queryClient]
  );

  return {
    optimisticProcessSale,
    optimisticUpdateProduct,
    optimisticUpdateCustomer,
  };
}