/**
 * Offline-aware API wrapper for DukaFiti
 * Handles offline operations by queuing them automatically
 */

import { supabase } from '@/lib/supabase';
import { offlineQueue, isOnline } from '@/lib/offline-queue';
import type { Product, Customer, InsertOrder } from '@/types/schema';

// Sale creation with offline support
export async function createSaleOfflineAware(saleData: any) {
  if (!isOnline()) {
    // Queue the sale for later sync
    const queueId = await offlineQueue.enqueue('sale', 'create', saleData);
    return { 
      success: true, 
      data: { id: queueId, queued: true },
      message: 'Sale queued for sync when online'
    };
  }

  try {
    const { data, error } = await supabase.rpc('create_sale_with_items', saleData);
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    
    const queueId = await offlineQueue.enqueue('sale', 'create', saleData);
    return { 
      success: true, 
      data: { id: queueId, queued: true },
      message: 'Sale queued due to connection issue'
    };
  }
}

// Product restocking with offline support
export async function restockProductOfflineAware(productId: number, quantity: number, costPrice?: number) {
  const restockData = {
    productId,
    quantity,
    costPrice,
    newStock: quantity, // This will be updated to actual new stock amount
  };

  if (!isOnline()) {
    const queueId = await offlineQueue.enqueue('restock', 'update', restockData);
    return { 
      success: true, 
      data: { id: queueId, queued: true },
      message: 'Restock queued for sync when online'
    };
  }

  try {
    // Get current stock first
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('stock')
      .eq('id', productId)
      .single();

    if (fetchError) throw fetchError;

    const newStock = (product.stock || 0) + quantity;
    restockData.newStock = newStock;

    const { data, error } = await supabase
      .from('products')
      .update({ 
        stock: newStock,
        ...(costPrice && { cost_price: costPrice })
      })
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    
    const queueId = await offlineQueue.enqueue('restock', 'update', restockData);
    return { 
      success: true, 
      data: { id: queueId, queued: true },
      message: 'Restock queued due to connection issue'
    };
  }
}

// Customer creation with offline support
export async function createCustomerOfflineAware(customerData: any) {
  if (!isOnline()) {
    const queueId = await offlineQueue.enqueue('customer', 'create', customerData);
    return { 
      success: true, 
      data: { id: queueId, queued: true },
      message: 'Customer queued for sync when online'
    };
  }

  try {
    const { data, error } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    
    const queueId = await offlineQueue.enqueue('customer', 'create', customerData);
    return { 
      success: true, 
      data: { id: queueId, queued: true },
      message: 'Customer queued due to connection issue'
    };
  }
}

// Customer payment with offline support
export async function recordPaymentOfflineAware(customerId: number, amount: number, newBalance: number) {
  const paymentData = {
    customerId,
    amount,
    newBalance,
  };

  if (!isOnline()) {
    const queueId = await offlineQueue.enqueue('payment', 'update', paymentData);
    return { 
      success: true, 
      data: { id: queueId, queued: true },
      message: 'Payment queued for sync when online'
    };
  }

  try {
    const { data, error } = await supabase
      .from('customers')
      .update({ balance: newBalance })
      .eq('id', customerId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    
    const queueId = await offlineQueue.enqueue('payment', 'update', paymentData);
    return { 
      success: true, 
      data: { id: queueId, queued: true },
      message: 'Payment queued due to connection issue'
    };
  }
}

// Check online status
export function getConnectionStatus() {
  return {
    isOnline: isOnline(),
    queueLength: offlineQueue.getQueueLength(),
    hasQueuedOperations: offlineQueue.getQueueLength() > 0
  };
}