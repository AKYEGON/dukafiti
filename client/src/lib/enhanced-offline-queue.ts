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
        
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store for queued actions
        if (!db.objectStoreNames.contains(this.actionStoreName)) {
          const store = db.createObjectStore(this.actionStoreName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          
        }

        // Create object store for cached data
        if (!db.objectStoreNames.contains(this.cacheStoreName)) {
          const store = db.createObjectStore(this.cacheStoreName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          
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
        
        resolve(action.id);
      };

      request.onerror = () => {
        
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
        
        resolve();
      };

      request.onerror = () => {
        
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
        
        resolve();
      };

      request.onerror = () => {
        
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
            
            resolve(null);
          } else {
            
            resolve(result.data);
          }
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        
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
        
        resolve();
      };

      request.onerror = () => {
        
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
        
        resolve();
      };

      request.onerror = () => {
        
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
    
    onOnline?.();
    processQueuedActions();
  };

  const handleOffline = () => {
    
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
    
    return;
  }

  try {
    const queuedActions = await enhancedOfflineQueue.getQueuedActions();
    
    if (queuedActions.length === 0) {
      
      return;
    }

    

    for (const action of queuedActions) {
      try {
        if (action.retryCount >= action.maxRetries) {
          
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
          
          
          // Show success toast
          if (window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('offline-sync-success', {
              detail: { action }
            }));
          }
        } else {
          await enhancedOfflineQueue.incrementRetryCount(action.id);
          
          
          // Show error toast
          if (window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('offline-sync-error', {
              detail: { action, error: response.statusText }
            }));
          }
        }
      } catch (error) {
        await enhancedOfflineQueue.incrementRetryCount(action.id);
        
        
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
      
    } else {
      
    }
  } catch (error) {
    
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