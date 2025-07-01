import { createRoot } from "react-dom/client";
import "./index.css";

// Minimal test component
function MinimalApp() {
  return (
    <div style={{ 
      padding: "20px", 
      fontFamily: "Arial", 
      backgroundColor: "#f0f0f0",
      minHeight: "100vh",
      color: "#333"
    }}>
      <h1>DukaSmart Test</h1>
      <p>Application is loading...</p>
      <button onClick={() => alert("Button works!")}>Test Button</button>
    </div>
  );
}

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New content available, show refresh prompt
                  console.log('New content available; please refresh.');
                } else {
                  // Content is cached for offline use
                  console.log('Content is cached for offline use.');
                }
              }
            });
          }
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
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

createRoot(document.getElementById("root")!).render(<MinimalApp />);
