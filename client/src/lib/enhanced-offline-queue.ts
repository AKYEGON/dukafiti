// Enhanced offline queue management supporting all CRUD operations
export interface QueuedAction {
  id: string;
  timestamp: number;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers: Record<string, string>;
  body: string;
  type: 'sale' | 'inventory' | 'customer' | 'other';
  description: string;
  retryCount: number;
  maxRetries: number;
}

export interface CachedData {
  key: string;
  data: any;
  timestamp: number;
  expires?: number;
}

class EnhancedOfflineQueue {
  private dbName = 'DukaFitiEnhancedOffline';
  private dbVersion = 3;
  private actionStoreName = 'queuedActions';
  private cacheStoreName = 'dataCache';
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Enhanced IndexedDB failed to open:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('Enhanced IndexedDB opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store for queued actions
        if (!db.objectStoreNames.contains(this.actionStoreName)) {
          const store = db.createObjectStore(this.actionStoreName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          console.log('Enhanced IndexedDB action store created');
        }

        // Create object store for cached data
        if (!db.objectStoreNames.contains(this.cacheStoreName)) {
          const store = db.createObjectStore(this.cacheStoreName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('Enhanced IndexedDB cache store created');
        }
      };
    });
  }

  async queueAction(
    url: string,
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    body: any,
    type: 'sale' | 'inventory' | 'customer' | 'other' = 'other',
    description: string = `${method} ${url}`,
    headers: Record<string, string> = { 'Content-Type': 'application/json' }
  ): Promise<string> {
    if (!this.db) {
      await this.init();
    }

    const action: QueuedAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      url,
      method,
      headers,
      body: JSON.stringify(body),
      type,
      description,
      retryCount: 0,
      maxRetries: 3,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.actionStoreName], 'readwrite');
      const store = transaction.objectStore(this.actionStoreName);
      const request = store.add(action);

      request.onsuccess = () => {
        console.log('Action queued offline:', action.id, action.description);
        resolve(action.id);
      };

      request.onerror = () => {
        console.error('Failed to queue action:', request.error);
        reject(request.error);
      };
    });
  }

  async getQueuedActions(): Promise<QueuedAction[]> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.actionStoreName], 'readonly');
      const store = transaction.objectStore(this.actionStoreName);
      const request = store.getAll();

      request.onsuccess = () => {
        const actions = request.result.sort((a, b) => a.timestamp - b.timestamp);
        resolve(actions);
      };

      request.onerror = () => {
        console.error('Failed to get queued actions:', request.error);
        reject(request.error);
      };
    });
  }

  async removeAction(actionId: string): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.actionStoreName], 'readwrite');
      const store = transaction.objectStore(this.actionStoreName);
      const request = store.delete(actionId);

      request.onsuccess = () => {
        console.log('Action removed from queue:', actionId);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to remove action:', request.error);
        reject(request.error);
      };
    });
  }

  async incrementRetryCount(actionId: string): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.actionStoreName], 'readwrite');
      const store = transaction.objectStore(this.actionStoreName);
      const getRequest = store.get(actionId);

      getRequest.onsuccess = () => {
        const action = getRequest.result;
        if (action) {
          action.retryCount += 1;
          const putRequest = store.put(action);
          
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve(); // Action doesn't exist, nothing to update
        }
      };

      getRequest.onerror = () => {
        console.error('Failed to increment retry count:', getRequest.error);
        reject(getRequest.error);
      };
    });
  }

  async getQueueCount(): Promise<number> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.actionStoreName], 'readonly');
      const store = transaction.objectStore(this.actionStoreName);
      const request = store.count();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Failed to count queued actions:', request.error);
        reject(request.error);
      };
    });
  }

  // Data caching functionality
  async cacheData(key: string, data: any, expiresInMinutes?: number): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    const cachedData: CachedData = {
      key,
      data,
      timestamp: Date.now(),
      expires: expiresInMinutes ? Date.now() + (expiresInMinutes * 60 * 1000) : undefined,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.cacheStoreName], 'readwrite');
      const store = transaction.objectStore(this.cacheStoreName);
      const request = store.put(cachedData);

      request.onsuccess = () => {
        console.log('Data cached:', key);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to cache data:', request.error);
        reject(request.error);
      };
    });
  }

  async getCachedData(key: string): Promise<any> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.cacheStoreName], 'readonly');
      const store = transaction.objectStore(this.cacheStoreName);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Check if data has expired
          if (result.expires && Date.now() > result.expires) {
            console.log('Cached data expired:', key);
            resolve(null);
          } else {
            console.log('Serving cached data:', key);
            resolve(result.data);
          }
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('Failed to get cached data:', request.error);
        reject(request.error);
      };
    });
  }

  async clearCache(): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.cacheStoreName], 'readwrite');
      const store = transaction.objectStore(this.cacheStoreName);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('Data cache cleared');
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to clear cache:', request.error);
        reject(request.error);
      };
    });
  }

  async clearActionQueue(): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.actionStoreName], 'readwrite');
      const store = transaction.objectStore(this.actionStoreName);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('Action queue cleared');
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to clear action queue:', request.error);
        reject(request.error);
      };
    });
  }
}

