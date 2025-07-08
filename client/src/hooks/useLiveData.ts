import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function useLiveData<T extends { id: number }>(table: string) {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data on mount
  useEffect(() => {
    console.log(`🔄 useLiveData: Fetching initial ${table} data`);
    
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error(`❌ ${table} fetch error:`, error);
        } else {
          console.log(`✅ ${table} initial data fetched:`, data?.length, 'items');
          setItems(data || []);
        }
      } catch (err) {
        console.error(`❌ ${table} fetch failed:`, err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [table]);

  // Set up real-time subscription for all changes
  useEffect(() => {
    console.log(`🔗 useLiveData: Setting up real-time subscription for ${table}`);
    
    const channel = supabase
      .channel(`${table}_realtime_all`)
      .on('postgres_changes', {
        event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: table
      }, (payload) => {
        console.log(`📡 ${table} real-time event:`, payload.eventType, payload);
        
        setItems(prev => {
          switch (payload.eventType) {
            case 'INSERT':
              // Add new item to the beginning
              const newItem = payload.new as T;
              console.log(`➕ Adding new ${table} item:`, newItem);
              return [newItem, ...prev];
              
            case 'UPDATE':
              // Update existing item
              const updatedItem = payload.new as T;
              console.log(`🔄 Updating ${table} item:`, updatedItem);
              return prev.map(item => 
                item.id === updatedItem.id ? updatedItem : item
              );
              
            case 'DELETE':
              // Remove deleted item
              const deletedItem = payload.old as T;
              console.log(`🗑️ Removing ${table} item:`, deletedItem);
              return prev.filter(item => item.id !== deletedItem.id);
              
            default:
              console.log(`❓ Unknown event type for ${table}:`, payload.eventType);
              return prev;
          }
        });
      })
      .subscribe((status) => {
        console.log(`📊 ${table} subscription status:`, status);
      });

    // Cleanup subscription on unmount
    return () => {
      console.log(`🔌 Cleaning up ${table} real-time subscription`);
      supabase.removeChannel(channel);
    };
  }, [table]);

  return { items, isLoading };
}