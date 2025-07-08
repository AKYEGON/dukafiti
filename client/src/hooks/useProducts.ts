import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/SupabaseAuth';
import type { Product } from '@shared/schema';
import { getProducts, createProduct, updateProduct, deleteProduct } from '@/lib/supabase-data';

export function useProducts() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      console.log('📦 Fetching products via React Query');
      return await getProducts();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!user?.id
  });
}

export function useAddProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newProduct: any) => {
      console.log('➕ Adding product via React Query using createProduct');
      return await createProduct(newProduct);
    },
    onSuccess: () => {
      console.log('🔄 Invalidating products cache after add');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      console.log('🔄 Updating product via React Query using updateProduct');
      return await updateProduct(id, updates);
    },
    onSuccess: () => {
      console.log('🔄 Invalidating products cache after update');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      console.log('🗑️ Deleting product via React Query using deleteProduct');
      return await deleteProduct(id);
    },
    onSuccess: () => {
      console.log('🔄 Invalidating products cache after delete');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}