// DukaFiti Offline Store - Complete IndexedDB Queue Management

import localforage from 'localforage';
import { supabase } from './supabase';
import { toast } from '@/hooks/use-toast';

// Configure localforage
localforage.config({
  driver: localforage.INDEXEDDB,
  name: 'DukaFiti',
  storeName: 'offline_queue',
  version: 1.0,
  description: 'DukaFiti offline operations queue'
});

// Operation Types
export interface OfflineOperation {
  id: string;
  type: 'sale' | 'restock' | 'customer_create' | 'customer_update' | 'customer_delete' | 'product_create' | 'product_update' | 'product_delete';
  endpoint: string;
  payload: any;
  timestamp: number;
  retries: number;
  maxRetries: number;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  error?: string;
}

class OfflineStore {
  private queueKey = 'operation_queue';
  private syncInProgress = false;
  private maxRetries = 3;

  // Enqueue operation for offline processing
  async enqueue(operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retries' | 'status'>): Promise<string> {
    const op: OfflineOperation = {
      ...operation,
      id: this.generateId(),
      timestamp: Date.now(),
      retries: 0,
      status: 'pending'
    };

    try {
      const queue = await this.getQueue();
      queue.push(op);
      await localforage.setItem(this.queueKey, queue);
      
      console.log('📦 Operation queued:', op.type, op.id);
      
      // Show user feedback
      toast({
        title: 'Action Queued',
        description: `${this.getOperationLabel(op.type)} will sync when you're back online`,
        duration: 3000,
      });
      
      return op.id;
    } catch (error) {
      console.error('❌ Failed to enqueue operation:', error);
      throw error;
    }
  }

  // Get current queue
  async getQueue(): Promise<OfflineOperation[]> {
    try {
      const queue = await localforage.getItem<OfflineOperation[]>(this.queueKey);
      return queue || [];
    } catch (error) {
      console.error('❌ Failed to get queue:', error);
      return [];
    }
  }

  // Get pending operations count
  async getPendingCount(): Promise<number> {
    const queue = await this.getQueue();
    return queue.filter(op => op.status === 'pending').length;
  }

  // Clear completed operations
  async clearCompleted(): Promise<void> {
    const queue = await this.getQueue();
    const pendingQueue = queue.filter(op => op.status !== 'completed');
    await localforage.setItem(this.queueKey, pendingQueue);
  }

  // Clear entire queue
  async clearQueue(): Promise<void> {
    await localforage.setItem(this.queueKey, []);
  }

  // Sync queue with server
  async syncQueue(): Promise<{ success: number; failed: number; errors: string[] }> {
    if (this.syncInProgress) {
      console.log('⏳ Sync already in progress');
      return { success: 0, failed: 0, errors: ['Sync already in progress'] };
    }

    if (!navigator.onLine) {
      console.log('📴 Cannot sync - offline');
      toast({
        title: 'Sync Failed',
        description: 'No internet connection available',
        variant: 'destructive',
      });
      return { success: 0, failed: 0, errors: ['No internet connection'] };
    }

    this.syncInProgress = true;
    const queue = await this.getQueue();
    const pendingOps = queue.filter(op => op.status === 'pending');
    
    if (pendingOps.length === 0) {
      this.syncInProgress = false;
      return { success: 0, failed: 0, errors: [] };
    }

    console.log(`🔄 Syncing ${pendingOps.length} operations...`);
    
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const op of pendingOps) {
      try {
        // Update operation status
        op.status = 'syncing';
        await this.updateOperation(op);

        // Execute operation
        const result = await this.executeOperation(op);
        
        if (result.success) {
          op.status = 'completed';
          successCount++;
          console.log(`✅ Operation ${op.id} synced successfully`);
        } else {
          throw new Error(result.error || 'Operation failed');
        }
        
      } catch (error) {
        op.retries++;
        op.error = error instanceof Error ? error.message : 'Unknown error';
        
        if (op.retries >= this.maxRetries) {
          op.status = 'failed';
          failedCount++;
          errors.push(`${this.getOperationLabel(op.type)}: ${op.error}`);
          console.error(`❌ Operation ${op.id} failed after ${op.retries} retries:`, op.error);
        } else {
          op.status = 'pending';
          console.log(`⚠️ Operation ${op.id} failed, will retry (${op.retries}/${this.maxRetries})`);
        }
      }
      
      await this.updateOperation(op);
    }

