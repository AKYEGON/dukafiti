import { useState, useEffect } from "react";
import { WifiOff, Wifi, Clock } from "lucide-react";
import { isOnline, setupNetworkListeners, offlineQueue } from "@/lib/offline-queue";

export function OfflineIndicator() {
  const [online, setOnline] = useState(isOnline());
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Set initial state
    setOnline(isOnline());
    
    // Update pending count
    const updatePendingCount = async () => {
      try {
        const count = await offlineQueue.getQueueCount();
        setPendingCount(count);
      } catch (error) {
        
      }
    };

    updatePendingCount();

    // Set up network listeners
    const cleanup = setupNetworkListeners(
      () => {
        setOnline(true);
        updatePendingCount(); // Refresh count when back online
      },
      () => {
        setOnline(false);
        updatePendingCount(); // Refresh count when going offline
      }
    );

    // Update pending count periodically
    const interval = setInterval(updatePendingCount, 5000);

    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, []);

  // Don't show anything if online and no pending sales
  if (online && pendingCount === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      {/* Offline indicator */}
      {!online && (
        <div className="flex items-center gap-2 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 px-3 py-2 rounded-lg shadow-lg border border-red-200 dark:border-red-800">
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">Offline</span>
        </div>
      )}

      {/* Online indicator (only show briefly when coming back online) */}
      {online && pendingCount > 0 && (
        <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 px-3 py-2 rounded-lg shadow-lg border border-green-200 dark:border-green-800">
          <Wifi className="h-4 w-4" />
          <span className="text-sm font-medium">Online</span>
        </div>
      )}

      {/* Pending sales indicator */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 px-3 py-2 rounded-lg shadow-lg border border-yellow-200 dark:border-yellow-800">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">
            {pendingCount} sale{pendingCount > 1 ? 's' : ''} queued
          </span>
        </div>
      )}
    </div>
  );
}

// Hook to use offline status in components
export function useOfflineStatus() {
  const [online, setOnline] = useState(isOnline());
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    setOnline(isOnline());

    const updatePendingCount = async () => {
      try {
        const count = await offlineQueue.getQueueCount();
        setPendingCount(count);
      } catch (error) {
        
      }
    };

    updatePendingCount();

    const cleanup = setupNetworkListeners(
      () => {
        setOnline(true);
        updatePendingCount();
      },
      () => {
        setOnline(false);
        updatePendingCount();
      }
    );

    const interval = setInterval(updatePendingCount, 5000);

    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, []);

  return { online, pendingCount };
}