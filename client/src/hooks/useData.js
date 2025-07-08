import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/SupabaseAuth';

export default function useData(table) {
  const [items, setItems] = useState([]);
  const [debug, setDebug] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  async function fetchData() {
    if (!user?.id) {
      console.log(`[${table}] fetchData skipped - no user`);
      setDebug(prev => [...prev, `${table}: no user, skipping fetch`]);
      return;
    }

    console.log(`[${table}] fetchData start`, { userId: user.id, timestamp: new Date().toISOString() });
    setDebug(prev => [...prev, `${table}: fetch start at ${new Date().toLocaleTimeString()}`]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('store_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(`[${table}] fetchData error:`, error);
        setDebug(prev => [...prev, `${table}: fetch error: ${error.message}`]);
        throw error;
      } else {
        console.log(`[${table}] fetchData success:`, data);
        setDebug(prev => [...prev, `${table}: fetched ${data.length} items at ${new Date().toLocaleTimeString()}`]);
        setItems(data || []);
      }
    } catch (error) {
      console.error(`[${table}] fetchData failed:`, error);
      setDebug(prev => [...prev, `${table}: fetch failed: ${error.message}`]);
    } finally {
      setIsLoading(false);
    }
  }

  // Real-time subscription with comprehensive logging
  useEffect(() => {
    if (!user?.id) {
      console.log(`[${table}] subscription skipped - no user`);
      return;
    }

    console.log(`[${table}] setting up real-time subscription for user ${user.id}`);
    setDebug(prev => [...prev, `${table}: setting up realtime subscription`]);

    // Initial data fetch
    fetchData();

    // Set up real-time subscription
    const channel = supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: table,
          filter: `store_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log(`[${table}] realtime ${payload.eventType}:`, payload);
          setDebug(prev => [...prev, `${table}: realtime ${payload.eventType} at ${new Date().toLocaleTimeString()}`]);
          
          setItems(prev => {
            switch (payload.eventType) {
              case 'INSERT':
                console.log(`[${table}] adding new item:`, payload.new);
                return [payload.new, ...prev.filter(i => i.id !== payload.new.id)];
              case 'UPDATE':
                console.log(`[${table}] updating item:`, payload.new);
                return prev.map(i => i.id === payload.new.id ? payload.new : i);
              case 'DELETE':
                console.log(`[${table}] removing item:`, payload.old);
                return prev.filter(i => i.id !== payload.old.id);
              default:
                console.log(`[${table}] unknown event type:`, payload.eventType);
                return prev;
            }
          });
        }
      )
      .subscribe((status) => {
        console.log(`[${table}] subscription status:`, status);
        setDebug(prev => [...prev, `${table}: subscription ${status}`]);
      });

    return () => {
      console.log(`[${table}] cleaning up subscription`);
      setDebug(prev => [...prev, `${table}: cleaning up subscription`]);
      supabase.removeChannel(channel);
    };
  }, [user?.id, table]);

  // Manual refresh function
  const refresh = async () => {
    console.log(`[${table}] manual refresh triggered`);
    setDebug(prev => [...prev, `${table}: manual refresh at ${new Date().toLocaleTimeString()}`]);
    await fetchData();
  };

  // Clear debug logs
  const clearDebug = () => {
    setDebug([]);
    console.log(`[${table}] debug logs cleared`);
  };

  return { 
    items, 
    fetchData, 
    refresh, 
    debug, 
    clearDebug, 
    isLoading,
    user 
  };
}