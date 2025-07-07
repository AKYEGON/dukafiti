import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Package, WifiOff } from 'lucide-react';
import { type Product } from '@/types/schema';
import { restockProductOfflineAware } from '@/lib/offline-api';

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

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setQuantity('');
      setBuyingPrice('');
    }
  }, [open]);

  const restockMutation = useMutation({
    mutationKey: ['restock', product?.id],
    mutationFn: async ({ productId, qty, costPrice }: { productId: string; qty: number; costPrice?: number }) => {
      
      
      try {
        const result = await restockProductOfflineAware(productId, qty, costPrice);
        
        
        // For offline operations, provide expected return format
        if (result.offline) {
          return {
            newStock: qty, // Optimistic update
            productId,
            costPrice: costPrice || 0,
            oldStock: 0, // We don't know current stock when offline
            offline: true,
            operationId: result.operationId
          };
        } else {
          // For online operations, calculate from result
          const newStock = result.data?.newStock || 0;
          return {
            newStock,
            productId,
            costPrice: costPrice || 0,
            oldStock: newStock - qty,
            offline: false
          };
        }
      } catch (error) {
        
        throw error;
      }
    },
    onSuccess: (data: any) => {
      
      
      // Only refresh queries if we're online and not in offline mode
      if (navigator.onLine && !data.offline) {
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['products-frequent'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
        queryClient.refetchQueries({ queryKey: ['products'] });
      }
      
      const message = data.offline 
        ? `${quantity} units will be added to ${product?.name} when back online`
        : `${quantity} units added to ${product?.name}. Stock: ${data.oldStock} → ${data.newStock}`;
      
      toast({
        title: data.offline ? 'Stock Update Queued' : 'Stock Added Successfully',
        description: message,
        className: data.offline ? 'bg-orange-50 border-orange-200 text-orange-800' : undefined,
      });
      
      
      
      // Reset form and close modal
      setTimeout(() => {
        setQuantity('');
        setBuyingPrice('');
        onOpenChange(false);
      }, 100);
    },
    onError: (error: Error) => {
      
      toast({
        title: 'Restock Failed',
        description: error.message,
        variant: 'destructive',
      });
      
      // Reset form values but keep modal open so user can try again
      setQuantity('');
      setBuyingPrice('');
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
    // Don't close if mutation is pending
    if (restockMutation.isPending) return;
    
    setQuantity('');
    setBuyingPrice('');
    restockMutation.reset();
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
              {restockMutation.isPending ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Adding Stock...
                </>
              ) : (
                'Add Stock'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}