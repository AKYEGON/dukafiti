import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '@/contexts/SupabaseAuth';
import type { Product } from '@shared/schema';

export function useProducts() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['products', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID');
      
      console.log('🔄 Fetching products via React Query');
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Products fetch error:', error);
        throw error;
      }
      
      console.log('✅ Products fetched via React Query:', data?.length, 'items');
      return data || [];
    },
    enabled: !!user?.id
  });
}

export function useAddProduct() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (newProduct: Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('No user ID');
      
      console.log('➕ Adding product via React Query');
      const { data, error } = await supabase
        .from('products')
        .insert([{ ...newProduct, user_id: user.id }])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Add product error:', error);
        throw error;
      }
      
      console.log('✅ Product added via React Query:', data);
      return data;
    },
    onSuccess: () => {
      console.log('🔄 Invalidating products cache after add');
      queryClient.invalidateQueries({ queryKey: ['products', user?.id] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Product> }) => {
      console.log('🔄 Updating product via React Query:', id);
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Update product error:', error);
        throw error;
      }
      
      console.log('✅ Product updated via React Query:', data);
      return data;
    },
    onSuccess: () => {
      console.log('🔄 Invalidating products cache after update');
      queryClient.invalidateQueries({ queryKey: ['products', user?.id] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (id: number) => {
      console.log('🗑️ Deleting product via React Query:', id);
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('❌ Delete product error:', error);
        throw error;
      }
      
      console.log('✅ Product deleted via React Query');
      return id;
    },
    onSuccess: () => {
      console.log('🔄 Invalidating products cache after delete');
      queryClient.invalidateQueries({ queryKey: ['products', user?.id] });
    },
  });
}