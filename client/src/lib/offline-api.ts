// DukaFiti Offline API - Wrapper for all data operations

import { offlineStore } from './offline-store';
import { supabase } from './supabase';
import { toast } from '@/hooks/use-toast';

// Check if we should queue operations
const shouldQueue = () => !navigator.onLine;

// Sale Operations
export const createSaleOfflineAware = async (saleData: any) => {
  if (shouldQueue()) {
    // Queue for offline processing
    const operationId = await offlineStore.enqueue({
      type: 'sale',
      endpoint: 'sales',
      payload: saleData,
      maxRetries: 3
    });
    
    return {
      success: true,
      offline: true,
      operationId,
      data: { id: operationId }
    };
  }
  
  // Process immediately when online
  try {
    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        customer_id: saleData.customerId,
        customer_name: saleData.customerName,
        total: saleData.total,
        status: 'completed',
        payment_method: saleData.paymentMethod,
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = saleData.items.map((item: any) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Update product stock
    for (const item of saleData.items) {
      if (item.hasStock) {
        const { error: stockError } = await supabase
          .from('products')
          .update({
            stock: item.newStock,
            sales_count: item.newSalesCount
          })
          .eq('id', item.productId);

        if (stockError) throw stockError;
      }
    }

    return {
      success: true,
      offline: false,
      data: order
    };
  } catch (error) {
    throw error;
  }
};

// Restock Operations
export const restockProductOfflineAware = async (productId: string, quantity: number, costPrice?: number) => {
  if (shouldQueue()) {
    // Queue for offline processing
    const operationId = await offlineStore.enqueue({
      type: 'restock',
      endpoint: 'products/restock',
      payload: {
        productId,
        quantity,
        costPrice
      },
      maxRetries: 3
    });
    
    return {
      success: true,
      offline: true,
      operationId,
      data: { id: operationId }
    };
  }
  
  // Process immediately when online
  try {
    // Get current stock
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('stock')
      .eq('id', productId)
      .single();

    if (fetchError) throw fetchError;

    const currentStock = product.stock || 0;
    const newStock = currentStock + quantity;

    // Update product - only stock for now, cost_price column doesn't exist yet
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', productId);

    if (updateError) throw updateError;

    return {
      success: true,
      offline: false,
      data: { newStock }
    };
  } catch (error) {
    throw error;
  }
};

// Customer Operations
export const createCustomerOfflineAware = async (customerData: any) => {
  if (shouldQueue()) {
    const operationId = await offlineStore.enqueue({
      type: 'customer_create',
      endpoint: 'customers',
      payload: customerData,
      maxRetries: 3
    });
    
    return {
      success: true,
      offline: true,
      operationId,
      data: { id: operationId }
    };
  }
  
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert([customerData])
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      offline: false,
      data
    };
  } catch (error) {
    throw error;
  }
};

export const updateCustomerOfflineAware = async (customerId: string, customerData: any) => {
  if (shouldQueue()) {
    const operationId = await offlineStore.enqueue({
      type: 'customer_update',
      endpoint: 'customers/update',
      payload: { id: customerId, data: customerData },
      maxRetries: 3
    });
    
    return {
      success: true,
      offline: true,
      operationId,
      data: { id: operationId }
    };
  }
  
  try {
    const { data, error } = await supabase
      .from('customers')
      .update(customerData)
      .eq('id', customerId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      offline: false,
      data
    };
  } catch (error) {
    throw error;
  }
};

export const deleteCustomerOfflineAware = async (customerId: string) => {
  if (shouldQueue()) {
    const operationId = await offlineStore.enqueue({
      type: 'customer_delete',
      endpoint: 'customers/delete',
      payload: { id: customerId },
      maxRetries: 3
    });
    
    return {
      success: true,
      offline: true,
      operationId,
      data: { id: operationId }
    };
  }
  
  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId);

    if (error) throw error;

    return {
      success: true,
      offline: false,
      data: { id: customerId }
    };
  } catch (error) {
    throw error;
  }
};

// Product Operations
export const createProductOfflineAware = async (productData: any) => {
  if (shouldQueue()) {
    const operationId = await offlineStore.enqueue({
      type: 'product_create',
      endpoint: 'products',
      payload: productData,
      maxRetries: 3
    });
    
    return {
      success: true,
      offline: true,
      operationId,
      data: { id: operationId }
    };
  }
  
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      offline: false,
      data
    };
  } catch (error) {
    throw error;
  }
};

export const updateProductOfflineAware = async (productId: string, productData: any) => {
  if (shouldQueue()) {
    const operationId = await offlineStore.enqueue({
      type: 'product_update',
      endpoint: 'products/update',
      payload: { id: productId, data: productData },
      maxRetries: 3
    });
    
    return {
      success: true,
      offline: true,
      operationId,
      data: { id: operationId }
    };
  }
  
  try {
    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      offline: false,
      data
    };
  } catch (error) {
    throw error;
  }
};

export const deleteProductOfflineAware = async (productId: string) => {
  if (shouldQueue()) {
    const operationId = await offlineStore.enqueue({
      type: 'product_delete',
      endpoint: 'products/delete',
      payload: { id: productId },
      maxRetries: 3
    });
    
    return {
      success: true,
      offline: true,
      operationId,
      data: { id: operationId }
    };
  }
  
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) throw error;

    return {
      success: true,
      offline: false,
      data: { id: productId }
    };
  } catch (error) {
    throw error;
  }
};