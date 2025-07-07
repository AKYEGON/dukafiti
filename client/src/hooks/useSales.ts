/**
 * Enhanced Sales Hook with Real-time Updates
 * Provides comprehensive sales management with optimistic updates
 */

import { useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useEnhancedQuery } from './useEnhancedQuery';
import { useOptimisticUpdates } from './useOptimisticUpdates';
import type { Order } from '@/types/schema';

export function useSales() {
  const { optimisticProcessSale } = useOptimisticUpdates();

  // Enhanced query for orders/sales
  const {
    data: orders,
    isLoading,
    error,
    refresh,
    forceRefresh,
    updateData,
    isStale,
    isFetching,
  } = useEnhancedQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Failed to fetch orders:', error);
        throw error;
      }
      
      return data || [];
    },
    enableRealtime: true,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Recent orders query with product details
  const {
    data: recentOrders,
    isLoading: recentOrdersLoading,
    refresh: refreshRecentOrders,
  } = useEnhancedQuery<Order[]>({
    queryKey: ['recent-orders'],
    queryFn: async () => {
      // First get the orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (ordersError) {
        console.error('Failed to fetch recent orders:', ordersError);
        throw ordersError;
      }

      if (!orders || orders.length === 0) {
        return [];
      }

      // Get order items for each order
      const orderIds = orders.map(order => order.id);
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('order_id, product_id, quantity, price')
        .in('order_id', orderIds);
      
      if (itemsError) {
        console.error('Failed to fetch order items:', itemsError);
        // Return orders without products if items fail
        return orders.map(order => ({ ...order, products: [] }));
      }

      // Get product details for the items
      const productIds = [...new Set(orderItems?.map(item => item.product_id) || [])];
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, price')
        .in('id', productIds);
      
      if (productsError) {
        console.error('Failed to fetch products:', productsError);
        // Return orders without products if products fail
        return orders.map(order => ({ ...order, products: [] }));
      }

      // Combine orders with their products
      const ordersWithProducts = orders.map(order => {
        const orderOrderItems = orderItems?.filter(item => item.order_id === order.id) || [];
        const orderProducts = orderOrderItems.map(item => {
          const product = products?.find(p => p.id === item.product_id);
          return {
            id: item.product_id,
            name: product?.name || 'Unknown Product',
            price: product?.price || '0.00',
            quantity: item.quantity,
            total: (parseFloat(item.price) * item.quantity).toFixed(2)
          };
        });
        
        return {
          ...order,
          products: orderProducts
        };
      });
      
      return ordersWithProducts;
    },
    enableRealtime: true,
    staleTime: 15 * 1000, // 15 seconds
  });

  // Process sale optimistically
  const processSaleOptimistically = useCallback((sale: {
    items: Array<{ productId: number; quantity: number }>;
    total: number;
    customer_name?: string;
    payment_method: string;
  }) => {
    return optimisticProcessSale(sale);
  }, [optimisticProcessSale]);

  // Helper functions with proper memoization
  const getOrderById = useCallback((id: number): Order | undefined => {
    return orders?.find(order => order.id === id);
  }, [orders]);

  const getTotalSales = useMemo((): number => {
    if (!orders) return 0;
    return orders.reduce((total, order) => {
      return total + parseFloat(order.total?.toString() || '0');
    }, 0);
  }, [orders]);

  const getTotalOrders = useMemo((): number => {
    return orders?.length || 0;
  }, [orders]);

  const getSalesByPeriod = useCallback((days: number = 7): Order[] => {
    if (!orders) return [];
    
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return orders.filter(order => 
      new Date(order.created_at) >= cutoff
    );
  }, [orders]);

  const getSalesByPaymentMethod = useCallback((method: string): Order[] => {
    if (!orders) return [];
    return orders.filter(order => order.payment_method === method);
  }, [orders]);

  const getSalesByCustomer = useCallback((customerName: string): Order[] => {
    if (!orders) return [];
    return orders.filter(order => 
      order.customer_name?.toLowerCase().includes(customerName.toLowerCase())
    );
  }, [orders]);

  const getDailySalesTotal = useCallback((date: Date = new Date()): number => {
    if (!orders) return 0;
    
    const targetDate = date.toISOString().split('T')[0];
    
    return orders
      .filter(order => order.created_at.startsWith(targetDate))
      .reduce((total, order) => total + parseFloat(order.total?.toString() || '0'), 0);
  }, [orders]);

  const getPaymentMethodBreakdown = useMemo(() => {
    if (!orders) return {};
    
    return orders.reduce((acc, order) => {
      const method = order.payment_method || 'unknown';
      const amount = parseFloat(order.total?.toString() || '0');
      
      acc[method] = (acc[method] || 0) + amount;
      return acc;
    }, {} as Record<string, number>);
  }, [orders]);

  // Search orders
  const searchOrders = useCallback((query: string): Order[] => {
    if (!orders || !query.trim()) return orders || [];
    
    const searchTerm = query.toLowerCase().trim();
    return orders.filter(order => 
      order.customer_name?.toLowerCase().includes(searchTerm) ||
      order.payment_method?.toLowerCase().includes(searchTerm) ||
      order.status?.toLowerCase().includes(searchTerm) ||
      order.id?.toString().includes(searchTerm)
    );
  }, [orders]);

  // Sort orders
  const sortOrders = useCallback((sortBy: string): Order[] => {
    if (!orders) return [];
    
    const sorted = [...orders];
    
    switch (sortBy) {
      case 'date-asc':
        return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case 'date-desc':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'amount-asc':
        return sorted.sort((a, b) => parseFloat(a.total?.toString() || '0') - parseFloat(b.total?.toString() || '0'));
      case 'amount-desc':
        return sorted.sort((a, b) => parseFloat(b.total?.toString() || '0') - parseFloat(a.total?.toString() || '0'));
      case 'customer-asc':
        return sorted.sort((a, b) => (a.customer_name || '').localeCompare(b.customer_name || ''));
      case 'customer-desc':
        return sorted.sort((a, b) => (b.customer_name || '').localeCompare(a.customer_name || ''));
      default:
        return sorted;
    }
  }, [orders]);

  return {
    // Data
    orders: orders || [],
    recentOrders: recentOrders || [],
    isLoading,
    recentOrdersLoading,
    ordersFetching: isFetching, // Add alias for dashboard compatibility
    ordersStale: isStale, // Add alias for dashboard compatibility
    error,
    isStale,
    isFetching,
    
    // Actions
    refresh,
    forceRefresh,
    refreshRecentOrders,
    processSaleOptimistically,
    
    // Helper functions
    getOrderById,
    getTotalSales,
    getTotalOrders,
    getSalesByPeriod,
    getSalesByPaymentMethod,
    getSalesByCustomer,
    getDailySalesTotal,
    getPaymentMethodBreakdown,
    searchOrders,
    sortOrders,
  };
}

export default useSales;