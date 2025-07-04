const CACHE_NAME = 'dukafiti-v4-enhanced-offline';
const API_CACHE_NAME = 'dukafiti-api-cache-v4';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  // Static assets will be cached automatically by Vite's build
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css'
];

// API routes to cache for offline use
const apiRoutesToCache = [
  '/api/products',
  '/api/customers',
  '/api/settings',
  '/api/dashboard/metrics',
  '/api/orders/recent',
  '/api/notifications',
  '/api/notifications/unread-count'
];

// Install event - cache all static assets and core API routes
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(urlsToCache)
      }),
      // Cache core API routes
      caches.open(API_CACHE_NAME).then((cache) => {
        return Promise.all(
          apiRoutesToCache.map((url) => {
            return fetch(url)
              .then((response) => {
                if (response.ok) {
                  return cache.put(url, response)
                }
              })
              .catch((error) => {
                console.warn(`Service Worker: Failed to cache API route ${url}:`, error)
              })
          })
        )
      })
    ])
      .then(() => {
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Install failed:', error)
      })
  )
});

// Handle skip waiting message and sync triggers
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  } else if (event.data && event.data.type === 'TRIGGER_SYNC') {
    syncQueuedActions()
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        return self.clients.claim()
      })
  )
});

// Fetch event - enhanced offline strategy
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  const url = new URL(event.request.url);

  // Handle API requests with network-first, cache-fallback strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(event.request));
    return
  }

  // Handle static assets with cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response
        }

        return fetch(event.request)
          .then((response) => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }

            // Clone the response before caching
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache)
              });

            return response
          })
          .catch((error) => {
            console.error('Service Worker: Fetch failed:', error);

            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html') || caches.match('/')
            }

            // For other requests, try to return cached version or fail gracefully
            return caches.match('/') || new Response('Offline', { status: 503 })
          })
      })
  )
});

// Enhanced API request handler
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const isReadOperation = request.method === 'GET';

  if (isReadOperation) {
    // For GET requests: try network first, then cache
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        // Cache successful responses
        const cache = await caches.open(API_CACHE_NAME);
        cache.put(request, networkResponse.clone());
        return networkResponse
      }
    } catch (error) {
      }

    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Add cache indicator header
      const response = cachedResponse.clone();
      response.headers.set('X-Served-From-Cache', 'true');
      return response
    }

    // Return offline indicator for failed API requests
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'This data is not available offline',
      cached: false
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  } else {
    // For write operations: check if offline and queue
    if (!navigator.onLine) {
      return queueOfflineAction(request)
    }

    // Otherwise, pass through to network
    return fetch(request)
  }
}

// Queue offline actions in IndexedDB
async function queueOfflineAction(request) {
  try {
    const body = await request.text();
    const action = {
      id: Date.now() + Math.random(),
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: body,
      timestamp: new Date().toISOString()
    };

    const db = await openDB();
    await addToQueue(db, action);

    // Notify clients about queued action
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'ACTION_QUEUED',
          action: action
        })
      })
    });

    return new Response(JSON.stringify({
      success: true,
      queued: true,
      message: 'Action queued for sync when online'
    }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Service Worker: Failed to queue action:', error);
    return new Response(JSON.stringify({
      error: 'Failed to queue action',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Enhanced IndexedDB helper functions for service worker
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DukaFitiOffline', 2);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Legacy sales store
      if (!db.objectStoreNames.contains('pendingSales')) {
        const store = db.createObjectStore('pendingSales', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }

      // Enhanced action queue for all operations
      if (!db.objectStoreNames.contains('actionQueue')) {
        const store = db.createObjectStore('actionQueue', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('type', 'type', { unique: false })
      }

      // Cache for offline data
      if (!db.objectStoreNames.contains('offlineCache')) {
        const store = db.createObjectStore('offlineCache', { keyPath: 'key' });
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

// Add action to queue
async function addToQueue(db, action) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['actionQueue'], 'readwrite');
    const store = transaction.objectStore('actionQueue');
    const request = store.add(action);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error)
  })
}

// Get all queued actions
async function getQueuedActions(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['actionQueue'], 'readonly');
    const store = transaction.objectStore('actionQueue');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error)
  })
}

// Remove action from queue
async function removeFromQueue(db, actionId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['actionQueue'], 'readwrite');
    const store = transaction.objectStore('actionQueue');
    const request = store.delete(actionId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error)
  })
}

async function getPendingSales() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingSales'], 'readonly');
    const store = transaction.objectStore('pendingSales');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error)
  })
}

async function removePendingSale(saleId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingSales'], 'readwrite');
    const store = transaction.objectStore('pendingSales');
    const request = store.delete(saleId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error)
  })
}

// Enhanced background sync for all queued actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-actions') {
    event.waitUntil(syncQueuedActions())
  } else if (event.tag === 'sync-sales') {
    event.waitUntil(syncPendingSales())
  }
});

// Enhanced sync for all queued actions
async function syncQueuedActions() {
  try {
    const db = await openDB();
    const queuedActions = await getQueuedActions(db);

    if (queuedActions.length === 0) {
      return
    }

    // Sort by timestamp (FIFO order)
    queuedActions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    for (const action of queuedActions) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body,
        });

        if (response.ok) {
          await removeFromQueue(db, action.id);
          // Send message to clients about successful sync
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'ACTION_SYNCED',
                actionId: action.id,
                success: true,
                action: action
              })
            })
          })
        } else {
          console.error(`Service Worker: Failed to sync action ${action.id}:`, response.statusText);

          // Send sync error message
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'ACTION_SYNC_ERROR',
                actionId: action.id,
                error: response.statusText,
                action: action
              })
            })
          })
        }
      } catch (error) {
        console.error(`Service Worker: Error syncing action ${action.id}:`, error);

        // Send sync error message
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'ACTION_SYNC_ERROR',
              actionId: action.id,
              error: error.message,
              action: action
            })
          })
        })
      }
    }
  } catch (error) {
    console.error('Service Worker: Error during actions sync:', error)
  }
}

// Legacy sync for existing sales (backwards compatibility)
async function syncPendingSales() {
  try {
    const pendingSales = await getPendingSales();

    if (pendingSales.length === 0) {
      return
    }

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
          await removePendingSale(sale.id);
          // Send message to clients about successful sync
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'SALE_SYNCED',
                saleId: sale.id,
                success: true
              })
            })
          })
        } else {
          console.error(`Service Worker: Failed to sync sale ${sale.id}:`, response.statusText)
        }
      } catch (error) {
        console.error(`Service Worker: Error syncing sale ${sale.id}:`, error);
        // Sale remains in queue for next sync attempt
      }
    }
  } catch (error) {
    console.error('Service Worker: Error during sales sync:', error)
  }
}

// Handle push notifications (future enhancement)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'New notification from DukaFiti',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey || 1
      },
      actions: [
        {
          action: 'explore',
          title: 'View Details',
          icon: '/icons/icon-192.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/icons/icon-192.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'DukaFiti', options)
    )
  }
});