export const enhancedOfflineQueue = new EnhancedOfflineQueue();

// Enhanced network utilities
export function isOnline(): boolean {
  return navigator.onLine;
}

export function setupNetworkListeners(
  onOnline?: () => void,
  onOffline?: () => void
): () => void {
  const handleOnline = () => {
    console.log('Network: Back online - processing queued actions');
    onOnline?.();
    processQueuedActions();
  };

  const handleOffline = () => {
    console.log('Network: Gone offline - future actions will be queued');
    onOffline?.();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// Process all queued actions when back online
export async function processQueuedActions(): Promise<void> {
  if (!isOnline()) {
    console.log('Cannot process queued actions: still offline');
    return;
  }

  try {
    const queuedActions = await enhancedOfflineQueue.getQueuedActions();
    
    if (queuedActions.length === 0) {
      console.log('No queued actions to process');
      return;
    }

    console.log(`Processing ${queuedActions.length} queued actions...`);

    for (const action of queuedActions) {
      try {
        if (action.retryCount >= action.maxRetries) {
          console.warn(`Action ${action.id} exceeded max retries, removing from queue`);
          await enhancedOfflineQueue.removeAction(action.id);
          continue;
        }

        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body,
        });

        if (response.ok) {
          await enhancedOfflineQueue.removeAction(action.id);
          console.log(`Successfully processed action: ${action.description}`);
          
          // Show success toast
          if (window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('offline-sync-success', {
              detail: { action }
            }));
          }
        } else {
          await enhancedOfflineQueue.incrementRetryCount(action.id);
          console.error(`Failed to process action ${action.description}:`, response.statusText);
          
          // Show error toast
          if (window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('offline-sync-error', {
              detail: { action, error: response.statusText }
            }));
          }
        }
      } catch (error) {
        await enhancedOfflineQueue.incrementRetryCount(action.id);
        console.error(`Error processing action ${action.description}:`, error);
        
        // Show error toast
        if (window.dispatchEvent) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          window.dispatchEvent(new CustomEvent('offline-sync-error', {
            detail: { action, error: errorMessage }
          }));
        }
      }
    }

    const remainingCount = await enhancedOfflineQueue.getQueueCount();
    if (remainingCount > 0) {
      console.log(`${remainingCount} actions remain in queue after processing`);
    } else {
      console.log('All queued actions processed successfully');
    }
  } catch (error) {
    console.error('Error processing queued actions:', error);
  }
}

// Enhanced fetch wrapper that automatically queues requests when offline
export async function offlineCapableFetch(
  url: string,
  options: RequestInit = {},
  queueOptions?: {
    type?: 'sale' | 'inventory' | 'customer' | 'other';
    description?: string;
  }
): Promise<Response> {
  const method = (options.method || 'GET').toUpperCase();
  
  // For GET requests, try cache first when offline
  if (method === 'GET' && !isOnline()) {
    const cachedData = await enhancedOfflineQueue.getCachedData(url);
    if (cachedData) {
      return new Response(JSON.stringify(cachedData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Served-From-Cache': 'true',
        },
      });
    }
  }
  
  // For write operations when offline, queue them
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && !isOnline()) {
    const headers: Record<string, string> = {};
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (options.headers) {
      Object.assign(headers, options.headers);
    }
    
    const body = options.body || '';
    const bodyData = typeof body === 'string' ? JSON.parse(body || '{}') : body;
    
    await enhancedOfflineQueue.queueAction(
      url,
      method as any,
      bodyData,
      queueOptions?.type,
      queueOptions?.description,
      headers
    );
    
    // Show queued toast
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('action-queued', {
        detail: { 
          type: queueOptions?.type || 'other',
          description: queueOptions?.description || `${method} ${url}`
        }
      }));
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      queued: true, 
      message: 'Action queued for sync when online' 
    }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  // Otherwise, proceed with normal fetch
  try {
    const response = await fetch(url, options);
    
    // Cache successful GET responses
    if (method === 'GET' && response.ok) {
      const responseClone = response.clone();
      const data = await responseClone.json();
      await enhancedOfflineQueue.cacheData(url, data, 30); // Cache for 30 minutes
    }
    
    return response;
  } catch (error) {
    // If fetch fails and we have cached data for GET requests, return it
    if (method === 'GET') {
      const cachedData = await enhancedOfflineQueue.getCachedData(url);
      if (cachedData) {
        return new Response(JSON.stringify(cachedData), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Served-From-Cache': 'true',
          },
        });
      }
    }
    
    throw error;
  }
}