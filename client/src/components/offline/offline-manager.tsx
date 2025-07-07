// DukaFiti Offline Manager - Complete UI and Sync Management

import React, { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, RotateCw, AlertCircle, CheckCircle } from 'lucide-react';
import { offlineStore } from '@/lib/offline-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface OfflineManagerProps {
  children: React.ReactNode;
}

export const OfflineManager: React.FC<OfflineManagerProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  // Update online status
  const updateOnlineStatus = useCallback(() => {
    setIsOnline(navigator.onLine);
  }, []);

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    try {
      const count = await offlineStore.getPendingCount();
      setPendingCount(count);
    } catch (error) {
      
    }
  }, []);

  // Auto-sync when coming back online
  const handleOnlineSync = useCallback(async () => {
    if (navigator.onLine && pendingCount > 0) {
      
      await handleManualSync();
    }
  }, [pendingCount]);

  // Manual sync function
  const handleManualSync = useCallback(async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    
    try {
      const result = await offlineStore.syncQueue();
      await updatePendingCount();
      
      if (result.success === 0 && result.failed === 0) {
        toast({
          title: 'No Changes',
          description: 'No pending operations to sync',
        });
      }
    } catch (error) {
      
      toast({
        title: 'Sync Failed',
        description: 'Failed to sync offline changes',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, updatePendingCount, toast]);

  // Set up event listeners
  useEffect(() => {
    const handleOnline = () => {
      updateOnlineStatus();
      handleOnlineSync();
    };

    const handleOffline = () => {
      updateOnlineStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync if online
    if (navigator.onLine) {
      handleOnlineSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updateOnlineStatus, handleOnlineSync]);

  // Update pending count periodically
  useEffect(() => {
    updatePendingCount();
    
    const interval = setInterval(updatePendingCount, 5000);
    return () => clearInterval(interval);
  }, [updatePendingCount]);

  return (
    <div className="min-h-screen bg-background">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="sticky top-0 z-50 bg-orange-500 text-white px-4 py-2 text-center text-sm font-medium">
          <div className="flex items-center justify-center gap-2">
            <WifiOff className="h-4 w-4" />
            <span>You are offline — actions will sync when you reconnect</span>
            {pendingCount > 0 && (
              <Badge variant="secondary" className="bg-orange-600 text-white">
                {pendingCount} pending
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Sync Controls */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2">
        {/* Online/Offline Status */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
          isOnline 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
        }`}>
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4" />
              <span>Online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4" />
              <span>Offline</span>
            </>
          )}
        </div>

        {/* Sync Button */}
        {pendingCount > 0 && (
          <Button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="relative shadow-lg"
            size="sm"
          >
            {isSyncing ? (
              <>
                <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RotateCw className="h-4 w-4 mr-2" />
                Sync
              </>
            )}
            <Badge 
              variant="secondary" 
              className="absolute -top-2 -right-2 h-6 w-6 p-0 flex items-center justify-center text-xs"
            >
              {pendingCount}
            </Badge>
          </Button>
        )}
      </div>

      {/* Main Content */}
      {children}
    </div>
  );
};

export default OfflineManager;