import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  enhancedOfflineQueue, 
  isOnline, 
  setupNetworkListeners, 
  processQueuedActions,
  QueuedAction 
} from '@/lib/enhanced-offline-queue';

export const useEnhancedOffline = () => {
  const [online, setOnline] = useState(isOnline());
  const [queuedActions, setQueuedActions] = useState<QueuedAction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize the offline queue
    enhancedOfflineQueue.init().catch((error) => {
      // Handle initialization error silently
    });

    // Update queued actions count
    const updateQueuedActions = async () => {
      try {
        const actions = await enhancedOfflineQueue.getQueuedActions();
        setQueuedActions(actions);
      } catch (error) {
        // Handle error silently
        setQueuedActions([]);
      }
    };

    // Set up network listeners
    const cleanup = setupNetworkListeners(
      async () => {
        setOnline(true);
        await updateQueuedActions();
        
        // Show back online notification
        toast({
          title: "Back Online",
          description: "Syncing queued actions...",
          variant: "default",
        });
      },
      async () => {
        setOnline(false);
        await updateQueuedActions();
        
        // Show offline notification
        toast({
          title: "You're Offline",
          description: "Actions will be queued until you're back online",
          variant: "destructive",
        });
      }
    );

    // Set up custom event listeners for sync feedback
    const handleActionQueued = (event: CustomEvent) => {
      toast({
        title: "Action Queued",
        description: `${event.detail.description} - will sync when online`,
        variant: "default",
      });
      updateQueuedActions();
    };

    const handleSyncSuccess = (event: CustomEvent) => {
      toast({
        title: "Synced",
        description: `${event.detail.action.description} completed successfully`,
        variant: "default",
      });
      updateQueuedActions();
    };

    const handleSyncError = (event: CustomEvent) => {
      toast({
        title: "Sync Error",
        description: `${event.detail.action.description} - ${event.detail.error}`,
        variant: "destructive",
      });
      updateQueuedActions();
    };

    // Add event listeners
    window.addEventListener('action-queued', handleActionQueued as EventListener);
    window.addEventListener('offline-sync-success', handleSyncSuccess as EventListener);
    window.addEventListener('offline-sync-error', handleSyncError as EventListener);

    // Initial load
    updateQueuedActions();

    // Update queued actions periodically
    const interval = setInterval(updateQueuedActions, 10000); // Every 10 seconds

    return () => {
      cleanup();
      clearInterval(interval);
      window.removeEventListener('action-queued', handleActionQueued as EventListener);
      window.removeEventListener('offline-sync-success', handleSyncSuccess as EventListener);
      window.removeEventListener('offline-sync-error', handleSyncError as EventListener);
    };
  }, [toast]);

  const forceSync = async () => {
    if (!online) {
      toast({
        title: "Cannot Sync",
        description: "You must be online to sync actions",
        variant: "destructive",
      });
      return false;
    }

    setIsProcessing(true);
    try {
      await processQueuedActions();
      toast({
        title: "Sync Complete",
        description: "All queued actions have been processed",
        variant: "default",
      });
      return true;
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to process queued actions",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const clearQueue = async () => {
    try {
      await enhancedOfflineQueue.clearActionQueue();
      setQueuedActions([]);
      toast({
        title: "Queue Cleared",
        description: "All queued actions have been removed",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Clear Failed",
        description: "Failed to clear action queue",
        variant: "destructive",
      });
    }
  };

  const getActionsByType = (type: 'sale' | 'inventory' | 'customer' | 'other') => {
    return queuedActions.filter(action => action.type === type);
  };

  return {
    isOnline: online,
    isOffline: !online,
    queuedActions,
    queuedActionsCount: queuedActions.length,
    salesInQueue: getActionsByType('sale').length,
    inventoryInQueue: getActionsByType('inventory').length,
    customersInQueue: getActionsByType('customer').length,
    isProcessing,
    forceSync,
    clearQueue,
    getActionsByType,
  };
};

export default useEnhancedOffline;