import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Package, Plus, Loader2 } from 'lucide-react';
import { createRestock, RestockRequest } from '@/lib/profit-data';
import { toast } from '@/hooks/use-toast';

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: number;
    name: string;
    stock: number;
  };
}

export function RestockModal({ isOpen, onClose, product }: RestockModalProps) {
  const [quantity, setQuantity] = useState<string>('');
  const [supplier, setSupplier] = useState<string>('');
  const [note, setNote] = useState<string>('');
  
  const queryClient = useQueryClient();

  const restockMutation = useMutation({
    mutationFn: (data: RestockRequest) => createRestock(data),
    onSuccess: (data) => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['restock-history'] });
      
      toast({
        title: "Restocked Successfully",
        description: `Added ${data.quantity} units of ${data.productName}. New stock: ${product.stock + data.quantity}`,
      });
      
      // Reset form and close modal
      resetForm();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Restock Failed",
        description: error.message || "Failed to restock product. Please try again.",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setQuantity('');
    setSupplier('');
    setNote('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity greater than 0.",
        variant: "destructive",
      });
      return;
    }

    restockMutation.mutate({
      productId: product.id,
      quantity: qty,
      supplier: supplier.trim() || undefined,
      note: note.trim() || undefined
    });
  };

  const handleClose = () => {
    if (!restockMutation.isPending) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Restock Product
          </DialogTitle>
          <DialogDescription>
            Add inventory for <span className="font-medium">{product.name}</span>
            <br />
            <span className="text-xs text-muted-foreground">
              Current stock: {product.stock} units
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-sm font-medium">
              Quantity to Add *
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity..."
              className="h-11"
              disabled={restockMutation.isPending}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier" className="text-sm font-medium">
              Supplier (Optional)
            </Label>
            <Input
              id="supplier"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Enter supplier name..."
              className="h-11"
              disabled={restockMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note" className="text-sm font-medium">
              Notes (Optional)
            </Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add any notes about this restock..."
              className="min-h-[80px] resize-none"
              disabled={restockMutation.isPending}
            />
          </div>

          {quantity && (
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>New Stock Level:</strong> {product.stock} + {quantity} = {product.stock + parseInt(quantity || '0')} units
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={restockMutation.isPending}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={restockMutation.isPending || !quantity || parseInt(quantity) <= 0}
              className="min-h-[44px]"
            >
              {restockMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Restocking...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Restock
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}