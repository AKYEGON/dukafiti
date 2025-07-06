// DukaFiti Offline Database - IndexedDB Implementation
export interface OfflineProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number | null;
  category: string;
  description?: string;
  lastSync: Date;
  isDirty: boolean;
}

export interface OfflineCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  creditBalance: number;
  lastSync: Date;
  isDirty: boolean;
}

export interface OfflineOrder {
  id: string;
  customerId?: string;
  customerName?: string;
  items: OfflineOrderItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'credit' | 'mobile_money';
  status: 'pending' | 'synced' | 'failed';
  createdAt: Date;
  syncedAt?: Date;
  isDirty: boolean;
}

export interface OfflineOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface SyncQueueItem {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'product' | 'customer' | 'order' | 'payment';
  data: any;
  timestamp: Date;
  retryCount: number;
  status: 'pending' | 'syncing' | 'success' | 'failed';
}

class OfflineDatabase {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'dukafiti-offline';
  private readonly dbVersion = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Products store
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('name', 'name', { unique: false });
          productStore.createIndex('sku', 'sku', { unique: true });
          productStore.createIndex('category', 'category', { unique: false });
          productStore.createIndex('isDirty', 'isDirty', { unique: false });
        }

        // Customers store
        if (!db.objectStoreNames.contains('customers')) {
          const customerStore = db.createObjectStore('customers', { keyPath: 'id' });
          customerStore.createIndex('name', 'name', { unique: false });
          customerStore.createIndex('phone', 'phone', { unique: false });
          customerStore.createIndex('isDirty', 'isDirty', { unique: false });
        }

        // Orders store
        if (!db.objectStoreNames.contains('orders')) {
          const orderStore = db.createObjectStore('orders', { keyPath: 'id' });
          orderStore.createIndex('customerId', 'customerId', { unique: false });
          orderStore.createIndex('createdAt', 'createdAt', { unique: false });
          orderStore.createIndex('status', 'status', { unique: false });
          orderStore.createIndex('isDirty', 'isDirty', { unique: false });
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('entity', 'entity', { unique: false });
          syncStore.createIndex('status', 'status', { unique: false });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // Products operations
  async getProducts(): Promise<OfflineProduct[]> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['products'], 'readonly');
    const store = transaction.objectStore('products');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getProduct(id: string): Promise<OfflineProduct | null> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['products'], 'readonly');
    const store = transaction.objectStore('products');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async saveProduct(product: OfflineProduct): Promise<void> {
    if (!this.db) await this.init();
    product.isDirty = true;
    product.lastSync = new Date();
    
    const transaction = this.db!.transaction(['products'], 'readwrite');
    const store = transaction.objectStore('products');
    
    return new Promise((resolve, reject) => {
      const request = store.put(product);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteProduct(id: string): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['products'], 'readwrite');
    const store = transaction.objectStore('products');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async searchProducts(query: string): Promise<OfflineProduct[]> {
    const products = await this.getProducts();
    const searchTerm = query.toLowerCase();
    
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm) ||
      product.sku.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm) ||
      (product.description && product.description.toLowerCase().includes(searchTerm))
    );
  }

  // Customers operations
  async getCustomers(): Promise<OfflineCustomer[]> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['customers'], 'readonly');
    const store = transaction.objectStore('customers');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getCustomer(id: string): Promise<OfflineCustomer | null> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['customers'], 'readonly');
    const store = transaction.objectStore('customers');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async saveCustomer(customer: OfflineCustomer): Promise<void> {
    if (!this.db) await this.init();
    customer.isDirty = true;
    customer.lastSync = new Date();
    
    const transaction = this.db!.transaction(['customers'], 'readwrite');
    const store = transaction.objectStore('customers');
    
    return new Promise((resolve, reject) => {
      const request = store.put(customer);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteCustomer(id: string): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['customers'], 'readwrite');
    const store = transaction.objectStore('customers');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Orders operations
  async getOrders(): Promise<OfflineOrder[]> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['orders'], 'readonly');
    const store = transaction.objectStore('orders');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveOrder(order: OfflineOrder): Promise<void> {
    if (!this.db) await this.init();
    order.isDirty = true;
    if (!order.createdAt) order.createdAt = new Date();
    
    const transaction = this.db!.transaction(['orders'], 'readwrite');
    const store = transaction.objectStore('orders');
    
    return new Promise((resolve, reject) => {
      const request = store.put(order);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Sync queue operations
  async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount' | 'status'>): Promise<void> {
    if (!this.db) await this.init();
    
    const queueItem: SyncQueueItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
      timestamp: new Date(),
      retryCount: 0,
      status: 'pending'
    };
    
    const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    
    return new Promise((resolve, reject) => {
      const request = store.put(queueItem);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['syncQueue'], 'readonly');
    const store = transaction.objectStore('syncQueue');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateSyncQueueItem(item: SyncQueueItem): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    
    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearSyncQueue(): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Bulk operations for initial sync
  async bulkUpdateProducts(products: OfflineProduct[]): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['products'], 'readwrite');
    const store = transaction.objectStore('products');
    
    return new Promise((resolve, reject) => {
      let pending = products.length;
      
      if (pending === 0) {
        resolve();
        return;
      }
      
      products.forEach(product => {
        product.isDirty = false; // Mark as synced
        const request = store.put(product);
        request.onsuccess = () => {
          pending--;
          if (pending === 0) resolve();
        };
        request.onerror = () => reject(request.error);
      });
    });
  }

  async bulkUpdateCustomers(customers: OfflineCustomer[]): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['customers'], 'readwrite');
    const store = transaction.objectStore('customers');
    
    return new Promise((resolve, reject) => {
      let pending = customers.length;
      
      if (pending === 0) {
        resolve();
        return;
      }
      
      customers.forEach(customer => {
        customer.isDirty = false; // Mark as synced
        const request = store.put(customer);
        request.onsuccess = () => {
          pending--;
          if (pending === 0) resolve();
        };
        request.onerror = () => reject(request.error);
      });
    });
  }

  // Statistics for dashboard
  async getOfflineStats() {
    const [products, customers, orders, syncQueue] = await Promise.all([
      this.getProducts(),
      this.getCustomers(),
      this.getOrders(),
      this.getSyncQueue()
    ]);

    const pendingSync = syncQueue.filter(item => item.status === 'pending').length;
    const lowStockProducts = products.filter(p => p.stock !== null && p.stock < 10).length;
    const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    return {
      productsCount: products.length,
      customersCount: customers.length,
      ordersCount: orders.length,
      pendingSyncCount: pendingSync,
      lowStockCount: lowStockProducts,
      totalSales
    };
  }
}

export const offlineDB = new OfflineDatabase();