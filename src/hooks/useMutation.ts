import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type MutationType = 'insert' | 'update' | 'delete';

export default function useMutation<T extends Record<string, any>>(
  table: string,
  operation: MutationType
) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (data: Partial<T> & { id?: string }) => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    setError(null);

    try {
      let result;
      
      switch (operation) {
        case 'insert':
          result = await supabase
            .from(table)
            .insert({ ...data, store_id: user.id })
            .select()
            .single();
          break;
          
        case 'update':
          if (!data.id) throw new Error('ID required for update');
          result = await supabase
            .from(table)
            .update(data)
            .eq('id', data.id)
            .eq('store_id', user.id)
            .select()
            .single();
          break;
          
        case 'delete':
          if (!data.id) throw new Error('ID required for delete');
          result = await supabase
            .from(table)
            .delete()
            .eq('id', data.id)
            .eq('store_id', user.id);
          break;
          
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
}