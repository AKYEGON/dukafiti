/**
 * Runtime Operations Hook - All CRUD operations with immediate refetch
 * Ensures mutations trigger immediate UI updates without caching
 */

import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/SupabaseAuth';
import { useToast } from '@/hooks/use-toast';
import { useRuntimeData } from './useRuntimeData';

export function useRuntimeOperations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { fetchProducts, fetchCustomers, fetchOrders, fetchNotifications } = useRuntimeData();

  // Product Operations
  const addProduct = useCallback(async (payload: any) => {
    if (!user?.id) {
      toast({ title: "Error", description: "User not authenticated", variant: "destructive" });
      return;
    }

    try {
      console.log('➕ Adding product:', payload.name);
      
      const { data, error } = await supabase
        .from('products')
        .insert([{ ...payload, store_id: user.id }])
        .select()
        .single();

      if (error) {
        console.error('❌ Product creation error:', error);
        toast({ title: "Error adding product", description: error.message, variant: "destructive" });
        return;
      }

      console.log('✅ Product added:', data);
      await fetchProducts(); // Immediate refetch
      toast({ title: "Product added successfully" });
      return data;
    } catch (error: any) {
      console.error('❌ Product creation failed:', error);
      toast({ title: "Error adding product", description: error.message, variant: "destructive" });
    }
  }, [user?.id, toast, fetchProducts]);

  const updateProduct = useCallback(async (id: number, updates: any) => {
    if (!user?.id) {
      toast({ title: "Error", description: "User not authenticated", variant: "destructive" });
      return;
    }

    try {
      console.log('✏️ Updating product:', id, updates);
      
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .eq('store_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Product update error:', error);
        toast({ title: "Error updating product", description: error.message, variant: "destructive" });
        return;
      }

      console.log('✅ Product updated:', data);
      await fetchProducts(); // Immediate refetch
      toast({ title: "Product updated successfully" });
      return data;
    } catch (error: any) {
      console.error('❌ Product update failed:', error);
      toast({ title: "Error updating product", description: error.message, variant: "destructive" });
    }
  }, [user?.id, toast, fetchProducts]);

  const deleteProduct = useCallback(async (id: number) => {
    if (!user?.id) {
      toast({ title: "Error", description: "User not authenticated", variant: "destructive" });
      return;
    }

    try {
      console.log('🗑️ Deleting product:', id);
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('store_id', user.id);

      if (error) {
        console.error('❌ Product deletion error:', error);
        toast({ title: "Error deleting product", description: error.message, variant: "destructive" });
        return;
      }

      console.log('✅ Product deleted');
      await fetchProducts(); // Immediate refetch
      toast({ title: "Product deleted successfully" });
    } catch (error: any) {
      console.error('❌ Product deletion failed:', error);
      toast({ title: "Error deleting product", description: error.message, variant: "destructive" });
    }
  }, [user?.id, toast, fetchProducts]);

  const restockProduct = useCallback(async (id: number, quantity: number, costPrice?: number) => {
    if (!user?.id) {
      toast({ title: "Error", description: "User not authenticated", variant: "destructive" });
      return;
    }

    try {
      console.log('📦 Restocking product:', id, quantity);
      
      // Get current product
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', id)
        .eq('store_id', user.id)
        .single();

      if (fetchError) {
        console.error('❌ Product fetch error:', fetchError);
        toast({ title: "Error fetching product", description: fetchError.message, variant: "destructive" });
        return;
      }

      // Update stock
      const updates: any = { stock: (product.stock || 0) + quantity };
      if (costPrice !== undefined) {
        updates.cost_price = costPrice;
      }

      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .eq('store_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Product restock error:', error);
        toast({ title: "Error restocking product", description: error.message, variant: "destructive" });
        return;
      }

      console.log('✅ Product restocked:', data);
      await fetchProducts(); // Immediate refetch
      toast({ title: "Product restocked successfully" });
      return data;
    } catch (error: any) {
      console.error('❌ Product restock failed:', error);
      toast({ title: "Error restocking product", description: error.message, variant: "destructive" });
    }
  }, [user?.id, toast, fetchProducts]);

  // Customer Operations
  const addCustomer = useCallback(async (payload: any) => {
    if (!user?.id) {
      toast({ title: "Error", description: "User not authenticated", variant: "destructive" });
      return;
    }

    try {
      console.log('➕ Adding customer:', payload.name);
      
      const { data, error } = await supabase
        .from('customers')
        .insert([{ ...payload, store_id: user.id }])
        .select()
        .single();

      if (error) {
        console.error('❌ Customer creation error:', error);
        toast({ title: "Error adding customer", description: error.message, variant: "destructive" });
        return;
      }

      console.log('✅ Customer added:', data);
      await fetchCustomers(); // Immediate refetch
      toast({ title: "Customer added successfully" });
      return data;
    } catch (error: any) {
      console.error('❌ Customer creation failed:', error);
      toast({ title: "Error adding customer", description: error.message, variant: "destructive" });
    }
  }, [user?.id, toast, fetchCustomers]);

  const updateCustomer = useCallback(async (id: number, updates: any) => {
    if (!user?.id) {
      toast({ title: "Error", description: "User not authenticated", variant: "destructive" });
      return;
    }

    try {
      console.log('✏️ Updating customer:', id, updates);
      
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .eq('store_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Customer update error:', error);
        toast({ title: "Error updating customer", description: error.message, variant: "destructive" });
        return;
      }

      console.log('✅ Customer updated:', data);
      await fetchCustomers(); // Immediate refetch
      toast({ title: "Customer updated successfully" });
      return data;
    } catch (error: any) {
      console.error('❌ Customer update failed:', error);
      toast({ title: "Error updating customer", description: error.message, variant: "destructive" });
    }
  }, [user?.id, toast, fetchCustomers]);

  const deleteCustomer = useCallback(async (id: number) => {
    if (!user?.id) {
      toast({ title: "Error", description: "User not authenticated", variant: "destructive" });
      return;
    }

    try {
      console.log('🗑️ Deleting customer:', id);
      
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)
        .eq('store_id', user.id);

      if (error) {
        console.error('❌ Customer deletion error:', error);
        toast({ title: "Error deleting customer", description: error.message, variant: "destructive" });
        return;
      }

      console.log('✅ Customer deleted');
      await fetchCustomers(); // Immediate refetch
      toast({ title: "Customer deleted successfully" });
    } catch (error: any) {
      console.error('❌ Customer deletion failed:', error);
      toast({ title: "Error deleting customer", description: error.message, variant: "destructive" });
    }
  }, [user?.id, toast, fetchCustomers]);

  const recordRepayment = useCallback(async (customerId: number, amount: number, method: string = 'cash', note?: string) => {
    if (!user?.id) {
      toast({ title: "Error", description: "User not authenticated", variant: "destructive" });
      return;
    }

    try {
      console.log('💰 Recording repayment:', customerId, amount);
      
      // Get current customer balance
      const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('balance')
        .eq('id', customerId)
        .eq('store_id', user.id)
        .single();

      if (fetchError) {
        console.error('❌ Customer fetch error:', fetchError);
        toast({ title: "Error fetching customer", description: fetchError.message, variant: "destructive" });
        return;
      }

      // Calculate new balance
      const currentBalance = parseFloat(customer.balance || '0');
      const newBalance = Math.max(0, currentBalance - amount);

      // Update customer balance
      const { data, error } = await supabase
        .from('customers')
        .update({ balance: newBalance.toString() })
        .eq('id', customerId)
        .eq('store_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Repayment error:', error);
        toast({ title: "Error recording repayment", description: error.message, variant: "destructive" });
        return;
      }

      console.log('✅ Repayment recorded:', data);
      await fetchCustomers(); // Immediate refetch
      toast({ title: "Payment recorded successfully" });
      return data;
    } catch (error: any) {
      console.error('❌ Repayment recording failed:', error);
      toast({ title: "Error recording payment", description: error.message, variant: "destructive" });
    }
  }, [user?.id, toast, fetchCustomers]);

  // Sales Operations
  const processSale = useCallback(async (saleData: any) => {
    if (!user?.id) {
      toast({ title: "Error", description: "User not authenticated", variant: "destructive" });
      return;
    }

    try {
      console.log('💳 Processing sale:', saleData);
      
      const orderData = {
        customer_name: saleData.customerName || 'Walk-in Customer',
        customer_phone: saleData.customerPhone || '',
        total: saleData.total.toString(),
        payment_method: saleData.paymentMethod,
        status: 'completed',
        store_id: user.id
      };

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (orderError) {
        console.error('❌ Order creation error:', orderError);
        toast({ title: "Error creating order", description: orderError.message, variant: "destructive" });
        return;
      }

      // Create order items and update product stock
      for (const item of saleData.items) {
        // Add order item
        const { error: itemError } = await supabase
          .from('order_items')
          .insert([{
            order_id: order.id,
            product_id: item.productId,
            quantity: item.quantity,
            price: item.price.toString()
          }]);

        if (itemError) {
          console.error('❌ Order item creation error:', itemError);
          continue;
        }

        // Update product stock (only if not unknown quantity)
        if (item.hasStock) {
          const { error: stockError } = await supabase
            .from('products')
            .update({ 
              stock: item.newStock,
              sales_count: supabase.sql`COALESCE(sales_count, 0) + ${item.quantity}`
            })
            .eq('id', item.productId)
            .eq('store_id', user.id);

          if (stockError) {
            console.error('❌ Stock update error:', stockError);
          }
        }
      }

      // If credit sale, update customer balance
      if (saleData.paymentMethod === 'credit' && saleData.customerId) {
        const { data: customer, error: customerFetchError } = await supabase
          .from('customers')
          .select('balance')
          .eq('id', saleData.customerId)
          .eq('store_id', user.id)
          .single();

        if (!customerFetchError && customer) {
          const currentBalance = parseFloat(customer.balance || '0');
          const newBalance = currentBalance + saleData.total;

          await supabase
            .from('customers')
            .update({ balance: newBalance.toString() })
            .eq('id', saleData.customerId)
            .eq('store_id', user.id);
        }
      }

      console.log('✅ Sale processed:', order);
      
      // Immediate refetch all affected data
      await Promise.all([
        fetchProducts(),
        fetchCustomers(),
        fetchOrders()
      ]);
      
      toast({ title: "Sale completed successfully" });
      return order;
    } catch (error: any) {
      console.error('❌ Sale processing failed:', error);
      toast({ title: "Error processing sale", description: error.message, variant: "destructive" });
    }
  }, [user?.id, toast, fetchProducts, fetchCustomers, fetchOrders]);

  return {
    // Products
    addProduct,
    updateProduct,
    deleteProduct,
    restockProduct,
    
    // Customers
    addCustomer,
    updateCustomer,
    deleteCustomer,
    recordRepayment,
    
    // Sales
    processSale,
  };
}