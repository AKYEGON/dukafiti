/**
 * Store-Isolated Inventory Hook
 * Provides real-time inventory management with RLS enforcement
 */

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/SupabaseAuth';
import { 
  getProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  restockProduct 
} from '@/lib/store-isolated-data';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/types/schema';

export function useInventoryStore() {
  const { storeId, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Store-isolated products query
  const {
    data: products,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery<Product[]>({
    queryKey: ['products', storeId],
    queryFn: () => getProducts(storeId!),
    enabled: isAuthenticated && !!storeId,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: (newProduct) => {
      // Optimistically update the cache
      queryClient.setQueryData<Product[]>(['products', storeId], (old) => {
        return old ? [newProduct, ...old] : [newProduct];
      });
      queryClient.invalidateQueries({ queryKey: ['products', storeId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics', storeId] });
      toast({ title: 'Success', description: 'Product created successfully' });
    },
    onError: (error) => {
      console.error('Product creation error:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to create product', 
        variant: 'destructive' 
      });
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: any }) => 
      updateProduct(id, updates, storeId!),
    onSuccess: (updatedProduct) => {
      // Optimistically update the cache
      queryClient.setQueryData<Product[]>(['products', storeId], (old) => {
        return old ? old.map(p => p.id === updatedProduct.id ? updatedProduct : p) : [updatedProduct];
      });
      queryClient.invalidateQueries({ queryKey: ['products', storeId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics', storeId] });
      toast({ title: 'Success', description: 'Product updated successfully' });
    },
    onError: (error) => {
      console.error('Product update error:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to update product', 
        variant: 'destructive' 
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => deleteProduct(id, storeId!),
    onSuccess: (_, deletedId) => {
      // Optimistically update the cache
      queryClient.setQueryData<Product[]>(['products', storeId], (old) => {
        return old ? old.filter(p => p.id !== deletedId) : [];
      });
      queryClient.invalidateQueries({ queryKey: ['products', storeId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics', storeId] });
      toast({ title: 'Success', description: 'Product deleted successfully' });
    },
    onError: (error) => {
      console.error('Product deletion error:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to delete product', 
        variant: 'destructive' 
      });
    },
  });

  // Restock product mutation
  const restockProductMutation = useMutation({
    mutationFn: ({ id, quantity, buyingPrice }: { 
      id: number; 
      quantity: number; 
      buyingPrice?: number; 
    }) => restockProduct(id, quantity, buyingPrice, storeId!),
    onSuccess: (updatedProduct) => {
      // Optimistically update the cache
      queryClient.setQueryData<Product[]>(['products', storeId], (old) => {
        return old ? old.map(p => p.id === updatedProduct.id ? updatedProduct : p) : [updatedProduct];
      });
      queryClient.invalidateQueries({ queryKey: ['products', storeId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics', storeId] });
      toast({ title: 'Success', description: 'Product restocked successfully' });
    },
    onError: (error) => {
      console.error('Product restock error:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to restock product', 
        variant: 'destructive' 
      });
    },
  });

  // Helper functions
  const getLowStockProducts = () => {
    return products?.filter(product => 
      product.stock !== null && 
      product.stock <= (product.low_stock_threshold || 10)
    ) || [];
  };

  const getTotalInventoryValue = () => {
    return products?.reduce((total, product) => {
      const stock = product.stock || 0;
      const price = parseFloat(product.price) || 0;
      return total + (stock * price);
    }, 0) || 0;
  };

  return {
    // Data
    products: products || [],
    lowStockProducts: getLowStockProducts(),
    totalInventoryValue: getTotalInventoryValue(),
    
    // Loading states
    isLoading,
    isFetching,
    isCreating: createProductMutation.isPending,
    isUpdating: updateProductMutation.isPending,
    isDeleting: deleteProductMutation.isPending,
    isRestocking: restockProductMutation.isPending,
    
    // Error states
    error,
    
    // Actions
    createProduct: createProductMutation.mutate,
    updateProduct: updateProductMutation.mutate,
    deleteProduct: deleteProductMutation.mutate,
    restockProduct: restockProductMutation.mutate,
    refresh: refetch,
    
    // Store info
    storeId,
    isAuthenticated,
  };
}