import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/SupabaseAuth';

export function useSupabaseRealtime() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Subscribe to products changes
    const productsSubscription = supabase
      .channel('products-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'products' },
        () => {
          // Invalidate products queries when data changes
          queryClient.invalidateQueries({ queryKey: ['/api/products'] });
          queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
        }
      )
      .subscribe();

    // Subscribe to orders changes
    const ordersSubscription = supabase
      .channel('orders-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          // Invalidate orders queries when data changes
          queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
          queryClient.invalidateQueries({ queryKey: ['/api/orders/recent'] });
          queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
          queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
        }
      )
      .subscribe();

    // Subscribe to customers changes
    const customersSubscription = supabase
      .channel('customers-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'customers' },
        () => {
          // Invalidate customers queries when data changes
          queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
          queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
        }
      )
      .subscribe();

    // Subscribe to notifications changes
    const notificationsSubscription = supabase
      .channel('notifications-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          // Invalidate notifications queries when data changes
          queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
          queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      productsSubscription.unsubscribe();
      ordersSubscription.unsubscribe();
      customersSubscription.unsubscribe();
      notificationsSubscription.unsubscribe();
    };
  }, [isAuthenticated, queryClient]);
}

export default useSupabaseRealtime;