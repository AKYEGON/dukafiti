import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

type SupabaseTable = 'products' | 'customers' | 'orders' | 'notifications';

interface UseDirectSupabaseOptions {
  table: SupabaseTable;
  orderBy?: string;
  ascending?: boolean;
  select?: string;
}

export function useDirectSupabase<T>({ 
  table, 
  orderBy = 'created_at', 
  ascending = false,
  select = '*'
}: UseDirectSupabaseOptions) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Get current user
  const getUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }, []);

  // Fetch items function
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const user = await getUser();
      if (!user) {
        setItems([]);
        return;
      }

      const { data, error } = await supabase
        .from(table)
        .select(select)
        .eq('store_id', user.id)
        .order(orderBy, { ascending });

      if (error) {
        console.error(`Fetch error from ${table}:`, error);
        setError(error.message);
        toast({
          title: "Error loading data",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setItems(data || []);
      }
    } catch (err) {
      console.error(`Unexpected error fetching ${table}:`, err);
      setError('Unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [table, orderBy, ascending, select, getUser, toast]);

  // Add item
  const addItem = useCallback(async (payload: Partial<T>) => {
    try {
      const user = await getUser();
      if (!user) throw new Error('No user found');

      const oldItems = items;
      
      // Optimistic update
      const newItem = { ...payload, id: Date.now(), store_id: user.id } as T;
      setItems(prev => [newItem, ...prev]);

      const { data, error } = await supabase
        .from(table)
        .insert([{ ...payload, store_id: user.id }])
        .select()
        .single();

      if (error) {
        console.error(`Insert error in ${table}:`, error);
        setItems(oldItems); // rollback
        toast({
          title: "Error adding item",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      // Immediate refetch to ensure consistency
      await fetchItems();
      toast({
        title: "Success",
        description: "Item added successfully"
      });
      return true;
    } catch (err) {
      console.error(`Add item error:`, err);
      toast({
        title: "Error",
        description: "Failed to add item",
        variant: "destructive"
      });
      return false;
    }
  }, [items, table, getUser, fetchItems, toast]);

  // Update item
  const updateItem = useCallback(async (id: string | number, updates: Partial<T>) => {
    try {
      const oldItems = items;
      
      // Optimistic update
      setItems(prev => prev.map(item => 
        (item as any).id === id ? { ...item, ...updates } : item
      ));

      const { error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error(`Update error in ${table}:`, error);
        setItems(oldItems); // rollback
        toast({
          title: "Error updating item",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      // Immediate refetch
      await fetchItems();
      toast({
        title: "Success",
        description: "Item updated successfully"
      });
      return true;
    } catch (err) {
      console.error(`Update item error:`, err);
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive"
      });
      return false;
    }
  }, [items, table, fetchItems, toast]);

  // Delete item
  const deleteItem = useCallback(async (id: string | number) => {
    try {
      const oldItems = items;
      
      // Optimistic update
      setItems(prev => prev.filter(item => (item as any).id !== id));

      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`Delete error in ${table}:`, error);
        setItems(oldItems); // rollback
        toast({
          title: "Error deleting item",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      // Immediate refetch
      await fetchItems();
      toast({
        title: "Success",
        description: "Item deleted successfully"
      });
      return true;
    } catch (err) {
      console.error(`Delete item error:`, err);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive"
      });
      return false;
    }
  }, [items, table, fetchItems, toast]);

  // Setup real-time subscription
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const user = await getUser();
      if (!user) return;

      // Initial fetch
      await fetchItems();

      // Setup real-time subscription
      const channel = supabase
        .channel(`${table}-changes`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
            filter: `store_id=eq.${user.id}`
          },
          (payload) => {
            console.log(`Real-time change in ${table}:`, payload);
            
            if (payload.eventType === 'INSERT') {
              setItems(prev => {
                const exists = prev.find(item => (item as any).id === payload.new.id);
                return exists ? prev : [payload.new as T, ...prev];
              });
            } else if (payload.eventType === 'UPDATE') {
              setItems(prev => prev.map(item => 
                (item as any).id === payload.new.id ? payload.new as T : item
              ));
            } else if (payload.eventType === 'DELETE') {
              setItems(prev => prev.filter(item => (item as any).id !== payload.old.id));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupRealtimeSubscription();
    return () => {
      cleanup.then(fn => fn && fn());
    };
  }, [table, getUser, fetchItems]);

  return {
    items,
    loading,
    error,
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
    refresh: fetchItems
  };
}