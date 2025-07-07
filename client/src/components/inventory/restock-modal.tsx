import { useState, useEffect } from 'react';
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
import { Package } from 'lucide-react';
import { type Product } from '@/types/schema';
import { useComprehensiveRealtime } from '@/hooks/useComprehensiveRealtime';

interface RestockModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RestockModal({ product, open, onOpenChange }: RestockModalProps) {
  const [quantity, setQuantity] = useState('');
  const [buyingPrice, setBuyingPrice] = useState('');
  const { restockProductMutation } = useComprehensiveRealtime();

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setQuantity('');
      setBuyingPrice('');
      restockProductMutation.reset();
    }
  }, [open, restockProductMutation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product) return;
    
    const qty = parseInt(quantity);
    const costPrice = parseFloat(buyingPrice);
    
    if (!quantity || !buyingPrice || qty <= 0 || costPrice < 0) {
      return;
    }
    
    restockProductMutation.mutate({
      productId: Number(product.id),
      quantity: qty,
      buyingPrice: costPrice
    }, {
      onSuccess: () => {
        setQuantity('');
        setBuyingPrice('');
        onOpenChange(false);
      }
    });
  };

  const handleClose = () => {
    // Don't close if mutation is pending
    if (restockProductMutation.isPending) return;
    
    setQuantity('');
    setBuyingPrice('');
    restockProductMutation.reset();
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
              disabled={restockProductMutation.isPending}
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
              disabled={restockProductMutation.isPending}
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
              disabled={restockProductMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={restockProductMutation.isPending || !quantity || !buyingPrice}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {restockProductMutation.isPending ? (
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