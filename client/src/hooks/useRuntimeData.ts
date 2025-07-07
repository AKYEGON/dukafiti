/**
 * Runtime Data Hook - Forces All Data to be Fetched at Runtime with Real-time Updates
 * Eliminates all build-time data and ensures immediate UI updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/SupabaseAuth';
import { useToast } from '@/hooks/use-toast';
import type { Product, Customer, Order, Notification } from '@/types/schema';

interface UseRuntimeDataReturn {
  // Products
  products: Product[];
  productsLoading: boolean;
  productsError: any;
  fetchProducts: () => Promise<void>;
  
  // Customers
  customers: Customer[];
  customersLoading: boolean;
  customersError: any;
  fetchCustomers: () => Promise<void>;
  
  // Orders
  orders: Order[];
  ordersLoading: boolean;
  ordersError: any;
  fetchOrders: () => Promise<void>;
  
  // Notifications
  notifications: Notification[];
  notificationsLoading: boolean;
  notificationsError: any;
  fetchNotifications: () => Promise<void>;
  
  // Global refresh
  forceRefreshAll: () => Promise<void>;
  isConnected: boolean;
}

export function useRuntimeData(): UseRuntimeDataReturn {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const subscriptionsRef = useRef<any[]>([]);
  const [isConnected, setIsConnected] = useState(true);

  // State for each entity - starts empty, no initial data
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<any>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState<any>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<any>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<any>(null);

  // Runtime fetch functions - no caching, always fresh from database
  const fetchProducts = useCallback(async () => {
    if (!user?.id) return;
    
    setProductsLoading(true);
    setProductsError(null);
    
    try {
      console.log('🔄 Runtime fetch: Products for store:', user.id);
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Products fetch error:', error);
        setProductsError(error);
        toast({
          title: "Error fetching products",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      console.log('✅ Products fetched:', data?.length || 0);
      setProducts(data || []);
    } catch (error) {
      console.error('❌ Products fetch failed:', error);
      setProductsError(error);
    } finally {
      setProductsLoading(false);
    }
  }, [user?.id, toast]);

  const fetchCustomers = useCallback(async () => {
    if (!user?.id) return;
    
    setCustomersLoading(true);
    setCustomersError(null);
    
    try {
      console.log('🔄 Runtime fetch: Customers for store:', user.id);
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('store_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Customers fetch error:', error);
        setCustomersError(error);
        toast({
          title: "Error fetching customers",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      console.log('✅ Customers fetched:', data?.length || 0);
      setCustomers(data || []);
    } catch (error) {
      console.error('❌ Customers fetch failed:', error);
      setCustomersError(error);
    } finally {
      setCustomersLoading(false);
    }
  }, [user?.id, toast]);

  const fetchOrders = useCallback(async () => {
    if (!user?.id) return;
    
    setOrdersLoading(true);
    setOrdersError(null);
    
    try {
      console.log('🔄 Runtime fetch: Orders for store:', user.id);
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            price,
            product:products (
              id,
              name,
              sku
            )
          )
        `)
        .eq('store_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Orders fetch error:', error);
        setOrdersError(error);
        toast({
          title: "Error fetching orders",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      console.log('✅ Orders fetched:', data?.length || 0);
      setOrders(data || []);
    } catch (error) {
      console.error('❌ Orders fetch failed:', error);
      setOrdersError(error);
    } finally {
      setOrdersLoading(false);
    }
  }, [user?.id, toast]);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    
    setNotificationsLoading(true);
    setNotificationsError(null);
    
    try {
      console.log('🔄 Runtime fetch: Notifications for user:', user.id);
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('❌ Notifications fetch error:', error);
        setNotificationsError(error);
        return;
      }
      
      console.log('✅ Notifications fetched:', data?.length || 0);
      setNotifications(data || []);
    } catch (error) {
      console.error('❌ Notifications fetch failed:', error);
      setNotificationsError(error);
    } finally {
      setNotificationsLoading(false);
    }
  }, [user?.id]);

  // Force refresh all data
  const forceRefreshAll = useCallback(async () => {
    console.log('🔄 Force refreshing all data');
    await Promise.all([
      fetchProducts(),
      fetchCustomers(),
      fetchOrders(),
      fetchNotifications()
    ]);
  }, [fetchProducts, fetchCustomers, fetchOrders, fetchNotifications]);

  // Setup real-time subscriptions for immediate updates
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    console.log('📡 Setting up real-time subscriptions for store:', user.id);

    // Clean up existing subscriptions
    subscriptionsRef.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    subscriptionsRef.current = [];

    // Products subscription
    const productsChannel = supabase
      .channel(`products-runtime-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'products',
        filter: `store_id=eq.${user.id}`
      }, (payload) => {
        console.log('📡 Products real-time update:', payload.eventType, payload.new?.name || payload.old?.name);
        
        switch (payload.eventType) {
          case 'INSERT':
            setProducts(prev => [payload.new as Product, ...prev]);
            break;
          case 'UPDATE':
            setProducts(prev => prev.map(p => p.id === payload.new.id ? payload.new as Product : p));
            break;
          case 'DELETE':
            setProducts(prev => prev.filter(p => p.id !== payload.old.id));
            break;
        }
      })
      .subscribe();

    // Customers subscription
    const customersChannel = supabase
      .channel(`customers-runtime-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'customers',
        filter: `store_id=eq.${user.id}`
      }, (payload) => {
        console.log('📡 Customers real-time update:', payload.eventType, payload.new?.name || payload.old?.name);
        
        switch (payload.eventType) {
          case 'INSERT':
            setCustomers(prev => [payload.new as Customer, ...prev]);
            break;
          case 'UPDATE':
            setCustomers(prev => prev.map(c => c.id === payload.new.id ? payload.new as Customer : c));
            break;
          case 'DELETE':
            setCustomers(prev => prev.filter(c => c.id !== payload.old.id));
            break;
        }
      })
      .subscribe();

    // Orders subscription
    const ordersChannel = supabase
      .channel(`orders-runtime-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `store_id=eq.${user.id}`
      }, (payload) => {
        console.log('📡 Orders real-time update:', payload.eventType);
        
        // Refetch orders to get full data with relations
        fetchOrders();
      })
      .subscribe();

    // Notifications subscription
    const notificationsChannel = supabase
      .channel(`notifications-runtime-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('📡 Notifications real-time update:', payload.eventType);
        
        switch (payload.eventType) {
          case 'INSERT':
            setNotifications(prev => [payload.new as Notification, ...prev.slice(0, 49)]);
            break;
          case 'UPDATE':
            setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new as Notification : n));
            break;
          case 'DELETE':
            setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
            break;
        }
      })
      .subscribe();

    subscriptionsRef.current = [productsChannel, customersChannel, ordersChannel, notificationsChannel];

    return () => {
      console.log('🧹 Cleaning up real-time subscriptions');
      subscriptionsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      subscriptionsRef.current = [];
    };
  }, [isAuthenticated, user?.id, fetchOrders]);

  // Initial data fetch on mount
  useEffect(() => {
    if (!user?.id) return;
    
    console.log('🚀 Initial runtime data fetch for store:', user.id);
    forceRefreshAll();
  }, [user?.id, forceRefreshAll]);

  // Monitor connectivity
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Connection restored');
      setIsConnected(true);
      forceRefreshAll();
    };

    const handleOffline = () => {
      console.log('📵 Connection lost');
      setIsConnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [forceRefreshAll]);

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
    forceRefreshAll,
    isConnected,
  };
}