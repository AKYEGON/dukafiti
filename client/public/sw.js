// DukaFiti Service Worker - Comprehensive Offline Support
const CACHE_NAME = 'dukafiti-v1.0.0';
const STATIC_CACHE_NAME = 'dukafiti-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'dukafiti-dynamic-v1.0.0';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/offline.html'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME && 
                cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with offline-first strategy
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Handle static asset requests
  event.respondWith(handleStaticRequest(request));
});

// Handle API requests with network-first, cache-fallback strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const cacheKey = `${request.method}-${url.pathname}${url.search}`;

  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful GET responses
    if (request.method === 'GET' && networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(cacheKey, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for API request, trying cache:', cacheKey);
    
    // Try cache as fallback for GET requests
    if (request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      const cachedResponse = await cache.match(cacheKey);
      
      if (cachedResponse) {
        console.log('[SW] Serving cached API response:', cacheKey);
        return cachedResponse;
      }
    }

    // For write operations (POST, PUT, DELETE), queue them for later sync
    if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
      await queueFailedRequest(request);
      
      // Return a response indicating the request was queued
      return new Response(
        JSON.stringify({ 
          success: true, 
          queued: true, 
          message: 'Request queued for sync when online' 
        }),
        { 
          status: 202,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    throw error;
  }
}

// Handle navigation requests with cache-first strategy
async function handleNavigationRequest(request) {
  try {
    // Try cache first for faster loading
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match('/');
    
    if (cachedResponse) {
      // Update cache in background
      fetch(request).then(response => {
        if (response.ok) {
          cache.put('/', response.clone());
        }
      }).catch(() => {});
      
      return cachedResponse;
    }

    // Fallback to network
    const networkResponse = await fetch(request);
    cache.put('/', networkResponse.clone());
    return networkResponse;
  } catch (error) {
    // Return offline page if everything fails
    const cache = await caches.open(STATIC_CACHE_NAME);
    return cache.match('/offline.html');
  }
}

// Handle static asset requests with cache-first strategy
async function handleStaticRequest(request) {
  try {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Failed to fetch static asset:', request.url);
    throw error;
  }
}

// Queue failed requests for background sync
async function queueFailedRequest(request) {
  try {
    const requestData = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: request.method !== 'GET' ? await request.text() : null,
      timestamp: Date.now()
    };

    // Store in IndexedDB for persistence
    const db = await openSyncDatabase();
    const transaction = db.transaction(['sync_queue'], 'readwrite');
    const store = transaction.objectStore('sync_queue');
    
    await store.add({
      id: `${Date.now()}-${Math.random()}`,
      ...requestData,
      retryCount: 0,
      status: 'pending'
    });

    console.log('[SW] Request queued for sync:', request.method, request.url);
  } catch (error) {
    console.error('[SW] Failed to queue request:', error);
  }
}

// Background sync event
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(processQueuedRequests());
  }
});

// Process queued requests when back online
async function processQueuedRequests() {
  try {
    const db = await openSyncDatabase();
    const transaction = db.transaction(['sync_queue'], 'readwrite');
    const store = transaction.objectStore('sync_queue');
    const requests = await store.getAll();

    console.log('[SW] Processing', requests.length, 'queued requests');

    for (const queuedRequest of requests) {
      try {
        const response = await fetch(queuedRequest.url, {
          method: queuedRequest.method,
          headers: queuedRequest.headers,
          body: queuedRequest.body
        });

        if (response.ok) {
          // Remove successful request from queue
          await store.delete(queuedRequest.id);
          console.log('[SW] Successfully synced:', queuedRequest.method, queuedRequest.url);
        } else {
          // Update retry count
          queuedRequest.retryCount++;
          if (queuedRequest.retryCount >= 3) {
            queuedRequest.status = 'failed';
          }
          await store.put(queuedRequest);
        }
      } catch (error) {
        console.error('[SW] Failed to sync request:', error);
        queuedRequest.retryCount++;
        queuedRequest.status = queuedRequest.retryCount >= 3 ? 'failed' : 'pending';
        await store.put(queuedRequest);
      }
    }

    // Notify clients about sync completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        syncedCount: requests.length
      });
    });
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Open IndexedDB for sync queue
function openSyncDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('dukafiti-sync', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('sync_queue')) {
        const store = db.createObjectStore('sync_queue', { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Message handling from main thread
self.addEventListener('message', event => {
  console.log('[SW] Received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'FORCE_SYNC') {
    processQueuedRequests();
  }
});