import { useEnhancedOffline } from '@/hooks/useEnhancedOffline';
import { Wifi, WifiOff, Clock, RefreshCw } from 'lucide-react';

export const OfflineBanner = () => {
  const {
    isOffline,
    queuedActionsCount,
    salesInQueue,
    inventoryInQueue,
    customersInQueue,
    isProcessing,
    forceSync
  } = useEnhancedOffline();

  if (!isOffline && queuedActionsCount === 0) {
    return null;
  }

  return (
    <div className="fixed top-16 left-0 right-0 z-50 px-2 sm:px-4">
      <div className="mx-auto max-w-7xl">
        <div className="bg-yellow-500 text-black py-2 px-4 rounded-lg shadow-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isOffline ? (
              <>
                <WifiOff className="h-4 w-4" />
                <span className="font-medium">You are offline</span>
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4" />
                <span className="font-medium">Back online</span>
              </>
            )}

            {queuedActionsCount > 0 && (
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {queuedActionsCount} action{queuedActionsCount !== 1 ? 's' : ''} queued
                </span>
                {(salesInQueue > 0 || inventoryInQueue > 0 || customersInQueue > 0) && (
                  <span className="text-xs bg-black bg-opacity-20 px-2 py-0.5 rounded">
                    {salesInQueue > 0 && `${salesInQueue} sales`}
                    {salesInQueue > 0 && (inventoryInQueue > 0 || customersInQueue > 0) && ', '}
                    {inventoryInQueue > 0 && `${inventoryInQueue} inventory`}
                    {inventoryInQueue > 0 && customersInQueue > 0 && ', '}
                    {customersInQueue > 0 && `${customersInQueue} customers`}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {isOffline ? (
              <span className="text-sm">Actions will sync when back online</span>
            ) : queuedActionsCount > 0 ? (
              <button
                onClick={forceSync}
                disabled={isProcessing}
                className="bg-black text-yellow-500 px-3 py-1 rounded text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center space-x-1"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <span>Sync Now</span>
                )}
              </button>
            ) : (
              <span className="text-sm">All actions synced</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineBanner;