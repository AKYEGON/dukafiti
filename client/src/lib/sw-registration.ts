// DukaFiti Service Worker Registration
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              
              
              // Show update notification
              if (confirm('A new version of DukaFiti is available. Update now?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            }
          });
        }
      });

      // Register for background sync
      if ('sync' in window.ServiceWorkerRegistration.prototype) {
        try {
          await registration.sync.register('background-sync');
          
        } catch (error) {
          
        }
      }

      return registration;
    } catch (error) {
      
      throw error;
    }
  } else {
    
    throw new Error('Service workers not supported');
  }
}

export async function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const unregistered = await registration.unregister();
        
        return unregistered;
      }
    } catch (error) {
      
      throw error;
    }
  }
  return false;
}

// PWA Install Prompt
export class PWAInstallPrompt {
  private deferredPrompt: any = null;
  private isInstallable = false;
  private isInstalled = false;

  constructor() {
    this.init();
  }

  private init() {
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      
      e.preventDefault();
      this.deferredPrompt = e;
      this.isInstallable = true;
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      
      this.isInstalled = true;
      this.deferredPrompt = null;
      this.isInstallable = false;
    });

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
    }
  }

  canInstall(): boolean {
    return this.isInstallable && !this.isInstalled;
  }

  isAppInstalled(): boolean {
    return this.isInstalled;
  }

  async showInstallPrompt(): Promise<boolean> {
    if (!this.canInstall()) {
      return false;
    }

    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      
      
      if (outcome === 'accepted') {
        this.isInstalled = true;
        this.isInstallable = false;
      }
      
      this.deferredPrompt = null;
      return outcome === 'accepted';
    } catch (error) {
      
      return false;
    }
  }

  getInstallInstructions(): string {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (isIOS && isSafari) {
      return 'Tap the Share button and then "Add to Home Screen" to install DukaFiti.';
    }
    
    return 'Use your browser\'s menu to "Add to Home Screen" or "Install App".';
  }
}

export const pwaInstall = new PWAInstallPrompt();