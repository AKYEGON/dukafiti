/**
 * CRUD Mutations Hook with Store Isolation and Optimistic Updates
 * Ensures all mutations include store_id and provide immediate UI feedback
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/SupabaseAuth';
import { useToast } from '@/hooks/use-toast';
import type { Product, Customer } from '@/types/schema';

export function useCRUDMutations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Helper to get current user ID
  const getCurrentUserId = () => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }
    return user.id;
  };

  // CREATE PRODUCT
  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      const userId = getCurrentUserId();
      
      console.log('➕ Creating product with store isolation:', productData.name);
      
      const payload = {
        name: productData.name,
        sku: productData.sku,
        description: productData.description || null,
        price: productData.price,
        cost_price: productData.costPrice || (productData.price * 0.6),
        stock: productData.unknownQuantity ? null : productData.stock,
        category: productData.category || 'General',
        low_stock_threshold: productData.unknownQuantity ? null : (productData.lowStockThreshold || 10),
        sales_count: 0,
        store_id: userId // Essential for RLS
      };

      const { data, error } = await supabase
        .from('products')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error('❌ Product creation error:', error);
        throw new Error(error.message || 'Failed to create product');
      }

      console.log('✅ Product created successfully:', data);
      return data;
    },
    onSuccess: (newProduct) => {
      toast({
        title: "Product created",
        description: `${newProduct.name} has been added to inventory`
      });
      
      // Immediate cache update
      queryClient.setQueryData(['products'], (old: Product[] = []) => [newProduct, ...old]);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      console.error('❌ Product creation failed:', error);
      toast({
        title: "Failed to create product",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // UPDATE PRODUCT
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const userId = getCurrentUserId();
      
      console.log('✏️ Updating product with store isolation:', id, updates.name);
      
      const payload = {
        name: updates.name,
        sku: updates.sku,
        description: updates.description,
        price: updates.price,
        stock: updates.unknownQuantity ? null : updates.stock,
        category: updates.category,
        low_stock_threshold: updates.unknownQuantity ? null : updates.lowStockThreshold,
        ...(updates.costPrice !== undefined && { cost_price: updates.costPrice })
      };

      const { data, error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', id)
        .eq('store_id', userId) // RLS enforcement
        .select()
        .single();

      if (error) {
        console.error('❌ Product update error:', error);
        throw new Error(error.message || 'Failed to update product');
      }

      console.log('✅ Product updated successfully:', data);
      return data;
    },
    onSuccess: (updatedProduct) => {
      toast({
        title: "Product updated",
        description: `${updatedProduct.name} has been updated`
      });
      
      // Immediate cache update
      queryClient.setQueryData(['products'], (old: Product[] = []) => 
        old.map(p => p.id === updatedProduct.id ? updatedProduct : p)
      );
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      console.error('❌ Product update failed:', error);
      toast({
        title: "Failed to update product",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // DELETE PRODUCT
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      const userId = getCurrentUserId();
      
      console.log('🗑️ Deleting product with store isolation:', productId);
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('store_id', userId); // RLS enforcement

      if (error) {
        console.error('❌ Product deletion error:', error);
        throw new Error(error.message || 'Failed to delete product');
      }

      console.log('✅ Product deleted successfully');
      return productId;
    },
    onSuccess: (deletedId) => {
      toast({
        title: "Product deleted",
        description: "Product has been removed from inventory"
      });
      
      // Immediate cache update
      queryClient.setQueryData(['products'], (old: Product[] = []) => 
        old.filter(p => p.id !== deletedId)
      );
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      console.error('❌ Product deletion failed:', error);
      toast({
        title: "Failed to delete product",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // RESTOCK PRODUCT
  const restockProductMutation = useMutation({
    mutationFn: async ({ productId, quantity, costPrice }: { productId: number; quantity: number; costPrice?: number }) => {
      const userId = getCurrentUserId();
      
      console.log('📦 Restocking product with store isolation:', productId, 'qty:', quantity);
      
      // Get current product data
      const { data: currentProduct, error: fetchError } = await supabase
        .from('products')
        .select('stock, cost_price')
        .eq('id', productId)
        .eq('store_id', userId)
        .single();

      if (fetchError) {
        throw new Error('Failed to fetch current product data');
      }

      const newStock = (currentProduct.stock || 0) + quantity;
      const updateData: any = { stock: newStock };
      
      if (costPrice) {
        updateData.cost_price = costPrice;
      }

      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId)
        .eq('store_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Restock error:', error);
        throw new Error(error.message || 'Failed to restock product');
      }

      console.log('✅ Product restocked successfully:', data);
      return data;
    },
    onSuccess: (updatedProduct) => {
      toast({
        title: "Stock updated",
        description: `${updatedProduct.name} stock has been updated`
      });
      
      // Immediate cache update
      queryClient.setQueryData(['products'], (old: Product[] = []) => 
        old.map(p => p.id === updatedProduct.id ? updatedProduct : p)
      );
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      console.error('❌ Restock failed:', error);
      toast({
        title: "Failed to update stock",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // CREATE CUSTOMER
  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: any) => {
      const userId = getCurrentUserId();
      
      console.log('➕ Creating customer with store isolation:', customerData.name);
      
      const payload = {
        name: customerData.name,
        phone: customerData.phone || null,
        email: customerData.email || null,
        address: customerData.address || null,
        balance: customerData.balance || '0.00',
        store_id: userId // Essential for RLS
      };

      const { data, error } = await supabase
        .from('customers')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error('❌ Customer creation error:', error);
        throw new Error(error.message || 'Failed to create customer');
      }

      console.log('✅ Customer created successfully:', data);
      return data;
    },
    onSuccess: (newCustomer) => {
      toast({
        title: "Customer created",
        description: `${newCustomer.name} has been added`
      });
      
      // Immediate cache update
      queryClient.setQueryData(['customers'], (old: Customer[] = []) => [newCustomer, ...old]);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: any) => {
      console.error('❌ Customer creation failed:', error);
      toast({
        title: "Failed to create customer",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // UPDATE CUSTOMER
  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const userId = getCurrentUserId();
      
      console.log('✏️ Updating customer with store isolation:', id, updates.name);
      
      const payload = {
        name: updates.name,
        phone: updates.phone || null,
        email: updates.email || null,
        address: updates.address || null,
        balance: updates.balance || '0.00'
      };

      const { data, error } = await supabase
        .from('customers')
        .update(payload)
        .eq('id', id)
        .eq('store_id', userId) // RLS enforcement
        .select()
        .single();

      if (error) {
        console.error('❌ Customer update error:', error);
        throw new Error(error.message || 'Failed to update customer');
      }

      console.log('✅ Customer updated successfully:', data);
      return data;
    },
    onSuccess: (updatedCustomer) => {
      toast({
        title: "Customer updated",
        description: `${updatedCustomer.name} has been updated`
      });
      
      // Immediate cache update
      queryClient.setQueryData(['customers'], (old: Customer[] = []) => 
        old.map(c => c.id === updatedCustomer.id ? updatedCustomer : c)
      );
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: any) => {
      console.error('❌ Customer update failed:', error);
      toast({
        title: "Failed to update customer",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // DELETE CUSTOMER
  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: number) => {
      const userId = getCurrentUserId();
      
      console.log('🗑️ Deleting customer with store isolation:', customerId);
      
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId)
        .eq('store_id', userId); // RLS enforcement

      if (error) {
        console.error('❌ Customer deletion error:', error);
        throw new Error(error.message || 'Failed to delete customer');
      }

      console.log('✅ Customer deleted successfully');
      return customerId;
    },
    onSuccess: (deletedId) => {
      toast({
        title: "Customer deleted",
        description: "Customer has been removed"
      });
      
      // Immediate cache update
      queryClient.setQueryData(['customers'], (old: Customer[] = []) => 
        old.filter(c => c.id !== deletedId)
      );
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: any) => {
      console.error('❌ Customer deletion failed:', error);
      toast({
        title: "Failed to delete customer",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // RECORD REPAYMENT
  const recordRepaymentMutation = useMutation({
    mutationFn: async ({ customerId, amount }: { customerId: number; amount: number }) => {
      const userId = getCurrentUserId();
      
      console.log('💰 Recording repayment with store isolation:', customerId, 'amount:', amount);
      
      // Get current customer balance
      const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('balance')
        .eq('id', customerId)
        .eq('store_id', userId)
        .single();

      if (fetchError) {
        throw new Error('Failed to fetch customer data');
      }

      const currentBalance = parseFloat(customer.balance || '0');
      const newBalance = Math.max(0, currentBalance - amount);

      const { data, error } = await supabase
        .from('customers')
        .update({ balance: newBalance.toFixed(2) })
        .eq('id', customerId)
        .eq('store_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Repayment recording error:', error);
        throw new Error(error.message || 'Failed to record repayment');
      }

      console.log('✅ Repayment recorded successfully:', data);
      return data;
    },
    onSuccess: (updatedCustomer) => {
      toast({
        title: "Repayment recorded",
        description: `Payment recorded for ${updatedCustomer.name}`
      });
      
      // Immediate cache update
      queryClient.setQueryData(['customers'], (old: Customer[] = []) => 
        old.map(c => c.id === updatedCustomer.id ? updatedCustomer : c)
      );
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: any) => {
      console.error('❌ Repayment recording failed:', error);
      toast({
        title: "Failed to record repayment",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return {
    createProductMutation,
    updateProductMutation,
    deleteProductMutation,
    restockProductMutation,
    createCustomerMutation,
    updateCustomerMutation,
    deleteCustomerMutation,
    recordRepaymentMutation
  };
}