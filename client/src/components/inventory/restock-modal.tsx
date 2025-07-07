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
import { useSimpleProducts } from '@/hooks/useSimpleProducts';

interface RestockModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RestockModal({ product, open, onOpenChange }: RestockModalProps) {
  const [quantity, setQuantity] = useState('');
  const [buyingPrice, setBuyingPrice] = useState('');
  const { toast } = useToast();
  const { updateProduct, isUpdating } = useSimpleProducts();

  useEffect(() => {
    if (open && product) {
      setQuantity('');
      setBuyingPrice('');
    }
  }, [open, product]);

  const handleRestock = () => {
    if (!product) {
      toast({
        title: "Error",
        description: "No product selected",
        variant: "destructive",
      });
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

    const newStockLevel = (product.stock_quantity || 0) + addedQuantity;

    // Build update data - only include cost_price if provided
    const updateData: any = {
      stock_quantity: newStockLevel
    };

    // Only add cost_price if buyingPrice is provided and not empty
    if (buyingPrice && buyingPrice.trim() !== '') {
      const costPrice = parseFloat(buyingPrice);
      if (!isNaN(costPrice) && costPrice > 0) {
        updateData.cost_price = costPrice;
      }
    }

    updateProduct({ id: product.id, ...updateData });
    
    // Reset form and close modal
    setQuantity('');
    setBuyingPrice('');
    onOpenChange(false);
    
    toast({
      title: "Stock Updated",
      description: `Added ${quantity} units to ${product.name}`,
    });
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
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleRestock}
            disabled={isUpdating || !quantity || parseInt(quantity) <= 0}
          >
            {isUpdating ? "Adding..." : "Add Stock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}