// Offline sales queue management using IndexedDB
export interface PendingSale {
  id: string;
  timestamp: number;
  items: Array<{
    productId: number;
    quantity: number;
    price: string;
  }>;
  paymentType: 'cash' | 'credit' | 'mobileMoney';
  reference?: string;
  customerName?: string;
  customerPhone?: string;
}

class OfflineQueue {
  private dbName = 'DukaFitiOffline';
  private dbVersion = 1;
  private storeName = 'pendingSales';
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('IndexedDB failed to open:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store for pending sales
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('IndexedDB object store created');
        }
      };
    });
  }

  async queueSale(sale: Omit<PendingSale, 'id' | 'timestamp'>): Promise<string> {
    if (!this.db) {
      await this.init();
    }

    const pendingSale: PendingSale = {
      ...sale,
      id: `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.add(pendingSale);

      request.onsuccess = () => {
        console.log('Sale queued offline:', pendingSale.id);
        resolve(pendingSale.id);
      };

      request.onerror = () => {
        console.error('Failed to queue sale:', request.error);
        reject(request.error);
      };
    });
  }

  async getPendingSales(): Promise<PendingSale[]> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const sales = request.result.sort((a, b) => a.timestamp - b.timestamp);
        resolve(sales);
      };

      request.onerror = () => {
        console.error('Failed to get pending sales:', request.error);
        reject(request.error);
      };
    });
  }

  async removeSale(saleId: string): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(saleId);

      request.onsuccess = () => {
        console.log('Sale removed from queue:', saleId);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to remove sale:', request.error);
        reject(request.error);
      };
    });
  }

  async getQueueCount(): Promise<number> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.count();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Failed to count pending sales:', request.error);
        reject(request.error);
      };
    });
  }

  async clearQueue(): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('Offline queue cleared');
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to clear queue:', request.error);
        reject(request.error);
      };
    });
  }
}

export const offlineQueue = new OfflineQueue();

// Network status utilities
export function isOnline(): boolean {
  return navigator.onLine;
}

export function setupNetworkListeners(
  onOnline?: () => void,
  onOffline?: () => void
): () => void {
  const handleOnline = () => {
    console.log('Network: Back online');
    onOnline?.();
  };

  const handleOffline = () => {
    console.log('Network: Gone offline');
    onOffline?.();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// Process pending sales when back online
export async function processPendingSales(): Promise<void> {
  if (!isOnline()) {
    console.log('Cannot process pending sales: still offline');
    return;
  }

  try {
    const pendingSales = await offlineQueue.getPendingSales();
    
    if (pendingSales.length === 0) {
      console.log('No pending sales to process');
      return;
    }

    console.log(`Processing ${pendingSales.length} pending sales...`);

    for (const sale of pendingSales) {
      try {
        // Convert to API format
        const apiPayload = {
          items: sale.items,
          paymentType: sale.paymentType,
          reference: sale.reference,
          customerName: sale.customerName,
          customerPhone: sale.customerPhone,
        };

        const response = await fetch('/api/sales', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(apiPayload),
        });

        if (response.ok) {
          await offlineQueue.removeSale(sale.id);
          console.log(`Successfully processed sale: ${sale.id}`);
        } else {
          console.error(`Failed to process sale ${sale.id}:`, response.statusText);
          // Leave the sale in the queue for retry
        }
      } catch (error) {
        console.error(`Error processing sale ${sale.id}:`, error);
        // Leave the sale in the queue for retry
      }
    }

    const remainingCount = await offlineQueue.getQueueCount();
    if (remainingCount > 0) {
      console.log(`${remainingCount} sales remain in queue after processing`);
    } else {
      console.log('All pending sales processed successfully');
    }
  } catch (error) {
    console.error('Error processing pending sales:', error);
  }
}