import { useState, useEffect } from 'react';

export interface QueuedAction {
  id: string
  url: string
  method: string
  headers: Record<string, string>;
  body: string
  timestamp: string
  type?: string
}

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedActions, setQueuedActions] = useState<QueuedAction[]>([]);
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Trigger sync when coming back online
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          // Use postMessage to trigger sync instead of sync API
          registration.active?.postMessage({ type: 'TRIGGER_SYNC' })
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const { type, action, actionId } = event.data;

      switch (type) {
        case 'ACTION_QUEUED':
          setQueuedActions(prev => [...prev, action]);
          break;
        case 'ACTION_SYNCED':
          setQueuedActions(prev => prev.filter(a => a.id !== actionId));
          break;
        case 'ACTION_SYNC_ERROR':
          // Keep action in queue for retry
          break;
        case 'SALE_SYNCED':
          // Legacy support for existing sales
          break;
      }
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Service worker message listener
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

      // Check if service worker is ready
      navigator.serviceWorker.ready.then(() => {
        setIsServiceWorkerReady(true);
      });
    }

    // Initial sync attempt if online
    if (isOnline && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.active?.postMessage({ type: 'TRIGGER_SYNC' })
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, [isOnline]);

  const getQueuedActionsCount = () => queuedActions.length;

  const forceSync = async () => {
    if (!isOnline || !isServiceWorkerReady) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      registration.active?.postMessage({ type: 'TRIGGER_SYNC' })
      return true;
    } catch (error) {
      console.error('Failed to trigger sync:', error);
      return false;
    }
  };

  return {
    isOnline,
    isOffline: !isOnline,
    queuedActions,
    queuedActionsCount: getQueuedActionsCount(),
    isServiceWorkerReady,
    forceSync;
  };
};

export default useOffline;