    // Clean up completed operations
    await this.clearCompleted();
    
    this.syncInProgress = false;
    
    // Show sync results
    if (successCount > 0) {
      toast({
        title: 'Sync Successful',
        description: `${successCount} operation${successCount > 1 ? 's' : ''} synced successfully`,
      });
    }
    
    if (failedCount > 0) {
      toast({
        title: 'Sync Issues',
        description: `${failedCount} operation${failedCount > 1 ? 's' : ''} failed to sync`,
        variant: 'destructive',
      });
    }

    return { success: successCount, failed: failedCount, errors };
  }

  // Execute individual operation
  private async executeOperation(op: OfflineOperation): Promise<{ success: boolean; error?: string }> {
    try {
      switch (op.type) {
        case 'sale':
          return await this.executeSale(op);
        case 'restock':
          return await this.executeRestock(op);
        case 'customer_create':
          return await this.executeCustomerCreate(op);
        case 'customer_update':
          return await this.executeCustomerUpdate(op);
        case 'customer_delete':
          return await this.executeCustomerDelete(op);
        case 'product_create':
          return await this.executeProductCreate(op);
        case 'product_update':
          return await this.executeProductUpdate(op);
        case 'product_delete':
          return await this.executeProductDelete(op);
        default:
          throw new Error(`Unknown operation type: ${op.type}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Operation executors
  private async executeSale(op: OfflineOperation): Promise<{ success: boolean; error?: string }> {
    try {
      const { payload } = op;
      
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_id: payload.customerId,
          customer_name: payload.customerName,
          total: payload.total,
          status: 'completed',
          payment_method: payload.paymentMethod,
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = payload.items.map((item: any) => ({
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
      for (const item of payload.items) {
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

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sale sync failed'
      };
    }
  }

  private async executeRestock(op: OfflineOperation): Promise<{ success: boolean; error?: string }> {
    try {
      const { payload } = op;
      
      // Get current stock to calculate new stock
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', payload.productId)
        .single();

      if (fetchError) throw fetchError;

      const currentStock = product.stock || 0;
      const newStock = currentStock + payload.quantity;

      // Update product stock
      const { error } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', payload.productId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Restock sync failed'
      };
    }
  }

  private async executeCustomerCreate(op: OfflineOperation): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('customers')
        .insert([op.payload]);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Customer creation sync failed'
      };
    }
  }

  private async executeCustomerUpdate(op: OfflineOperation): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('customers')
        .update(op.payload.data)
        .eq('id', op.payload.id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Customer update sync failed'
      };
    }
  }

  private async executeCustomerDelete(op: OfflineOperation): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', op.payload.id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Customer deletion sync failed'
      };
    }
  }

  private async executeProductCreate(op: OfflineOperation): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('products')
        .insert([op.payload]);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Product creation sync failed'
      };
    }
  }

  private async executeProductUpdate(op: OfflineOperation): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('products')
        .update(op.payload.data)
        .eq('id', op.payload.id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Product update sync failed'
      };
    }
  }

  private async executeProductDelete(op: OfflineOperation): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', op.payload.id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Product deletion sync failed'
      };
    }
  }

  // Helper methods
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getOperationLabel(type: OfflineOperation['type']): string {
    const labels = {
      sale: 'Sale',
      restock: 'Stock Update',
      customer_create: 'Customer Creation',
      customer_update: 'Customer Update',
      customer_delete: 'Customer Deletion',
      product_create: 'Product Creation',
      product_update: 'Product Update',
      product_delete: 'Product Deletion'
    };
    return labels[type] || 'Operation';
  }

  private async updateOperation(op: OfflineOperation): Promise<void> {
    const queue = await this.getQueue();
    const index = queue.findIndex(item => item.id === op.id);
    if (index >= 0) {
      queue[index] = op;
      await localforage.setItem(this.queueKey, queue);
    }
  }

  // Check if operation should be queued
  shouldQueue(): boolean {
    return !navigator.onLine;
  }
}

export const offlineStore = new OfflineStore();