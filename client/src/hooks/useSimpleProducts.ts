/**
 * Simple Products Hook - Clean solution without conflicts
 * Direct Supabase integration with minimal dependencies
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/SupabaseAuth';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/types/schema';

export function useSimpleProducts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch products
  const { data: products = [], isLoading, error, refetch } = useQuery({
    queryKey: ['products', user?.id],
    queryFn: async (): Promise<Product[]> => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 0
  });

  // Create product with SKU validation
  const createMutation = useMutation({
    mutationFn: async (productData: any) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Auto-generate SKU if empty or check for duplicates
      let finalSKU = productData.sku;
      if (!finalSKU || finalSKU.trim() === '') {
        finalSKU = await generateUniqueSKU(productData.name, user.id);
      } else {
        // Check if SKU already exists
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id')
          .eq('sku', finalSKU)
          .eq('store_id', user.id)
          .maybeSingle();
        
        if (existingProduct) {
          throw new Error(`SKU "${finalSKU}" already exists. Please use a different SKU.`);
        }
      }
      
      const { data, error } = await supabase
        .from('products')
        .insert([{ ...productData, sku: finalSKU, store_id: user.id }])
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505' && error.message.includes('products_sku_key')) {
          throw new Error(`SKU "${finalSKU}" already exists. Please use a different SKU.`);
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Success",
        description: "Product created successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive"
      });
    }
  });

  // Update product with SKU validation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: any) => {
      // If SKU is being updated, check for duplicates
      if (updateData.sku && user?.id) {
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id')
          .eq('sku', updateData.sku)
          .eq('store_id', user.id)
          .neq('id', id)
          .maybeSingle();
        
        if (existingProduct) {
          throw new Error(`SKU "${updateData.sku}" already exists. Please use a different SKU.`);
        }
      }
      
      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .eq('store_id', user?.id)
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505' && error.message.includes('products_sku_key')) {
          throw new Error(`SKU "${updateData.sku}" already exists. Please use a different SKU.`);
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Success",
        description: "Product updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive"
      });
    }
  });

  // Delete product
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('store_id', user?.id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Success",
        description: "Product deleted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive"
      });
    }
  });

  return {
    products,
    isLoading,
    error,
    refetch,
    createProduct: createMutation.mutate,
    updateProduct: updateMutation.mutate,
    deleteProduct: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}

// Helper function to generate unique SKU
async function generateUniqueSKU(productName: string, storeId: string): Promise<string> {
  if (!productName) return `PROD-${Date.now()}`;
  
  // Generate base SKU from product name
  const baseSKU = productName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 6);
  
  // Try the base SKU first
  let uniqueSKU = baseSKU;
  let counter = 1;
  
  while (counter <= 100) { // Prevent infinite loop
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('sku', uniqueSKU)
      .eq('store_id', storeId)
      .maybeSingle();
    
    if (!existingProduct) {
      return uniqueSKU;
    }
    
    // Generate new SKU with counter
    uniqueSKU = `${baseSKU}${counter.toString().padStart(2, '0')}`;
    counter++;
  }
  
  // Fallback to timestamp-based SKU
  return `PROD-${Date.now()}`;
}