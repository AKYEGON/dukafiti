import { useState, useEffect, useCallback } from 'react';

interface QueuedAction {
  id: string;
  type: 'insert' | 'update' | 'delete';
  table: string;
  payload: any;
  timestamp: number;
}

export default function useOfflineQueue() {
  const [queue, setQueue] = useState<QueuedAction[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  // Load queue from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('offline_queue');
    if (stored) {
      try {
        setQueue(JSON.parse(stored));
      } catch (err) {
        console.error('Failed to load offline queue:', err);
      }
    }
  }, []);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('offline_queue', JSON.stringify(queue));
  }, [queue]);

  // Monitor online status
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

  const enqueue = useCallback(
    (action: Omit<QueuedAction, 'id' | 'timestamp'>) => {
      const queuedAction: QueuedAction = {
        ...action,
        id: Date.now().toString(),
        timestamp: Date.now(),
      };

      setQueue((prev) => [...prev, queuedAction]);
      return queuedAction.id;
    },
    []
  );

  const syncQueue = useCallback(async () => {
    if (!isOnline || queue.length === 0 || syncing) return;

    setSyncing(true);

    const failedActions: QueuedAction[] = [];

    for (const action of queue) {
      try {
        // Import supabase dynamically to avoid circular deps
        const { supabase } = await import('../lib/supabase');

        let query;
        if (action.type === 'insert') {
          query = supabase.from(action.table).insert([action.payload]);
        } else if (action.type === 'update') {
          const { id, ...rest } = action.payload;
          query = supabase.from(action.table).update(rest).eq('id', id);
        } else if (action.type === 'delete') {
          query = supabase.from(action.table).delete().eq('id', action.payload.id);
        }

        const { error } = await query!;
        if (error) throw error;

        // Remove successfully synced action
        setQueue((prev) => prev.filter((item) => item.id !== action.id));
      } catch (err) {
        console.error(`Failed to sync action ${action.id}:`, err);
        failedActions.push(action);
      }
    }

    // Keep failed actions in queue for retry
    if (failedActions.length > 0) {
      console.log(
        `${failedActions.length} actions failed to sync, will retry later`
      );
    }

    setSyncing(false);
  }, [isOnline, queue.length, syncing]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      syncQueue();
    }
  }, [isOnline, syncQueue]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    localStorage.removeItem('offline_queue');
  }, []);

  return {
    queue,
    queueLength: queue.length,
    isOnline,
    syncing,
    enqueue,
    syncQueue,
    clearQueue,
  };
}
