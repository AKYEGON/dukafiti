import { useState } from "react";
import { CreditCard, Banknote, Smartphone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { type SaleLineItem } from "@/components/sales/sale-line-item";

interface SaleConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: SaleLineItem[];
  onConfirm: (paymentType: 'cash' | 'mpesa' | 'credit') => void;
  isProcessing?: boolean;
}

export function SaleConfirmationModal({ 
  open, 
  onOpenChange, 
  items, 
  onConfirm, 
  isProcessing 
}: SaleConfirmationModalProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'mpesa' | 'credit' | ''>('');

  const total = items.reduce((sum, item) => sum + parseFloat(item.total), 0);

  const handleConfirm = () => {
    if (selectedPaymentMethod) {
      onConfirm(selectedPaymentMethod);
    }
  };

  const handleCancel = () => {
    setSelectedPaymentMethod('');
    onOpenChange(false);
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Banknote className="w-4 h-4" />;
      case 'mpesa': return <Smartphone className="w-4 h-4" />;
      case 'credit': return <User className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#00AA00]" />
            Confirm Sale
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          {/* Cart Items Summary */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm text-gray-700">Items:</h3>
            <div className="bg-gray-50 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <div className="flex-1">
                    <div className="font-medium">{item.product.name}</div>
                    <div className="text-gray-500">Qty: {item.quantity} × {formatCurrency(item.unitPrice)}</div>
                  </div>
                  <div className="font-medium">
                    {formatCurrency(item.total)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grand Total */}
          <div className="bg-[#00AA00]/10 p-4 rounded-lg border border-[#00AA00]/20">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-[#00AA00]">Grand Total:</span>
              <span className="text-2xl font-bold text-[#00AA00]">
                {formatCurrency(total.toFixed(2))}
              </span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Payment Method:</label>
            <Select value={selectedPaymentMethod} onValueChange={(value) => setSelectedPaymentMethod(value as 'cash' | 'mpesa' | 'credit' | '')}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select payment method">
                  {selectedPaymentMethod && (
                    <div className="flex items-center gap-2">
                      {getPaymentMethodIcon(selectedPaymentMethod)}
                      <span className="capitalize">{selectedPaymentMethod === 'mpesa' ? 'M-Pesa' : selectedPaymentMethod}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4" />
                    Cash
                  </div>
                </SelectItem>
                <SelectItem value="mpesa">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    M-Pesa
                  </div>
                </SelectItem>
                <SelectItem value="credit">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Credit
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCancel}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-[#00AA00] hover:bg-[#00AA00]/90"
              onClick={handleConfirm}
              disabled={!selectedPaymentMethod || isProcessing}
            >
              {isProcessing ? "Processing..." : "Confirm Sale"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}