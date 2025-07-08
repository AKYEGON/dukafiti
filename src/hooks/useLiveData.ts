import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function useLiveData<T extends Record<string, any>>(table: string) {
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

    // Initial runtime fetch
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('store_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error(`${table} fetch error:`, error);
          setError(error.message);
        } else if (mounted) {
          setItems(data || []);
        }
      } catch (err) {
        console.error(`${table} fetch error:`, err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (mounted) {
          setLoading(false);
        }
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
          filter: `store_id=eq.${user.id}`
        },
        (payload) => {
          console.log(`${table} change:`, payload);
          setItems(prev => {
            if (payload.eventType === 'INSERT') {
              return [payload.new as T, ...prev];
            }
            if (payload.eventType === 'UPDATE') {
              return prev.map(item => 
                item.id === payload.new.id ? payload.new as T : item
              );
            }
            if (payload.eventType === 'DELETE') {
              return prev.filter(item => item.id !== payload.old.id);
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user, table]);

  return { items, loading, error };
}