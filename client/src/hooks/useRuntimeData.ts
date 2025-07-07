/**
 * Runtime Data Hook with Real-time Subscriptions
 * Ensures all data is fetched fresh from Supabase on every page load with proper RLS
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
  refetchProducts: () => Promise<void>;
  
  // Customers  
  customers: Customer[];
  customersLoading: boolean;
  customersError: any;
  refetchCustomers: () => Promise<void>;
  
  // Orders
  orders: Order[];
  ordersLoading: boolean;
  ordersError: any;
  refetchOrders: () => Promise<void>;
  
  // Notifications
  notifications: Notification[];
  notificationsLoading: boolean;
  notificationsError: any;
  refetchNotifications: () => Promise<void>;
  
  // Status
  isConnected: boolean;
  forceRefreshAll: () => Promise<void>;
}

export function useRuntimeData(): UseRuntimeDataReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(true);
  const subscriptionsRef = useRef<any[]>([]);

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<any>(null);

  // Customers state  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState<any>(null);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<any>(null);

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<any>(null);

  // Fetch products with RLS
  const fetchProducts = useCallback(async () => {
    if (!user) {
      console.log('⚠️ No user authenticated for products fetch');
      setProducts([]);
      return;
    }

    setProductsLoading(true);
    setProductsError(null);
    
    try {
      console.log('🔄 Runtime fetch: products for user', user.id);
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Products fetch error:', error);
        setProductsError(error);
        toast({
          title: "Error loading products",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log('✅ Products fetched:', data?.length || 0);
        setProducts(data || []);
      }
    } catch (error) {
      console.error('❌ Products fetch failed:', error);
      setProductsError(error);
    } finally {
      setProductsLoading(false);
    }
  }, [user, toast]);

  // Fetch customers with RLS
  const fetchCustomers = useCallback(async () => {
    if (!user) {
      console.log('⚠️ No user authenticated for customers fetch');
      setCustomers([]);
      return;
    }

    setCustomersLoading(true);
    setCustomersError(null);
    
    try {
      console.log('🔄 Runtime fetch: customers for user', user.id);
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('store_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Customers fetch error:', error);
        setCustomersError(error);
        toast({
          title: "Error loading customers",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log('✅ Customers fetched:', data?.length || 0);
        setCustomers(data || []);
      }
    } catch (error) {
      console.error('❌ Customers fetch failed:', error);
      setCustomersError(error);
    } finally {
      setCustomersLoading(false);
    }
  }, [user, toast]);

  // Fetch orders with RLS
  const fetchOrders = useCallback(async () => {
    if (!user) {
      console.log('⚠️ No user authenticated for orders fetch');
      setOrders([]);
      return;
    }

    setOrdersLoading(true);
    setOrdersError(null);
    
    try {
      console.log('🔄 Runtime fetch: orders for user', user.id);
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Orders fetch error:', error);
        setOrdersError(error);
      } else {
        console.log('✅ Orders fetched:', data?.length || 0);
        setOrders(data || []);
      }
    } catch (error) {
      console.error('❌ Orders fetch failed:', error);
      setOrdersError(error);
    } finally {
      setOrdersLoading(false);
    }
  }, [user]);

  // Fetch notifications with RLS
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      console.log('⚠️ No user authenticated for notifications fetch');
      setNotifications([]);
      return;
    }

    setNotificationsLoading(true);
    setNotificationsError(null);
    
    try {
      console.log('🔄 Runtime fetch: notifications for user', user.id);
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('store_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Notifications fetch error:', error);
        setNotificationsError(error);
      } else {
        console.log('✅ Notifications fetched:', data?.length || 0);
        setNotifications(data || []);
      }
    } catch (error) {
      console.error('❌ Notifications fetch failed:', error);
      setNotificationsError(error);
    } finally {
      setNotificationsLoading(false);
    }
  }, [user]);

  // Force refresh all data
  const forceRefreshAll = useCallback(async () => {
    console.log('🔄 Force refreshing all data...');
    await Promise.all([
      fetchProducts(),
      fetchCustomers(), 
      fetchOrders(),
      fetchNotifications()
    ]);
  }, [fetchProducts, fetchCustomers, fetchOrders, fetchNotifications]);

  // Initial data fetch when user changes
  useEffect(() => {
    if (!user) return;
    
    console.log('👤 User changed, fetching all data for:', user.id);
    forceRefreshAll();
  }, [user, forceRefreshAll]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    console.log('📡 Setting up real-time subscriptions for user:', user.id);

    // Products subscription
    const productsChannel = supabase
      .channel(`products:store_id=eq.${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `store_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📡 Products real-time update:', payload.eventType, payload.new?.name || payload.old?.name);
          
          setProducts(prev => {
            if (payload.eventType === 'INSERT') {
              return [payload.new as Product, ...prev];
            }
            if (payload.eventType === 'UPDATE') {
              return prev.map(item => item.id === payload.new.id ? payload.new as Product : item);
            }
            if (payload.eventType === 'DELETE') {
              return prev.filter(item => item.id !== payload.old.id);
            }
            return prev;
          });
        }
      )
      .subscribe();

    // Customers subscription  
    const customersChannel = supabase
      .channel(`customers:store_id=eq.${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customers',
          filter: `store_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📡 Customers real-time update:', payload.eventType, payload.new?.name || payload.old?.name);
          
          setCustomers(prev => {
            if (payload.eventType === 'INSERT') {
              return [payload.new as Customer, ...prev];
            }
            if (payload.eventType === 'UPDATE') {
              return prev.map(item => item.id === payload.new.id ? payload.new as Customer : item);
            }
            if (payload.eventType === 'DELETE') {
              return prev.filter(item => item.id !== payload.old.id);
            }
            return prev;
          });
        }
      )
      .subscribe();

    // Orders subscription
    const ordersChannel = supabase
      .channel(`orders:store_id=eq.${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📡 Orders real-time update:', payload.eventType);
          
          setOrders(prev => {
            if (payload.eventType === 'INSERT') {
              return [payload.new as Order, ...prev];
            }
            if (payload.eventType === 'UPDATE') {
              return prev.map(item => item.id === payload.new.id ? payload.new as Order : item);
            }
            if (payload.eventType === 'DELETE') {
              return prev.filter(item => item.id !== payload.old.id);
            }
            return prev;
          });
        }
      )
      .subscribe();

    // Store subscriptions for cleanup
    subscriptionsRef.current = [productsChannel, customersChannel, ordersChannel];

    // Cleanup subscriptions
    return () => {
      console.log('🧹 Cleaning up real-time subscriptions');
      subscriptionsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      subscriptionsRef.current = [];
    };
  }, [user]);

  // Monitor connection status
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
    refetchProducts: fetchProducts,
    
    // Customers
    customers,
    customersLoading,
    customersError,
    refetchCustomers: fetchCustomers,
    
    // Orders
    orders,
    ordersLoading,
    ordersError,
    refetchOrders: fetchOrders,
    
    // Notifications
    notifications,
    notificationsLoading,
    notificationsError,
    refetchNotifications: fetchNotifications,
    
    // Status
    isConnected,
    forceRefreshAll
  };
}