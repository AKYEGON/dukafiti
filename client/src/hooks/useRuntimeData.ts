import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface UseRuntimeDataReturn {
  // Products
  products: any[] | null;
  productsLoading: boolean;
  productsError: string | null;
  fetchProducts: () => Promise<void>;
  
  // Customers  
  customers: any[] | null;
  customersLoading: boolean;
  customersError: string | null;
  fetchCustomers: () => Promise<void>;
  
  // Orders
  orders: any[] | null;
  ordersLoading: boolean;
  ordersError: string | null;
  fetchOrders: () => Promise<void>;
  
  // Notifications
  notifications: any[] | null;
  notificationsLoading: boolean;
  notificationsError: string | null;
  fetchNotifications: () => Promise<void>;
  
  // Global state
  isConnected: boolean;
  refreshAll: () => Promise<void>;
}

export function useRuntimeData(): UseRuntimeDataReturn {
  const [products, setProducts] = useState<any[] | null>(null);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [customers, setCustomers] = useState<any[] | null>(null);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customersError, setCustomersError] = useState<string | null>(null);

  const [orders, setOrders] = useState<any[] | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<any[] | null>(null);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);

  const [isConnected, setIsConnected] = useState(navigator.onLine);

  const { toast } = useToast();

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsConnected(true);
    const handleOffline = () => setIsConnected(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get current user
  const getUser = useCallback(async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }, []);

  // Fetch products with runtime data
  const fetchProducts = useCallback(async () => {
    try {
      setProductsLoading(true);
      setProductsError(null);
      
      const user = await getUser();
      if (!user) {
        setProducts([]);
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', user.id)
        .order('name', { ascending: true });

      if (error) {
        console.error('Products fetch error:', error);
        setProductsError(error.message);
      } else {
        console.log('Products fetched:', data?.length || 0);
        setProducts(data || []);
      }
    } catch (error) {
      console.error('Products fetch error:', error);
      setProductsError('Failed to fetch products');
    } finally {
      setProductsLoading(false);
    }
  }, [getUser]);

  // Fetch customers with runtime data
  const fetchCustomers = useCallback(async () => {
    try {
      setCustomersLoading(true);
      setCustomersError(null);
      
      const user = await getUser();
      if (!user) {
        setCustomers([]);
        return;
      }

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('store_id', user.id)
        .order('name', { ascending: true });

      if (error) {
        console.error('Customers fetch error:', error);
        setCustomersError(error.message);
      } else {
        console.log('Customers fetched:', data?.length || 0);
        setCustomers(data || []);
      }
    } catch (error) {
      console.error('Customers fetch error:', error);
      setCustomersError('Failed to fetch customers');
    } finally {
      setCustomersLoading(false);
    }
  }, [getUser]);

  // Fetch orders with runtime data
  const fetchOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      setOrdersError(null);
      
      const user = await getUser();
      if (!user) {
        setOrders([]);
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Orders fetch error:', error);
        setOrdersError(error.message);
      } else {
        console.log('Orders fetched:', data?.length || 0);
        setOrders(data || []);
      }
    } catch (error) {
      console.error('Orders fetch error:', error);
      setOrdersError('Failed to fetch orders');
    } finally {
      setOrdersLoading(false);
    }
  }, [getUser]);

  // Fetch notifications with runtime data
  const fetchNotifications = useCallback(async () => {
    try {
      setNotificationsLoading(true);
      setNotificationsError(null);
      
      const user = await getUser();
      if (!user) {
        setNotifications([]);
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Notifications fetch error:', error);
        setNotificationsError(error.message);
      } else {
        console.log('Notifications fetched:', data?.length || 0);
        setNotifications(data || []);
      }
    } catch (error) {
      console.error('Notifications fetch error:', error);
      setNotificationsError('Failed to fetch notifications');
    } finally {
      setNotificationsLoading(false);
    }
  }, [getUser]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    console.log('Refreshing all runtime data...');
    await Promise.all([
      fetchProducts(),
      fetchCustomers(),
      fetchOrders(),
      fetchNotifications()
    ]);
  }, [fetchProducts, fetchCustomers, fetchOrders, fetchNotifications]);

  // Initial data fetch and real-time subscriptions
  useEffect(() => {
    let mounted = true;
    let channels: any[] = [];

    const setupDataAndSubscriptions = async () => {
      const user = await getUser();
      if (!user || !mounted) return;

      // Initial fetch
      await refreshAll();

      // Real-time subscriptions
      const productsChannel = supabase
        .channel('products-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'products',
            filter: `store_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Products real-time change:', payload);
            fetchProducts(); // Refetch to ensure consistency
          }
        )
        .subscribe();

      const customersChannel = supabase
        .channel('customers-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'customers',
            filter: `store_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Customers real-time change:', payload);
            fetchCustomers(); // Refetch to ensure consistency
          }
        )
        .subscribe();

      const ordersChannel = supabase
        .channel('orders-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `store_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Orders real-time change:', payload);
            fetchOrders(); // Refetch to ensure consistency
          }
        )
        .subscribe();

      const notificationsChannel = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Notifications real-time change:', payload);
            fetchNotifications(); // Refetch to ensure consistency
          }
        )
        .subscribe();

      channels = [productsChannel, customersChannel, ordersChannel, notificationsChannel];
    };

    setupDataAndSubscriptions();

    // Page visibility API - refetch when user returns to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isConnected) {
        console.log('Tab became visible, refreshing data...');
        refreshAll();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      channels.forEach(channel => {
        if (channel) {
          supabase.removeChannel(channel);
        }
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [getUser, refreshAll, fetchProducts, fetchCustomers, fetchOrders, fetchNotifications, isConnected]);

  return {
    // Products
    products,
    productsLoading,
    productsError,
    fetchProducts,
    
    // Customers
    customers,
    customersLoading,
    customersError,
    fetchCustomers,
    
    // Orders
    orders,
    ordersLoading,
    ordersError,
    fetchOrders,
    
    // Notifications
    notifications,
    notificationsLoading,
    notificationsError,
    fetchNotifications,
    
    // Global
    isConnected,
    refreshAll
  };
}