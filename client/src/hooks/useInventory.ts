/**
 * Enhanced Inventory Hook with Real-time Updates
 * Provides comprehensive inventory management with optimistic updates
 */

import { useCallback, useMemo } from 'react';
import { getProducts } from '@/lib/supabase-data';
import { useEnhancedQuery } from './useEnhancedQuery';
import { useOptimisticUpdates } from './useOptimisticUpdates';
import type { Product } from '@/types/schema';

export function useInventory() {
  const { optimisticUpdateStock, optimisticUpdateProduct } = useOptimisticUpdates();

  // Enhanced query with real-time capabilities
  const {
    data: products,
    isLoading,
    error,
    refresh,
    forceRefresh,
    updateData,
    isStale,
    isFetching,
  } = useEnhancedQuery<Product[]>({
    queryKey: ['products'],
    queryFn: getProducts,
    enableRealtime: true,
    staleTime: 60 * 1000, // 1 minute
  });

  // Optimistic stock update
  const updateStockOptimistically = useCallback((productId: number, newStock: number) => {
    optimisticUpdateStock(productId, newStock);
  }, [optimisticUpdateStock]);

  // Optimistic product update
  const updateProductOptimistically = useCallback((productId: number, updates: Partial<Product>) => {
    optimisticUpdateProduct(productId, updates);
  }, [optimisticUpdateProduct]);

  // Helper functions with proper memoization
  const getProductById = useCallback((id: number): Product | undefined => {
    return products?.find(product => product.id === id);
  }, [products]);

  const getLowStockProducts = useCallback((threshold: number = 10): Product[] => {
    if (!products) return [];
    return products.filter(product => 
      product.stock !== null && 
      product.low_stock_threshold !== null &&
      product.stock <= (product.low_stock_threshold || threshold)
    );
  }, [products]);

  const getOutOfStockProducts = useCallback((): Product[] => {
    if (!products) return [];
    return products.filter(product => 
      product.stock !== null && 
      product.stock === 0
    );
  }, [products]);

  const getTotalProducts = useMemo((): number => {
    return products?.length || 0;
  }, [products]);

  const getTotalStockValue = useMemo((): number => {
    if (!products) return 0;
    return products.reduce((total, product) => {
      const price = parseFloat(product.price?.toString() || '0') || 0;
      const stock = product.stock || 0;
      return total + (price * stock);
    }, 0);
  }, [products]);

  const getProductsByCategoryCount = useMemo(() => {
    if (!products) return {};
    
    return products.reduce((acc, product) => {
      const category = product.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [products]);

  // Enhanced search function
  const searchProducts = useCallback((query: string): Product[] => {
    if (!products || !query.trim()) return products || [];
    
    const searchTerm = query.toLowerCase().trim();
    return products.filter(product => 
      product.name?.toLowerCase().includes(searchTerm) ||
      product.sku?.toLowerCase().includes(searchTerm) ||
      product.category?.toLowerCase().includes(searchTerm) ||
      product.description?.toLowerCase().includes(searchTerm)
    );
  }, [products]);

  // Sort products
  const sortProducts = useCallback((sortBy: string): Product[] => {
    if (!products) return [];
    
    const sorted = [...products];
    
    switch (sortBy) {
      case 'name-asc':
        return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      case 'name-desc':
        return sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
      case 'price-asc':
        return sorted.sort((a, b) => parseFloat(a.price?.toString() || '0') - parseFloat(b.price?.toString() || '0'));
      case 'price-desc':
        return sorted.sort((a, b) => parseFloat(b.price?.toString() || '0') - parseFloat(a.price?.toString() || '0'));
      case 'stock-asc':
        return sorted.sort((a, b) => (a.stock || 0) - (b.stock || 0));
      case 'stock-desc':
        return sorted.sort((a, b) => (b.stock || 0) - (a.stock || 0));
      case 'sales-desc':
        return sorted.sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0));
      default:
        return sorted;
    }
  }, [products]);

  return {
    // Data
    products: products || [],
    isLoading,
    error,
    isStale,
    isFetching,
    
    // Actions
    refresh,
    forceRefresh,
    updateStockOptimistically,
    updateProductOptimistically,
    
    // Helper functions
    getProductById,
    getLowStockProducts,
    getOutOfStockProducts,
    getTotalProducts,
    getTotalStockValue,
    getProductsByCategoryCount,
    searchProducts,
    sortProducts,
  };
}

export default useInventory;