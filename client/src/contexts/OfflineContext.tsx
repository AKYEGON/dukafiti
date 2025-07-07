/**
 * Offline Context - Manages offline state and functionality
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface OfflineContextType {
  isOnline: boolean;
  isOfflineMode: boolean;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  pendingSyncCount: number;
  setOfflineMode: (enabled: boolean) => void;
  syncNow: () => Promise<void>;
  queuedOperations: any[];
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [queuedOperations, setQueuedOperations] = useState<any[]>([]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const setOfflineMode = (enabled: boolean) => {
    setIsOfflineMode(enabled);
  };

  const syncNow = async () => {
    setSyncStatus('syncing');
    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSyncStatus('success');
      setPendingSyncCount(0);
      setQueuedOperations([]);
    } catch (error) {
      setSyncStatus('error');
    }
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isOfflineMode,
        syncStatus,
        pendingSyncCount,
        setOfflineMode,
        syncNow,
        queuedOperations,
      }}
    >
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