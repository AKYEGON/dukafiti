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
import { useToast } from '@/hooks/use-toast';
import { useRuntimeOperations } from '@/hooks/useRuntimeOperations';

interface RestockModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RestockModal({ product, open, onOpenChange }: RestockModalProps) {
  const [quantity, setQuantity] = useState('');
  const [buyingPrice, setBuyingPrice] = useState('');
  const { toast } = useToast();
  const { restockProduct } = useRuntimeOperations();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && product) {
      setQuantity('');
      setBuyingPrice('');
    }
  }, [open, product]);

  const handleRestock = async () => {
    if (!product || isSubmitting) {
      return;
    }

    const addedQuantity = parseInt(quantity);
    if (isNaN(addedQuantity) || addedQuantity <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid quantity",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Get cost price if provided
      let costPrice: number | undefined;
      if (buyingPrice && buyingPrice.trim() !== '') {
        const parsed = parseFloat(buyingPrice);
        if (!isNaN(parsed) && parsed > 0) {
          costPrice = parsed;
        }
      }

      await restockProduct(product.id, addedQuantity, costPrice);
      
      // Reset form and close modal
      setQuantity('');
      setBuyingPrice('');
      onOpenChange(false);
      
    } catch (error) {
      console.error('Restock error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-600" />
            Add Stock - {product.name}
          </DialogTitle>
          <DialogDescription>
            Add inventory and optionally update the buying price for this product.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="quantity">Quantity to Add</Label>
            <Input
              id="quantity"
              type="number"
              placeholder="e.g., 10"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="buying-price">Buying Price (Optional)</Label>
            <Input
              id="buying-price"
              type="number"
              placeholder="e.g., 15.00"
              value={buyingPrice}
              onChange={(e) => setBuyingPrice(e.target.value)}
              min="0"
              step="0.01"
            />
            <p className="text-sm text-muted-foreground">
              Leave empty to keep current buying price
            </p>
          </div>

          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm text-muted-foreground">
              Current Stock: {product.stock_quantity || 0} units
            </p>
            <p className="text-sm text-muted-foreground">
              After Adding: {(product.stock_quantity || 0) + (parseInt(quantity) || 0)} units
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleRestock}
            disabled={isSubmitting || !quantity || parseInt(quantity) <= 0}
          >
            {isSubmitting ? "Adding..." : "Add Stock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}