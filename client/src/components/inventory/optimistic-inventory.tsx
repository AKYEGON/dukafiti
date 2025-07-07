/**
 * Optimistic Inventory Component
 * Ensures immediate UI updates for all inventory operations
 */

import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useInventory } from '@/hooks/useInventory';
import { updateProduct, restockProduct } from '@/lib/supabase-data';
import { useToast } from '@/hooks/use-toast';

export function OptimisticInventory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { updateStockOptimistically, updateProductOptimistically, forceRefresh } = useInventory();

  // Optimistic stock update mutation
  const restockMutation = useMutation({
    mutationFn: async ({ productId, quantity, costPrice }: { 
      productId: number; 
      quantity: number; 
      costPrice?: number; 
    }) => {
      // 1. Optimistically update UI immediately
      updateStockOptimistically(productId, quantity);
      
      // 2. Call API to persist change
      await restockProduct(productId, quantity, costPrice);
    },
    onSuccess: () => {
      // 3. Force refresh from server to ensure consistency
      setTimeout(() => {
        forceRefresh();
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      }, 100);
      
      toast({ title: "Stock updated successfully" });
    },
    onError: (error) => {
      // Revert optimistic update on error
      forceRefresh();
      toast({ 
        title: "Failed to update stock", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Optimistic product update mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ productId, updates }: { 
      productId: number; 
      updates: any; 
    }) => {
      // 1. Optimistically update UI immediately
      updateProductOptimistically(productId, updates);
      
      // 2. Call API to persist change
      await updateProduct(productId, updates);
    },
    onSuccess: () => {
      // 3. Force refresh from server to ensure consistency
      setTimeout(() => {
        forceRefresh();
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      }, 100);
      
      toast({ title: "Product updated successfully" });
    },
    onError: (error) => {
      // Revert optimistic update on error
      forceRefresh();
      toast({ 
        title: "Failed to update product", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  return {
    restockMutation,
    updateProductMutation,
  };
}