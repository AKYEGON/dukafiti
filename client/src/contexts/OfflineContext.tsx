// DukaFiti Offline Context - Manage offline state and operations
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { offlineManager, SyncResult } from '@/lib/offline-manager';
import { toast } from '@/hooks/use-toast';

interface OfflineContextType {
  isOnline: boolean;
  isOfflineMode: boolean;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  pendingSyncCount: number;
  lastSyncTime: Date | null;
  
  // Actions
  toggleOfflineMode: () => void;
  forceSyncNow: () => Promise<SyncResult>;
  getSyncQueueStatus: () => Promise<{ pending: number; failed: number; total: number }>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('[OfflineContext] Device is online');
      
      // Auto-sync when coming back online
      if (pendingSyncCount > 0) {
        handleAutoSync();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsOfflineMode(true);
      console.log('[OfflineContext] Device is offline');
    };

    // Service worker message handler
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_COMPLETE') {
        console.log('[OfflineContext] Sync completed by service worker');
        updateSyncStatus();
        setLastSyncTime(new Date());
        
        toast({
          title: "Sync Complete",
          description: `${event.data.syncedCount} items synced`,
          duration: 3000
        });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    // Initialize sync status
    updateSyncStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, [pendingSyncCount]);

  const handleAutoSync = async () => {
    if (syncStatus === 'syncing') return;
    
    setSyncStatus('syncing');
    try {
      const result = await offlineManager.syncWithServer();
      setSyncStatus(result.success ? 'success' : 'error');
      setLastSyncTime(new Date());
      await updateSyncStatus();
    } catch (error) {
      console.error('[OfflineContext] Auto-sync failed:', error);
      setSyncStatus('error');
    }
  };

  const updateSyncStatus = async () => {
    try {
      const status = await offlineManager.getSyncQueueStatus();
      setPendingSyncCount(status.pending);
    } catch (error) {
      console.error('[OfflineContext] Failed to update sync status:', error);
    }
  };

  const toggleOfflineMode = () => {
    setIsOfflineMode(!isOfflineMode);
    
    toast({
      title: isOfflineMode ? "Online Mode" : "Offline Mode",
      description: isOfflineMode 
        ? "Will sync with server when possible" 
        : "Working offline - changes will queue for sync",
      duration: 3000
    });
  };

  const forceSyncNow = async (): Promise<SyncResult> => {
    if (!isOnline) {
      toast({
        title: "Cannot Sync",
        description: "Device is offline",
        variant: "destructive",
        duration: 3000
      });
      return { success: false, syncedItems: 0, errors: ['Device is offline'] };
    }

    setSyncStatus('syncing');
    
    try {
      const result = await offlineManager.forceSyncNow();
      setSyncStatus(result.success ? 'success' : 'error');
      setLastSyncTime(new Date());
      await updateSyncStatus();
      
      if (result.success) {
        toast({
          title: "Sync Complete",
          description: `${result.syncedItems} items synced successfully`,
          duration: 5000
        });
      } else {
        toast({
          title: "Sync Failed",
          description: result.errors.join(', '),
          variant: "destructive",
          duration: 5000
        });
      }
      
      return result;
    } catch (error) {
      console.error('[OfflineContext] Force sync failed:', error);
      setSyncStatus('error');
      
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Sync Error",
        description: errorMsg,
        variant: "destructive",
        duration: 5000
      });
      
      return { success: false, syncedItems: 0, errors: [errorMsg] };
    }
  };

  const getSyncQueueStatus = async () => {
    return await offlineManager.getSyncQueueStatus();
  };

  const value: OfflineContextType = {
    isOnline,
    isOfflineMode: isOfflineMode || !isOnline,
    syncStatus,
    pendingSyncCount,
    lastSyncTime,
    toggleOfflineMode,
    forceSyncNow,
    getSyncQueueStatus
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}