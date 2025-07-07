/**
 * Real-time Inventory Hook with Supabase subscriptions
 * Provides automatic updates for inventory across all pages
 */

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getProducts } from '@/lib/supabase-data';
import type { Product } from '@/types/schema';

export function useInventory() {
  const queryClient = useQueryClient();
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Main products query
  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  // Set up real-time subscription
  useEffect(() => {
    if (isSubscribed) return;

    const channel = supabase
      .channel('products-changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'products' 
        }, 
        (payload) => {
          
          queryClient.setQueryData(['products'], (old: Product[] | undefined) => {
            if (!old) return [payload.new as Product];
            return [payload.new as Product, ...old];
          });
          
          // Invalidate related queries
          queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          
          queryClient.setQueryData(['products'], (old: Product[] | undefined) => {
            if (!old) return [payload.new as Product];
            return old.map(product => 
              product.id === payload.new.id ? payload.new as Product : product
            );
          });
          
          // Invalidate related queries
          queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
        }
      )
      .on('postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          
          queryClient.setQueryData(['products'], (old: Product[] | undefined) => {
            if (!old) return [];
            return old.filter(product => product.id !== payload.old.id);
          });
          
          // Invalidate related queries
          queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
        }
      )
      .subscribe();

    setIsSubscribed(true);

    return () => {
      supabase.removeChannel(channel);
      setIsSubscribed(false);
    };
  }, [queryClient, isSubscribed]);

  // Helper functions
  const getProductById = (id: number): Product | undefined => {
    return products?.find(product => product.id === id);
  };

  const getLowStockProducts = (threshold: number = 10): Product[] => {
    if (!products) return [];
    return products.filter(product => 
      product.stock !== null && 
      product.stock <= threshold
    );
  };

  const getOutOfStockProducts = (): Product[] => {
    if (!products) return [];
    return products.filter(product => 
      product.stock !== null && 
      product.stock === 0
    );
  };

  const getTotalProducts = (): number => {
    return products?.length || 0;
  };

  const getTotalStockValue = (): number => {
    if (!products) return 0;
    return products.reduce((total, product) => {
      const price = parseFloat(product.price) || 0;
      const stock = product.stock || 0;
      return total + (price * stock);
    }, 0);
  };

  // Trigger low stock notifications
  const checkLowStockNotifications = async () => {
    const lowStockProducts = getLowStockProducts();
    
    for (const product of lowStockProducts) {
      try {
        const { createNotification } = await import('@/hooks/useNotifications');
        const notificationHook = createNotification;
        
        if (notificationHook) {
          await notificationHook({
            type: 'low_stock',
            title: 'Low Stock Alert',
            message: `${product.name} is running low (${product.stock || 0} remaining)`,
          });
        }
      } catch (error) {
        
      }
    }
  };

  return {
    products: products || [],
    isLoading,
    error,
    getProductById,
    getLowStockProducts,
    getOutOfStockProducts,
    getTotalProducts,
    getTotalStockValue,
    checkLowStockNotifications,
  };
}