import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function useLiveData<
  T extends { id: string; store_id?: string },
>(table: string) {
  const { user } = useAuth();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    let mounted = true;

    // Initial load
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('store_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (mounted) {
          setItems(data || []);
          setError(null);
        }
      } catch (err) {
        console.error(`${table} fetch error:`, err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch data');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    // Realtime subscription
    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: `store_id=eq.${user.id}`,
        },
        (payload) => {
          setItems((prev) => {
            switch (payload.eventType) {
              case 'INSERT':
                return [payload.new as T, ...prev];
              case 'UPDATE':
                return prev.map((item) =>
                  item.id === (payload.new as T).id ? (payload.new as T) : item
                );
              case 'DELETE':
                return prev.filter((item) => item.id !== (payload.old as T).id);
              default:
                return prev;
            }
          });
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user, table]);

  return { items, loading, error, refetch: () => window.location.reload() };
}
