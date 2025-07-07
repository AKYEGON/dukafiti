import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log('Starting DukaFiti application...');

// Register Service Worker for offline functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered successfully:', registration);
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 New service worker available');
                // Show update available notification
                if (confirm('A new version of DukaFiti is available. Would you like to update?')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Root element not found!");
  throw new Error("Root element not found!");
} else {
  console.log("Root element found, mounting React app...");
  try {
    createRoot(rootElement).render(<App />);
    console.log("React app mounted successfully");
  } catch (error) {
    console.error("Failed to mount React app:", error);
    throw error;
  }
}
