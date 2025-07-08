import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { offlineQueue, syncOfflineQueue, isOnline } from '@/lib/offline-queue';

export function EnhancedOfflineIndicator() {
  const [online, setOnline] = useState(isOnline());
  const [pendingOps, setPendingOps] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Handle online/offline events
    const handleOnline = () => {
      setOnline(true);
      toast({
        title: "Connection restored",
        description: "You're back online. Syncing pending changes...",
      });
      handleAutoSync();
    };
    
    const handleOffline = () => {
      setOnline(false);
      toast({
        title: "You're offline",
        description: "Changes will be saved locally and synced when connection is restored.",
        variant: "destructive",
      });
    };

    // Handle sync completion events
    const handleSyncComplete = (event: CustomEvent) => {
      const { successCount, failureCount, remainingCount } = event.detail;
      
      if (successCount > 0) {
        toast({
          title: "Sync completed",
          description: `${successCount} operation${successCount > 1 ? 's' : ''} synchronized successfully.`,
        });
      }
      
      if (failureCount > 0) {
        toast({
          title: "Sync partially failed",
          description: `${failureCount} operation${failureCount > 1 ? 's' : ''} failed to sync.`,
          variant: "destructive",
        });
      }
      
      setIsSyncing(false);
    };

    // Subscribe to queue changes
    const unsubscribe = offlineQueue.subscribe((queue) => {
      setPendingOps(queue.length);
    });

    // Set initial queue length
    setPendingOps(offlineQueue.getQueueLength());

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('offline-sync-complete', handleSyncComplete as EventListener);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline-sync-complete', handleSyncComplete as EventListener);
      unsubscribe();
    };
  }, [toast]);

  const handleAutoSync = async () => {
    if (pendingOps > 0) {
      setIsSyncing(true);
      await syncOfflineQueue();
    }
  };

  const handleManualSync = async () => {
    if (!online) {
      toast({
        title: "Cannot sync while offline",
        description: "Please check your internet connection and try again.",
        variant: "destructive",
      });
      return;
    }

    if (pendingOps === 0) {
      toast({
        title: "Nothing to sync",
        description: "All changes are already synchronized.",
      });
      return;
    }

    setIsSyncing(true);
    
    toast({
      title: "Syncing...",
      description: `Synchronizing ${pendingOps} pending operation${pendingOps > 1 ? 's' : ''}...`,
    });

    await syncOfflineQueue();
  };

  // Show online indicator when online and no pending operations
  if (online && pendingOps === 0) {
    return (
      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
        <Wifi className="h-4 w-4" />
        <span className="text-xs font-medium hidden sm:inline">Online</span>
      </div>
    );
  }

  // Show offline indicator
  if (!online) {
    return (
      <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
        <WifiOff className="h-4 w-4" />
        <span className="text-xs font-medium hidden sm:inline">Offline</span>
        {pendingOps > 0 && (
          <Badge variant="destructive" className="h-5 px-1 text-xs">
            {pendingOps}
          </Badge>
        )}
      </div>
    );
  }

  // Show sync button when online with pending operations
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
        <Wifi className="h-4 w-4" />
        <span className="text-xs font-medium hidden sm:inline">Online</span>
      </div>
      {pendingOps > 0 && (
        <Button
          onClick={handleManualSync}
          disabled={isSyncing}
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="h-3 w-3 mr-1" />
              Sync {pendingOps}
            </>
          )}
        </Button>
      )}
    </div>
  );
}