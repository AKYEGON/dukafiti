const CACHE_NAME = 'dukasmart-v2';
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

// Install event - cache all static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Installed');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Install failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache first, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip API requests for fresh data
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          console.log('Service Worker: Serving from cache:', event.request.url);
          return response;
        }

        console.log('Service Worker: Fetching from network:', event.request.url);
        return fetch(event.request)
          .then((response) => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response before caching
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.error('Service Worker: Fetch failed:', error);
            
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html') || caches.match('/');
            }
            
            // For other requests, try to return cached version or fail gracefully
            return caches.match('/') || new Response('Offline', { status: 503 });
          });
      })
  );
});

// IndexedDB helper functions for service worker
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DukaSmartOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingSales')) {
        const store = db.createObjectStore('pendingSales', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

async function getPendingSales() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingSales'], 'readonly');
    const store = transaction.objectStore('pendingSales');
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function removePendingSale(saleId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingSales'], 'readwrite');
    const store = transaction.objectStore('pendingSales');
    const request = store.delete(saleId);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Handle background sync for offline sales
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Sync event triggered with tag:', event.tag);
  
  if (event.tag === 'sync-sales') {
    event.waitUntil(syncPendingSales());
  }
});

async function syncPendingSales() {
  console.log('Service Worker: Starting to sync pending sales...');
  
  try {
    const pendingSales = await getPendingSales();
    
    if (pendingSales.length === 0) {
      console.log('Service Worker: No pending sales to sync');
      return;
    }

    console.log(`Service Worker: Found ${pendingSales.length} pending sales to sync`);
    
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
          console.log(`Service Worker: Successfully synced sale ${sale.id}`);
          
          // Send message to clients about successful sync
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'SALE_SYNCED',
                saleId: sale.id,
                success: true
              });
            });
          });
        } else {
          console.error(`Service Worker: Failed to sync sale ${sale.id}:`, response.statusText);
        }
      } catch (error) {
        console.error(`Service Worker: Error syncing sale ${sale.id}:`, error);
        // Sale remains in queue for next sync attempt
      }
    }
  } catch (error) {
    console.error('Service Worker: Error during sales sync:', error);
  }
}

// Handle push notifications (future enhancement)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    console.log('Service Worker: Push received:', data);
    
    const options = {
      body: data.body || 'New notification from DukaSmart',
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
      self.registration.showNotification(data.title || 'DukaSmart', options)
    );
  }
});