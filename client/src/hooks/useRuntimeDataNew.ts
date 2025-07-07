/**
 * COMPREHENSIVE RUNTIME DATA HOOK
 * Strips out all build-time/cached data and ensures 100% runtime fetch + immediate updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/SupabaseAuth';
import { useToast } from '@/hooks/use-toast';
import type { Product, Customer, Order, Notification } from '@/types/schema';

// Individual hook for Products
export function useProductsRuntime() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const channelRef = useRef<any>(null);

  // Runtime fetch function - no caching, always fresh
  const fetchProducts = useCallback(async () => {
    if (!user?.id) return [];
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Runtime fetch: Products');
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Products fetch error:', error);
        setError(error);
        toast({
          title: "Error",
          description: "Failed to load products",
          variant: "destructive"
        });
        return [];
      }
      
      console.log(`✅ Products fetched: ${data?.length || 0}`);
      setProducts(data || []);
      return data || [];
    } catch (err) {
      console.error('❌ Products fetch failed:', err);
      setError(err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, toast]);

  // Mutation handlers with immediate refetch
  const addProduct = useCallback(async (productData: any) => {
    if (!user?.id) return;
    
    // Optimistic update
    const tempId = Date.now().toString();
    const optimisticProduct = { ...productData, id: tempId, store_id: user.id };
    setProducts(prev => [optimisticProduct, ...prev]);
    
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{ ...productData, store_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Remove optimistic update and refetch
      await fetchProducts();
      toast({ title: "Success", description: "Product added successfully" });
      return data;
    } catch (error: any) {
      console.error('❌ Add product error:', error);
      // Rollback optimistic update
      setProducts(prev => prev.filter(p => p.id !== tempId));
      toast({
        title: "Error",
        description: error.message || "Failed to add product",
        variant: "destructive"
      });
      throw error;
    }
  }, [user?.id, fetchProducts, toast]);

  const updateProduct = useCallback(async (id: string, updateData: any) => {
    if (!user?.id) return;
    
    // Optimistic update
    const oldProducts = products;
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updateData } : p));
    
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .eq('store_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      await fetchProducts();
      toast({ title: "Success", description: "Product updated successfully" });
      return data;
    } catch (error: any) {
      console.error('❌ Update product error:', error);
      // Rollback optimistic update
      setProducts(oldProducts);
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive"
      });
      throw error;
    }
  }, [user?.id, products, fetchProducts, toast]);

  const deleteProduct = useCallback(async (id: string) => {
    if (!user?.id) return;
    
    // Optimistic update
    const oldProducts = products;
    setProducts(prev => prev.filter(p => p.id !== id));
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('store_id', user.id);
      
      if (error) throw error;
      
      await fetchProducts();
      toast({ title: "Success", description: "Product deleted successfully" });
    } catch (error: any) {
      console.error('❌ Delete product error:', error);
      // Rollback optimistic update
      setProducts(oldProducts);
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive"
      });
      throw error;
    }
  }, [user?.id, products, fetchProducts, toast]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;
    
    fetchProducts();
    
    const channel = supabase
      .channel(`products-runtime-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'products',
        filter: `store_id=eq.${user.id}`
      }, (payload) => {
        console.log('📡 Products real-time update:', payload.eventType);
        
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

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user?.id, fetchProducts]);

  return {
    products,
    isLoading,
    error,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct
  };
}

// Individual hook for Customers
export function useCustomersRuntime() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const channelRef = useRef<any>(null);

  // Runtime fetch function - no caching, always fresh
  const fetchCustomers = useCallback(async () => {
    if (!user?.id) return [];
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Runtime fetch: Customers');
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('store_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Customers fetch error:', error);
        setError(error);
        toast({
          title: "Error",
          description: "Failed to load customers",
          variant: "destructive"
        });
        return [];
      }
      
      console.log(`✅ Customers fetched: ${data?.length || 0}`);
      setCustomers(data || []);
      return data || [];
    } catch (err) {
      console.error('❌ Customers fetch failed:', err);
      setError(err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, toast]);

  // Mutation handlers with immediate refetch
  const addCustomer = useCallback(async (customerData: any) => {
    if (!user?.id) return;
    
    // Optimistic update
    const tempId = Date.now().toString();
    const optimisticCustomer = { ...customerData, id: tempId, store_id: user.id };
    setCustomers(prev => [optimisticCustomer, ...prev]);
    
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{ ...customerData, store_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Remove optimistic update and refetch
      await fetchCustomers();
      toast({ title: "Success", description: "Customer added successfully" });
      return data;
    } catch (error: any) {
      console.error('❌ Add customer error:', error);
      // Rollback optimistic update
      setCustomers(prev => prev.filter(c => c.id !== tempId));
      toast({
        title: "Error",
        description: error.message || "Failed to add customer",
        variant: "destructive"
      });
      throw error;
    }
  }, [user?.id, fetchCustomers, toast]);

  const updateCustomer = useCallback(async (id: string, updateData: any) => {
    if (!user?.id) return;
    
    // Optimistic update
    const oldCustomers = customers;
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updateData } : c));
    
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', id)
        .eq('store_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      await fetchCustomers();
      toast({ title: "Success", description: "Customer updated successfully" });
      return data;
    } catch (error: any) {
      console.error('❌ Update customer error:', error);
      // Rollback optimistic update
      setCustomers(oldCustomers);
      toast({
        title: "Error",
        description: error.message || "Failed to update customer",
        variant: "destructive"
      });
      throw error;
    }
  }, [user?.id, customers, fetchCustomers, toast]);

  const deleteCustomer = useCallback(async (id: string) => {
    if (!user?.id) return;
    
    // Optimistic update
    const oldCustomers = customers;
    setCustomers(prev => prev.filter(c => c.id !== id));
    
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)
        .eq('store_id', user.id);
      
      if (error) throw error;
      
      await fetchCustomers();
      toast({ title: "Success", description: "Customer deleted successfully" });
    } catch (error: any) {
      console.error('❌ Delete customer error:', error);
      // Rollback optimistic update
      setCustomers(oldCustomers);
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer",
        variant: "destructive"
      });
      throw error;
    }
  }, [user?.id, customers, fetchCustomers, toast]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;
    
    fetchCustomers();
    
    const channel = supabase
      .channel(`customers-runtime-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'customers',
        filter: `store_id=eq.${user.id}`
      }, (payload) => {
        console.log('📡 Customers real-time update:', payload.eventType);
        
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

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user?.id, fetchCustomers]);

  return {
    customers,
    isLoading,
    error,
    fetchCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer
  };
}

// Individual hook for Orders/Sales
export function useOrdersRuntime() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const channelRef = useRef<any>(null);

  // Runtime fetch function - no caching, always fresh
  const fetchOrders = useCallback(async () => {
    if (!user?.id) return [];
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Runtime fetch: Orders');
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
        setError(error);
        toast({
          title: "Error",
          description: "Failed to load orders",
          variant: "destructive"
        });
        return [];
      }
      
      console.log(`✅ Orders fetched: ${data?.length || 0}`);
      setOrders(data || []);
      return data || [];
    } catch (err) {
      console.error('❌ Orders fetch failed:', err);
      setError(err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, toast]);

  // Create sale with immediate refetch
  const createSale = useCallback(async (saleData: any) => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([{ ...saleData, store_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Immediately refetch to show updated data
      await fetchOrders();
      toast({ title: "Success", description: "Sale completed successfully" });
      return data;
    } catch (error: any) {
      console.error('❌ Create sale error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete sale",
        variant: "destructive"
      });
      throw error;
    }
  }, [user?.id, fetchOrders, toast]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;
    
    fetchOrders();
    
    const channel = supabase
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

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user?.id, fetchOrders]);

  return {
    orders,
    isLoading,
    error,
    fetchOrders,
    createSale
  };
}

// Individual hook for Notifications
export function useNotificationsRuntime() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const channelRef = useRef<any>(null);

  // Runtime fetch function - no caching, always fresh
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return [];
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Runtime fetch: Notifications');
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('❌ Notifications fetch error:', error);
        setError(error);
        return [];
      }
      
      console.log(`✅ Notifications fetched: ${data?.length || 0}`);
      setNotifications(data || []);
      return data || [];
    } catch (err) {
      console.error('❌ Notifications fetch failed:', err);
      setError(err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Mark notifications as read
  const markAsRead = useCallback(async (notificationIds: string[]) => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', notificationIds)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Immediately refetch
      await fetchNotifications();
    } catch (error: any) {
      console.error('❌ Mark as read error:', error);
    }
  }, [user?.id, fetchNotifications]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;
    
    fetchNotifications();
    
    const channel = supabase
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

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user?.id, fetchNotifications]);

  return {
    notifications,
    isLoading,
    error,
    fetchNotifications,
    markAsRead
  };
}