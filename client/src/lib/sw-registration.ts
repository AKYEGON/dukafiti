// DukaFiti Service Worker Registration
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[SW Registration] Service worker registered successfully:', registration);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW Registration] New service worker available');
              
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
          console.log('[SW Registration] Background sync registered');
        } catch (error) {
          console.log('[SW Registration] Background sync registration failed:', error);
        }
      }

      return registration;
    } catch (error) {
      console.error('[SW Registration] Service worker registration failed:', error);
      throw error;
    }
  } else {
    console.log('[SW Registration] Service workers not supported');
    throw new Error('Service workers not supported');
  }
}

export async function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const unregistered = await registration.unregister();
        console.log('[SW Registration] Service worker unregistered:', unregistered);
        return unregistered;
      }
    } catch (error) {
      console.error('[SW Registration] Service worker unregistration failed:', error);
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
      console.log('[PWA Install] Install prompt event fired');
      e.preventDefault();
      this.deferredPrompt = e;
      this.isInstallable = true;
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('[PWA Install] App was installed');
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
      
      console.log('[PWA Install] User choice:', outcome);
      
      if (outcome === 'accepted') {
        this.isInstalled = true;
        this.isInstallable = false;
      }
      
      this.deferredPrompt = null;
      return outcome === 'accepted';
    } catch (error) {
      console.error('[PWA Install] Install prompt failed:', error);
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