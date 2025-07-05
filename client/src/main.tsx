import { createRoot } from "react-dom/client"
import App from "./App"
import "./index.css"
import { errorHandler } from "./lib/error-handler"
// Service worker registration disabled for debugging
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', async () => {
//     try {
//       const registration = await navigator.serviceWorker.register('/service-worker.js', {
//         updateViaCache: 'none'
//       })
//       if (registration.waiting) {
//         registration.waiting.postMessage({ type: 'SKIP_WAITING' })
//       }

//       registration.addEventListener('updatefound', () => {
//         const newWorker = registration.installing
//         if (newWorker) {
//           newWorker.addEventListener('statechange', () => {
//             if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
//               window.location.reload()
//             }
//           })
//         }
//       })
//     } catch (error) {
//       // Service worker registration failed but app should still work
//       console.warn('Service worker registration failed:', error instanceof Error ? error.message : 'Unknown error')
//     }
//   })
// }

// Handle PWA install prompt
let deferredPrompt: any
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault()
  // Stash the event so it can be triggered later
  deferredPrompt = e
  // Show install banner/button (you can customize this UI)
  // You could show a custom install button here
  // For now, we'll just log it and let the browser handle it
})
// Handle successful PWA install
window.addEventListener('appinstalled', (evt) => {
  deferredPrompt = null
})
// Listen for service worker messages
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data.type  ===  'SALE_SYNCED') {
      // You could show a toast notification here if needed
    }
  })
}
const rootElement = document.getElementById("root")
if (!rootElement) {
  console.error("Root element not found!")
} else {
  createRoot(rootElement).render(<App />)
}
