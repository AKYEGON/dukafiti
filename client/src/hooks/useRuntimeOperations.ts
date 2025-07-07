import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface UseRuntimeOperationsReturn {
  // Product operations
  createProduct: (data: any) => Promise<boolean>;
  updateProduct: (id: string, data: any) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  restockProduct: (id: string, quantity: number, cost?: number) => Promise<boolean>;
  
  // Customer operations
  createCustomer: (data: any) => Promise<boolean>;
  updateCustomer: (id: string, data: any) => Promise<boolean>;
  deleteCustomer: (id: string) => Promise<boolean>;
  recordPayment: (customerId: string, amount: number) => Promise<boolean>;
  
  // Order operations
  createOrder: (data: any) => Promise<boolean>;
  updateOrder: (id: string, data: any) => Promise<boolean>;
  deleteOrder: (id: string) => Promise<boolean>;
  
  // Processing states
  isProcessing: boolean;
}

export function useRuntimeOperations(): UseRuntimeOperationsReturn {
  const { toast } = useToast();

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

  // Product operations
  const createProduct = useCallback(async (productData: any): Promise<boolean> => {
    try {
      const user = await getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('products')
        .insert([{ ...productData, store_id: user.id }]);

      if (error) {
        console.error('Create product error:', error);
        toast({
          title: "Error creating product",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Product created",
        description: "Product added successfully"
      });
      return true;
    } catch (error) {
      console.error('Create product error:', error);
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive"
      });
      return false;
    }
  }, [getUser, toast]);

  const updateProduct = useCallback(async (id: string, updates: any): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Update product error:', error);
        toast({
          title: "Error updating product",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Product updated",
        description: "Product updated successfully"
      });
      return true;
    } catch (error) {
      console.error('Update product error:', error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  const deleteProduct = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete product error:', error);
        toast({
          title: "Error deleting product",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Product deleted",
        description: "Product deleted successfully"
      });
      return true;
    } catch (error) {
      console.error('Delete product error:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  const restockProduct = useCallback(async (id: string, quantity: number, cost?: number): Promise<boolean> => {
    try {
      // Get current product
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const newStock = (product.stock || 0) + quantity;
      const updates: any = { stock: newStock };
      
      if (cost !== undefined) {
        updates.cost_price = cost.toString();
      }

      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Restock product error:', error);
        toast({
          title: "Error restocking product",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Product restocked",
        description: `Added ${quantity} units to inventory`
      });
      return true;
    } catch (error) {
      console.error('Restock product error:', error);
      toast({
        title: "Error",
        description: "Failed to restock product",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  // Customer operations
  const createCustomer = useCallback(async (customerData: any): Promise<boolean> => {
    try {
      const user = await getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('customers')
        .insert([{ ...customerData, store_id: user.id }]);

      if (error) {
        console.error('Create customer error:', error);
        toast({
          title: "Error creating customer",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Customer created",
        description: "Customer added successfully"
      });
      return true;
    } catch (error) {
      console.error('Create customer error:', error);
      toast({
        title: "Error",
        description: "Failed to create customer",
        variant: "destructive"
      });
      return false;
    }
  }, [getUser, toast]);

  const updateCustomer = useCallback(async (id: string, updates: any): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Update customer error:', error);
        toast({
          title: "Error updating customer",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Customer updated",
        description: "Customer updated successfully"
      });
      return true;
    } catch (error) {
      console.error('Update customer error:', error);
      toast({
        title: "Error",
        description: "Failed to update customer",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  const deleteCustomer = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete customer error:', error);
        toast({
          title: "Error deleting customer",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Customer deleted",
        description: "Customer deleted successfully"
      });
      return true;
    } catch (error) {
      console.error('Delete customer error:', error);
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  const recordPayment = useCallback(async (customerId: string, amount: number): Promise<boolean> => {
    try {
      // Get current customer balance
      const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('balance')
        .eq('id', customerId)
        .single();

      if (fetchError) throw fetchError;

      const newBalance = Math.max(0, (customer.balance || 0) - amount);

      const { error } = await supabase
        .from('customers')
        .update({ balance: newBalance })
        .eq('id', customerId);

      if (error) {
        console.error('Record payment error:', error);
        toast({
          title: "Error recording payment",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Payment recorded",
        description: `Payment of KES ${amount.toLocaleString()} recorded successfully`
      });
      return true;
    } catch (error) {
      console.error('Record payment error:', error);
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  // Order operations
  const createOrder = useCallback(async (orderData: any): Promise<boolean> => {
    try {
      const user = await getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('orders')
        .insert([{ ...orderData, store_id: user.id }]);

      if (error) {
        console.error('Create order error:', error);
        toast({
          title: "Error creating order",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Order created",
        description: "Order created successfully"
      });
      return true;
    } catch (error) {
      console.error('Create order error:', error);
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive"
      });
      return false;
    }
  }, [getUser, toast]);

  const updateOrder = useCallback(async (id: string, updates: any): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Update order error:', error);
        toast({
          title: "Error updating order",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Order updated",
        description: "Order updated successfully"
      });
      return true;
    } catch (error) {
      console.error('Update order error:', error);
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  const deleteOrder = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete order error:', error);
        toast({
          title: "Error deleting order",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Order deleted",
        description: "Order deleted successfully"
      });
      return true;
    } catch (error) {
      console.error('Delete order error:', error);
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  return {
    // Product operations
    createProduct,
    updateProduct,
    deleteProduct,
    restockProduct,
    
    // Customer operations
    createCustomer,
    updateCustomer,
    deleteCustomer,
    recordPayment,
    
    // Order operations
    createOrder,
    updateOrder,
    deleteOrder,
    
    // Processing states
    isProcessing: false // Can be enhanced to track specific operations
  };
}