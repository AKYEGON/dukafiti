// DukaFiti Offline Data Manager - Offline-First Architecture
import { offlineDB, OfflineProduct, OfflineCustomer, OfflineOrder, OfflineOrderItem } from './offline-db';
import * as supabaseData from './supabase-data';
import { toast } from '@/hooks/use-toast';

export interface SyncResult {
  success: boolean;
  syncedItems: number;
  errors: string[];
}

export interface Conflict {
  id: string;
  type: 'product' | 'customer' | 'order';
  localData: any;
  serverData: any;
  field: string;
}

class OfflineDataManager {
  private isOnline = navigator.onLine;
  private syncInProgress = false;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Initialize offline database
    this.initializeOfflineDB();
  }

  private async initializeOfflineDB() {
    try {
      await offlineDB.init();
      
      
      // Perform initial sync if online
      if (this.isOnline) {
        await this.performInitialSync();
      }
    } catch (error) {
      
    }
  }

  private handleOnline() {
    
    this.isOnline = true;
    toast({
      title: "Back Online",
      description: "Syncing your data...",
      duration: 3000
    });
    this.syncWithServer();
  }

  private handleOffline() {
    
    this.isOnline = false;
    toast({
      title: "Working Offline",
      description: "Your changes will sync when connection is restored",
      duration: 5000
    });
  }

  // Products Management
  async getProducts(): Promise<OfflineProduct[]> {
    try {
      if (this.isOnline) {
        // Try to get fresh data from server
        const serverProducts = await supabaseData.getProducts();
        if (serverProducts && serverProducts.length > 0) {
          // Convert to offline format and cache
          const offlineProducts: OfflineProduct[] = serverProducts.map(product => ({
            id: product.id,
            name: product.name,
            sku: product.sku,
            price: product.price,
            stock: product.stock,
            category: product.category || 'Uncategorized',
            description: product.description,
            lastSync: new Date(),
            isDirty: false
          }));
          
          await offlineDB.bulkUpdateProducts(offlineProducts);
          return offlineProducts;
        }
      }
    } catch (error) {
      
    }

    // Fallback to offline data
    return await offlineDB.getProducts();
  }

  async createProduct(product: Omit<OfflineProduct, 'id' | 'lastSync' | 'isDirty'>): Promise<OfflineProduct> {
    const newProduct: OfflineProduct = {
      ...product,
      id: `offline-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      lastSync: new Date(),
      isDirty: true
    };

    // Always save locally first
    await offlineDB.saveProduct(newProduct);

    // Queue for sync if offline
    if (!this.isOnline) {
      await offlineDB.addToSyncQueue({
        action: 'CREATE',
        entity: 'product',
        data: newProduct
      });
      
      toast({
        title: "Product Added",
        description: "Will sync when back online",
        duration: 3000
      });
    } else {
      // Try to sync immediately if online
      try {
        await supabaseData.createProduct(product);
        newProduct.isDirty = false;
        await offlineDB.saveProduct(newProduct);
        
        toast({
          title: "Product Added",
          description: "Synced successfully",
          duration: 3000
        });
      } catch (error) {
        
        await offlineDB.addToSyncQueue({
          action: 'CREATE',
          entity: 'product',
          data: newProduct
        });
      }
    }

    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<OfflineProduct>): Promise<OfflineProduct> {
    const existingProduct = await offlineDB.getProduct(id);
    if (!existingProduct) {
      throw new Error('Product not found');
    }

    const updatedProduct: OfflineProduct = {
      ...existingProduct,
      ...updates,
      id,
      lastSync: new Date(),
      isDirty: true
    };

    // Always save locally first
    await offlineDB.saveProduct(updatedProduct);

    // Queue for sync if offline
    if (!this.isOnline) {
      await offlineDB.addToSyncQueue({
        action: 'UPDATE',
        entity: 'product',
        data: updatedProduct
      });
    } else {
      // Try to sync immediately if online
      try {
        await supabaseData.updateProduct(id, updates);
        updatedProduct.isDirty = false;
        await offlineDB.saveProduct(updatedProduct);
      } catch (error) {
        
        await offlineDB.addToSyncQueue({
          action: 'UPDATE',
          entity: 'product',
          data: updatedProduct
        });
      }
    }

    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    // Always delete locally first
    await offlineDB.deleteProduct(id);

    // Queue for sync if offline
    if (!this.isOnline) {
      await offlineDB.addToSyncQueue({
        action: 'DELETE',
        entity: 'product',
        data: { id }
      });
      
      toast({
        title: "Product Deleted",
        description: "Will sync when back online",
        duration: 3000
      });
    } else {
      // Try to sync immediately if online
      try {
        await supabaseData.deleteProduct(id);
        
        toast({
          title: "Product Deleted",
          description: "Synced successfully",
          duration: 3000
        });
      } catch (error) {
        
        await offlineDB.addToSyncQueue({
          action: 'DELETE',
          entity: 'product',
          data: { id }
        });
      }
    }

    return true;
  }

  async searchProducts(query: string): Promise<OfflineProduct[]> {
    return await offlineDB.searchProducts(query);
  }

  // Customers Management
  async getCustomers(): Promise<OfflineCustomer[]> {
    try {
      if (this.isOnline) {
        const serverCustomers = await supabaseData.getCustomers();
        if (serverCustomers && serverCustomers.length > 0) {
          const offlineCustomers: OfflineCustomer[] = serverCustomers.map(customer => ({
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            address: customer.address,
            creditBalance: customer.creditBalance || 0,
            lastSync: new Date(),
            isDirty: false
          }));
          
          await offlineDB.bulkUpdateCustomers(offlineCustomers);
          return offlineCustomers;
        }
      }
    } catch (error) {
      
    }

    return await offlineDB.getCustomers();
  }

  async createCustomer(customer: Omit<OfflineCustomer, 'id' | 'lastSync' | 'isDirty'>): Promise<OfflineCustomer> {
    const newCustomer: OfflineCustomer = {
      ...customer,
      id: `offline-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      lastSync: new Date(),
      isDirty: true
    };

    await offlineDB.saveCustomer(newCustomer);

    if (!this.isOnline) {
      await offlineDB.addToSyncQueue({
        action: 'CREATE',
        entity: 'customer',
        data: newCustomer
      });
    } else {
      try {
        await supabaseData.createCustomer(customer);
        newCustomer.isDirty = false;
        await offlineDB.saveCustomer(newCustomer);
      } catch (error) {
        
        await offlineDB.addToSyncQueue({
          action: 'CREATE',
          entity: 'customer',
          data: newCustomer
        });
      }
    }

    return newCustomer;
  }

  // Sales Management
  async createSale(saleData: {
    items: Array<{ productId: string; quantity: number; price: number }>;
    paymentMethod: 'cash' | 'credit' | 'mobile_money';
    customerId?: string;
    customerName?: string;
  }): Promise<OfflineOrder> {
    // Get product details for order items
    const orderItems: OfflineOrderItem[] = [];
    let totalAmount = 0;

    for (const item of saleData.items) {
      const product = await offlineDB.getProduct(item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      // Check stock if not unknown quantity
      if (product.stock !== null && product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      const orderItem: OfflineOrderItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2)}`,
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price
      };

      orderItems.push(orderItem);
      totalAmount += orderItem.total;

      // Update stock locally if not unknown quantity
      if (product.stock !== null) {
        product.stock -= item.quantity;
        product.isDirty = true;
        await offlineDB.saveProduct(product);
      }
    }

    // Create order
    const newOrder: OfflineOrder = {
      id: `order-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      customerId: saleData.customerId,
      customerName: saleData.customerName,
      items: orderItems,
      totalAmount,
      paymentMethod: saleData.paymentMethod,
      status: 'pending',
      createdAt: new Date(),
      isDirty: true
    };

    await offlineDB.saveOrder(newOrder);

    // Update customer credit if credit sale
    if (saleData.paymentMethod === 'credit' && saleData.customerId) {
      const customer = await offlineDB.getCustomer(saleData.customerId);
      if (customer) {
        customer.creditBalance += totalAmount;
        customer.isDirty = true;
        await offlineDB.saveCustomer(customer);
      }
    }

    // Queue for sync
    if (!this.isOnline) {
      await offlineDB.addToSyncQueue({
        action: 'CREATE',
        entity: 'order',
        data: newOrder
      });
      
      toast({
        title: "Sale Recorded",
        description: "Will sync when back online",
        duration: 3000
      });
    } else {
      // Try to sync immediately if online
      try {
        await supabaseData.createOrder({
          items: saleData.items,
          paymentMethod: saleData.paymentMethod,
          customerId: saleData.customerId,
          customerName: saleData.customerName
        });
        
        newOrder.status = 'synced';
        newOrder.isDirty = false;
        newOrder.syncedAt = new Date();
        await offlineDB.saveOrder(newOrder);
        
        toast({
          title: "Sale Completed",
          description: "Synced successfully",
          duration: 3000
        });
      } catch (error) {
        
        await offlineDB.addToSyncQueue({
          action: 'CREATE',
          entity: 'order',
          data: newOrder
        });
      }
    }

    return newOrder;
  }

  // Sync operations
  async syncWithServer(): Promise<SyncResult> {
    if (this.syncInProgress || !this.isOnline) {
      return { success: false, syncedItems: 0, errors: ['Sync already in progress or offline'] };
    }

    this.syncInProgress = true;
    const errors: string[] = [];
    let syncedItems = 0;

    try {
      
      
      // Get pending sync items
      const syncQueue = await offlineDB.getSyncQueue();
      const pendingItems = syncQueue.filter(item => item.status === 'pending');

      

      for (const item of pendingItems) {
        try {
          await this.processSyncItem(item);
          await offlineDB.removeSyncQueueItem(item.id);
          syncedItems++;
        } catch (error) {
          
          errors.push(`Failed to sync ${item.entity} ${item.action}: ${error}`);
          
          // Update retry count
          item.retryCount++;
          if (item.retryCount >= 3) {
            item.status = 'failed';
          }
          await offlineDB.updateSyncQueueItem(item);
        }
      }

      // Perform initial sync to get latest data
      await this.performInitialSync();

      
      
      if (syncedItems > 0) {
        toast({
          title: "Sync Complete",
          description: `${syncedItems} items synced successfully`,
          duration: 5000
        });
      }

    } catch (error) {
      
      errors.push(`Sync failed: ${error}`);
    } finally {
      this.syncInProgress = false;
    }

    return { success: errors.length === 0, syncedItems, errors };
  }

  private async processSyncItem(item: any): Promise<void> {
    switch (item.entity) {
      case 'product':
        if (item.action === 'CREATE') {
          await supabaseData.createProduct(item.data);
        } else if (item.action === 'UPDATE') {
          await supabaseData.updateProduct(item.data.id, item.data);
        } else if (item.action === 'DELETE') {
          await supabaseData.deleteProduct(item.data.id);
        }
        break;
        
      case 'customer':
        if (item.action === 'CREATE') {
          await supabaseData.createCustomer(item.data);
        } else if (item.action === 'UPDATE') {
          await supabaseData.updateCustomer(item.data.id, item.data);
        } else if (item.action === 'DELETE') {
          await supabaseData.deleteCustomer(item.data.id);
        }
        break;
        
      case 'order':
        if (item.action === 'CREATE') {
          await supabaseData.createOrder({
            items: item.data.items.map((orderItem: OfflineOrderItem) => ({
              productId: orderItem.productId,
              quantity: orderItem.quantity,
              price: orderItem.price
            })),
            paymentMethod: item.data.paymentMethod,
            customerId: item.data.customerId,
            customerName: item.data.customerName
          });
        }
        break;
    }
  }

  private async performInitialSync(): Promise<void> {
    try {
      
      
      // Sync products
      const products = await supabaseData.getProducts();
      if (products && products.length > 0) {
        const offlineProducts: OfflineProduct[] = products.map(product => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          stock: product.stock,
          category: product.category || 'Uncategorized',
          description: product.description,
          lastSync: new Date(),
          isDirty: false
        }));
        await offlineDB.bulkUpdateProducts(offlineProducts);
      }

      // Sync customers
      const customers = await supabaseData.getCustomers();
      if (customers && customers.length > 0) {
        const offlineCustomers: OfflineCustomer[] = customers.map(customer => ({
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          creditBalance: customer.creditBalance || 0,
          lastSync: new Date(),
          isDirty: false
        }));
        await offlineDB.bulkUpdateCustomers(offlineCustomers);
      }

      
    } catch (error) {
      
    }
  }

  // Utility methods
  async getSyncQueueStatus() {
    const syncQueue = await offlineDB.getSyncQueue();
    return {
      pending: syncQueue.filter(item => item.status === 'pending').length,
      failed: syncQueue.filter(item => item.status === 'failed').length,
      total: syncQueue.length
    };
  }

  async getOfflineStats() {
    return await offlineDB.getOfflineStats();
  }

  async forceSyncNow(): Promise<SyncResult> {
    return this.syncWithServer();
  }

  isOffline(): boolean {
    return !this.isOnline;
  }
}

export const offlineManager = new OfflineDataManager();