/**
 * Robust Offline Queue System
 * Handles offline operations using IndexedDB with automatic sync
 */

import localforage from 'localforage';

interface QueuedOperation {
  id: string;
  type: 'sale' | 'restock' | 'customer' | 'payment';
  operation: string; // 'create', 'update', 'delete'
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

const QUEUE_KEY = 'dukafiti_offline_queue';
const MAX_RETRIES = 3;

// Configure localforage for offline queue
const offlineStore = localforage.createInstance({
  name: 'DukaFiti',
  storeName: 'offline_queue'
});

class OfflineQueue {
  private queue: QueuedOperation[] = [];
  private isProcessing = false;
  private listeners: Array<(queue: QueuedOperation[]) => void> = [];

  constructor() {
    this.loadQueue();
    this.setupOnlineListener();
  }

  // Load queue from IndexedDB on initialization
  private async loadQueue() {
    try {
      const stored = await offlineStore.getItem<QueuedOperation[]>(QUEUE_KEY);
      this.queue = stored || [];
      this.notifyListeners();
    } catch (error) {
      
      this.queue = [];
    }
  }

  // Save queue to IndexedDB
  private async saveQueue() {
    try {
      await offlineStore.setItem(QUEUE_KEY, this.queue);
      this.notifyListeners();
    } catch (error) {
      
    }
  }

  // Add operation to queue
  async enqueue(
    type: QueuedOperation['type'],
    operation: QueuedOperation['operation'],
    data: any
  ): Promise<string> {
    const id = `${type}_${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const queuedOp: QueuedOperation = {
      id,
      type,
      operation,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: MAX_RETRIES
    };

    this.queue.push(queuedOp);
    await this.saveQueue();
    
    
    return id;
  }

  // Get current queue
  getQueue(): QueuedOperation[] {
    return [...this.queue];
  }

  // Get queue length
  getQueueLength(): number {
    return this.queue.length;
  }

  // Clear entire queue
  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
    
  }

  // Remove specific operation from queue
  async removeFromQueue(id: string): Promise<void> {
    this.queue = this.queue.filter(op => op.id !== id);
    await this.saveQueue();
  }

  // Process queue when online
  async processQueue(): Promise<void> {
    if (this.isProcessing || !navigator.onLine || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    

    const operations = [...this.queue];
    let successCount = 0;
    let failureCount = 0;

    for (const operation of operations) {
      try {
        const success = await this.executeOperation(operation);
        
        if (success) {
          await this.removeFromQueue(operation.id);
          successCount++;
        } else {
          operation.retryCount++;
          if (operation.retryCount >= operation.maxRetries) {
            
            await this.removeFromQueue(operation.id);
            failureCount++;
          }
        }
      } catch (error) {
        
        operation.retryCount++;
        if (operation.retryCount >= operation.maxRetries) {
          await this.removeFromQueue(operation.id);
          failureCount++;
        }
      }
    }

    this.isProcessing = false;
    await this.saveQueue();

    
    
    // Emit sync completion event
    window.dispatchEvent(new CustomEvent('offline-sync-complete', {
      detail: { successCount, failureCount, remainingCount: this.queue.length }
    }));
  }

  // Execute a specific operation
  private async executeOperation(operation: QueuedOperation): Promise<boolean> {
    const { supabase } = await import('@/lib/supabase');

    try {
      switch (operation.type) {
        case 'sale':
          return await this.executeSaleOperation(operation);
        case 'restock':
          return await this.executeRestockOperation(operation);
        case 'customer':
          return await this.executeCustomerOperation(operation);
        case 'payment':
          return await this.executePaymentOperation(operation);
        default:
          
          return false;
      }
    } catch (error) {
      
      return false;
    }
  }

  private async executeSaleOperation(operation: QueuedOperation): Promise<boolean> {
    const { supabase } = await import('@/lib/supabase');
    const { data, error } = await supabase.rpc('create_sale_with_items', operation.data);
    return !error;
  }

  private async executeRestockOperation(operation: QueuedOperation): Promise<boolean> {
    const { supabase } = await import('@/lib/supabase');
    const { data, error } = await supabase
      .from('products')
      .update({ 
        stock: operation.data.newStock,
        cost_price: operation.data.costPrice 
      })
      .eq('id', operation.data.productId);
    return !error;
  }

  private async executeCustomerOperation(operation: QueuedOperation): Promise<boolean> {
    const { supabase } = await import('@/lib/supabase');
    
    if (operation.operation === 'create') {
      const { data, error } = await supabase
        .from('customers')
        .insert(operation.data);
      return !error;
    } else if (operation.operation === 'update') {
      const { data, error } = await supabase
        .from('customers')
        .update(operation.data.updates)
        .eq('id', operation.data.id);
      return !error;
    }
    
    return false;
  }

  private async executePaymentOperation(operation: QueuedOperation): Promise<boolean> {
    const { supabase } = await import('@/lib/supabase');
    const { data, error } = await supabase
      .from('customers')
      .update({ balance: operation.data.newBalance })
      .eq('id', operation.data.customerId);
    return !error;
  }

  // Set up automatic processing when online
  private setupOnlineListener() {
    window.addEventListener('online', () => {
      
      setTimeout(() => this.processQueue(), 1000); // Small delay to ensure connection is stable
    });
  }

  // Subscribe to queue changes
  subscribe(listener: (queue: QueuedOperation[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners of queue changes
  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.queue]));
  }
}

// Export singleton instance
export const offlineQueue = new OfflineQueue();

// Utility functions
export function isOnline(): boolean {
  return navigator.onLine;
}

export async function enqueueOperation(
  type: QueuedOperation['type'],
  operation: QueuedOperation['operation'],
  data: any
): Promise<string> {
  return offlineQueue.enqueue(type, operation, data);
}

export function getQueueLength(): number {
  return offlineQueue.getQueueLength();
}

export async function syncOfflineQueue(): Promise<void> {
  return offlineQueue.processQueue();
}