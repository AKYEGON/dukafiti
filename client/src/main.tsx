import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { errorHandler } from "./lib/error-handler";

// Force service worker cache update and clear old caches
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Clear all caches first
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => {
            console.log('Clearing cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
        console.log('All caches cleared');
      }

      // Unregister existing service worker
      const existingRegistrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        existingRegistrations.map(registration => {
          console.log('Unregistering service worker');
          return registration.unregister();
        })
      );

      // Register fresh service worker
      const registration = await navigator.serviceWorker.register('/service-worker.js', { updateViaCache: 'none' });
      console.log('Fresh SW registered: ', registration);
      
      // Force immediate activation
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // Force reload to get new content
                console.log('New content available; forcing reload.');
                window.location.reload();
              } else {
                console.log('Content is cached for offline use.');
              }
            }
          });
        }
      });
    } catch (error) {
      console.error('Service worker setup failed:', error);
    }
  });
}

// Handle PWA install prompt
let deferredPrompt: any;
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  
  // Show install banner/button (you can customize this UI)
  console.log('PWA install prompt available');
  
  // You could show a custom install button here
  // For now, we'll just log it and let the browser handle it
});

// Handle successful PWA install
window.addEventListener('appinstalled', (evt) => {
  console.log('PWA was installed successfully');
  deferredPrompt = null;
});

// Listen for service worker messages
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data.type === 'SALE_SYNCED') {
      console.log(`Sale ${event.data.saleId} synced successfully`);
      // You could show a toast notification here if needed
    }
  });
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Root element not found!");
} else {
  console.log("Root element found, mounting React app...");
  createRoot(rootElement).render(<App />);
  console.log("React app mounted successfully");
}
