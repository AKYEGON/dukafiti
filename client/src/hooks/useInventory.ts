/**
 * Enhanced Inventory Hook with Real-time Updates
 * Provides comprehensive inventory management with optimistic updates
 */

import { useCallback, useMemo, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getProducts } from '@/lib/supabase-data';
import { useDynamicData } from './useDynamicData';
import type { Product } from '@/types/schema';

export function useInventory() {
  const queryClient = useQueryClient();
  const [localProducts, setLocalProducts] = useState<Product[]>([]);

  // Runtime data fetching with useQuery - RLS compatible
  const {
    data: products,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      // Get current user for store isolation
      const { data: { user }, error: authError } = await import('@/lib/supabase').then(m => m.supabase.auth.getUser());
      if (authError || !user) {
        console.error('❌ User not authenticated for products fetch');
        throw new Error('User not authenticated');
      }
      
      console.log('🔍 Fetching products for store:', user.id);
      const data = await getProducts(user.id);
      console.log('✅ Products fetched:', data?.length || 0);
      setLocalProducts(data || []);
      return data;
    },
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Real-time subscription with dynamic data hook
  const { forceRefresh, updateDataOptimistically, isConnected } = useDynamicData({
    table: 'products',
    queryKey: ['products'],
    fetchFunction: async () => {
      const { data: { user }, error: authError } = await import('@/lib/supabase').then(m => m.supabase.auth.getUser());
      if (authError || !user) throw new Error('User not authenticated');
      return getProducts(user.id);
    },
    onInsert: (payload) => {
      console.log('Product inserted:', payload.new);
      setLocalProducts(prev => [...(prev || []), payload.new]);
    },
    onUpdate: (payload) => {
      console.log('Product updated:', payload.new);
      setLocalProducts(prev => 
        (prev || []).map(p => p.id === payload.new.id ? payload.new : p)
      );
    },
    onDelete: (payload) => {
      console.log('Product deleted:', payload.old);
      setLocalProducts(prev => 
        (prev || []).filter(p => p.id !== payload.old.id)
      );
    },
  });

  // Use local products if available, fallback to query data
  const currentProducts = localProducts.length > 0 ? localProducts : (products || []);

  // Optimistic stock update
  const updateStockOptimistically = useCallback((productId: number, newStock: number) => {
    setLocalProducts(prev => 
      prev.map(p => p.id === productId ? { ...p, stock: newStock } : p)
    );
    
    // Update query cache immediately
    updateDataOptimistically((oldData: Product[]) => 
      (oldData || []).map(p => p.id === productId ? { ...p, stock: newStock } : p)
    );
  }, [updateDataOptimistically]);

  // Optimistic product update
  const updateProductOptimistically = useCallback((productId: number, updates: Partial<Product>) => {
    setLocalProducts(prev => 
      prev.map(p => p.id === productId ? { ...p, ...updates } : p)
    );
    
    // Update query cache immediately
    updateDataOptimistically((oldData: Product[]) => 
      (oldData || []).map(p => p.id === productId ? { ...p, ...updates } : p)
    );
  }, [updateDataOptimistically]);

  // Helper functions with proper memoization
  const getProductById = useCallback((id: number): Product | undefined => {
    return currentProducts?.find(product => product.id === id);
  }, [currentProducts]);

  const getLowStockProducts = useCallback((threshold: number = 10): Product[] => {
    if (!currentProducts) return [];
    return currentProducts.filter(product => 
      product.stock !== null && 
      product.low_stock_threshold !== null &&
      product.stock <= (product.low_stock_threshold || threshold)
    );
  }, [currentProducts]);

  const getOutOfStockProducts = useCallback((): Product[] => {
    if (!currentProducts) return [];
    return currentProducts.filter(product => 
      product.stock !== null && 
      product.stock === 0
    );
  }, [currentProducts]);

  const getTotalProducts = useMemo((): number => {
    return currentProducts?.length || 0;
  }, [currentProducts]);

  const getTotalStockValue = useMemo((): number => {
    if (!currentProducts) return 0;
    return currentProducts.reduce((total, product) => {
      const price = parseFloat(product.price?.toString() || '0') || 0;
      const stock = product.stock || 0;
      return total + (price * stock);
    }, 0);
  }, [currentProducts]);

  const getProductsByCategoryCount = useMemo(() => {
    if (!currentProducts) return {};
    
    return currentProducts.reduce((acc, product) => {
      const category = product.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [currentProducts]);

  // Enhanced search function
  const searchProducts = useCallback((query: string): Product[] => {
    if (!currentProducts || !query.trim()) return currentProducts || [];
    
    const searchTerm = query.toLowerCase().trim();
    return currentProducts.filter(product => 
      product.name?.toLowerCase().includes(searchTerm) ||
      product.sku?.toLowerCase().includes(searchTerm) ||
      product.category?.toLowerCase().includes(searchTerm) ||
      product.description?.toLowerCase().includes(searchTerm)
    );
  }, [currentProducts]);

  // Sort products
  const sortProducts = useCallback((sortBy: string): Product[] => {
    if (!currentProducts) return [];
    
    const sorted = [...currentProducts];
    
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
  }, [currentProducts]);

  return {
    // Data - use currentProducts for real-time updates
    products: currentProducts,
    isLoading,
    error,
    isStale: false, // Always fresh with real-time updates
    isFetching,
    isConnected,
    
    // Actions
    refresh: refetch,
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