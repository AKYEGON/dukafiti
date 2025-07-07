import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Package } from 'lucide-react';
import { type Product } from '@shared/schema';

interface RestockModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RestockModal({ product, open, onOpenChange }: RestockModalProps) {
  const [quantity, setQuantity] = useState('');
  const [buyingPrice, setBuyingPrice] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const restockMutation = useMutation({
    mutationFn: async ({ productId, qty, costPrice }: { productId: number; qty: number; costPrice: number }) => {
      // First get current stock to calculate new stock
      const { data: currentProduct, error: fetchError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', productId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch current stock: ${fetchError.message}`);
      }

      const currentStock = currentProduct.stock || 0;
      const newStock = currentStock + qty;

      // Update product with new stock (cost_price will be added to schema later)
      const { error: updateError } = await supabase
        .from('products')
        .update({
          stock: newStock
        })
        .eq('id', productId);

      if (updateError) {
        throw new Error(`Failed to update product: ${updateError.message}`);
      }

      // For now, we'll store buying price info in local storage or a separate tracking system
      // This will be moved to the database once the cost_price column is added to the schema
      console.log(`Buying price for ${productId}: ${costPrice} (to be stored in cost_price column)`);

      return { newStock, productId, costPrice };
    },
    onSuccess: (data) => {
      // Invalidate and refetch products query
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-frequent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
      
      toast({
        title: 'Stock Added Successfully',
        description: `${quantity} units added to ${product?.name}. New stock: ${data.newStock}`,
      });
      
      // Reset form and close modal
      setQuantity('');
      setBuyingPrice('');
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Restock Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product) return;
    
    const qty = parseInt(quantity);
    const costPrice = parseFloat(buyingPrice);
    
    if (!quantity || !buyingPrice || qty <= 0 || costPrice < 0) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter valid quantity and buying price values.',
        variant: 'destructive',
      });
      return;
    }
    
    restockMutation.mutate({
      productId: product.id,
      qty,
      costPrice
    });
  };

  const handleClose = () => {
    setQuantity('');
    setBuyingPrice('');
    onOpenChange(false);
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Package className="w-5 h-5 text-blue-600" />
            Restock {product.name}
          </DialogTitle>
          <DialogDescription>
            Add new stock and set the buying price for future profit calculations.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity to Add</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              placeholder="Enter quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-12"
              disabled={restockMutation.isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="buying-price">Buying Price per Unit (KES)</Label>
            <Input
              id="buying-price"
              type="number"
              min="0"
              step="0.01"
              placeholder="Enter buying price"
              value={buyingPrice}
              onChange={(e) => setBuyingPrice(e.target.value)}
              className="h-12"
              disabled={restockMutation.isPending}
              required
            />
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm">
            <p className="text-gray-600 dark:text-gray-400">
              <strong>Current Stock:</strong> {product.stock !== null ? product.stock : 'Unknown'}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <strong>Selling Price:</strong> KES {parseFloat(product.price).toLocaleString()}
            </p>
            {quantity && buyingPrice && (
              <p className="text-green-600 dark:text-green-400 mt-1">
                <strong>New Stock:</strong> {(product.stock || 0) + parseInt(quantity || '0')}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={restockMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={restockMutation.isPending || !quantity || !buyingPrice}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {restockMutation.isPending ? 'Adding Stock...' : 'Add Stock'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}