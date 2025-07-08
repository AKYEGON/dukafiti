import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function useMutation<T extends { id?: string; store_id?: string }>(
  table: string,
  type: 'insert' | 'update' | 'delete'
) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (payload: Partial<T> & { id?: string }) => {
    if (!user) throw new Error('Not authenticated');
    
    setLoading(true);
    setError(null);

    try {
      let query;
      
      if (type === 'insert') {
        query = supabase
          .from(table)
          .insert([{ ...payload, store_id: user.id }]);
      } else if (type === 'update' && payload.id) {
        const { id, ...rest } = payload;
        query = supabase
          .from(table)
          .update(rest)
          .eq('id', id)
          .eq('store_id', user.id);
      } else if (type === 'delete' && payload.id) {
        query = supabase
          .from(table)
          .delete()
          .eq('id', payload.id)
          .eq('store_id', user.id);
      } else {
        throw new Error('Invalid mutation parameters');
      }

      const { error } = await query;
      if (error) throw error;
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Mutation failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
}