// DukaFiti Service Worker - Static Assets Only, NO API Caching
// This service worker ensures that API data is NEVER cached and always fetched fresh

const CACHE_NAME = 'dukafiti-static-v2';

// Only cache static app shell resources
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html'
];

// Install Event - Cache Static Assets Only
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker - static assets only...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets only');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
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

// Fetch Event - Static Assets Only, NEVER Cache API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip requests to external domains
  if (url.origin !== location.origin) {
    return;
  }

  // CRITICAL: NEVER intercept API or Supabase requests
  if (url.pathname.startsWith('/api/') || 
      url.hostname.includes('supabase') || 
      url.pathname.includes('supabase') ||
      url.search.includes('supabase')) {
    console.log('[SW] API/Supabase request - bypassing cache entirely:', url.pathname);
    // Let these requests go directly to network with no caching
    return;
  }

  // Static assets - Cache-First Strategy
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          console.log('[SW] Serving static asset from cache:', url.pathname);
          return response;
        }
        
        // Not in cache, fetch from network
        console.log('[SW] Fetching static asset from network:', url.pathname);
        return fetch(request)
          .then((response) => {
            // Only cache successful responses for static assets
            if (response.status === 200 && 
                (url.pathname.endsWith('.js') || 
                 url.pathname.endsWith('.css') || 
                 url.pathname.endsWith('.html') ||
                 url.pathname.endsWith('.png') ||
                 url.pathname.endsWith('.ico') ||
                 url.pathname === '/')) {
              
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseClone);
                  console.log('[SW] Cached static asset:', url.pathname);
                })
                .catch((error) => {
                  console.warn('[SW] Failed to cache static asset:', error);
                });
            }
            
            return response;
          })
          .catch(() => {
            // Network failed for static asset
            console.log('[SW] Network failed for static asset:', url.pathname);
            if (url.pathname === '/' || url.pathname.endsWith('.html')) {
              return caches.match('/offline.html');
            }
            throw new Error('Network unavailable and no cache available');
          });
      })
  );
});

// Background Sync - Not used for data sync, only for offline notifications
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event (not used for data):', event.tag);
  // We don't sync data through service worker anymore
  // All data sync is handled by the runtime data hooks
});

// Message Event - For communication with main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_ALL_CACHES') {
    console.log('[SW] Clearing all caches...');
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[SW] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('[SW] All caches cleared');
      event.ports[0].postMessage({ success: true });
    });
  }
});