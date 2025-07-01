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
  paymentMethod: 'cash' | 'mpesa' | 'credit' | '';
  onConfirm: (customer?: string) => void;
  isProcessing?: boolean;
}

export function SaleConfirmationModal({ 
  open, 
  onOpenChange, 
  items, 
  paymentMethod,
  onConfirm, 
  isProcessing 
}: SaleConfirmationModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const total = items.reduce((sum, item) => sum + parseFloat(item.total), 0);

  const handleConfirm = () => {
    if (paymentMethod === 'credit' && !customerName.trim()) {
      return; // Validation handled by button disabled state
    }
    onConfirm(paymentMethod === 'credit' ? customerName : undefined);
    onOpenChange(false);
    setCustomerName('');
    setCustomerPhone('');
  };

  const handleCancel = () => {
    setCustomerName('');
    setCustomerPhone('');
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

          {/* Payment Method Display */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Payment Method:</label>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              {getPaymentMethodIcon(paymentMethod)}
              <span className="capitalize font-medium">{paymentMethod === 'mpesa' ? 'M-Pesa' : paymentMethod}</span>
            </div>
          </div>

          {/* Customer Information for Credit Sales */}
          {paymentMethod === 'credit' && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900">Customer Information</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    className="w-full px-3 py-2 border border-blue-300 rounded-md focus:border-blue-500 focus:ring-blue-500/20 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">
                    Customer Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full px-3 py-2 border border-blue-300 rounded-md focus:border-blue-500 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

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
              disabled={(paymentMethod === 'credit' && !customerName.trim()) || isProcessing}
            >
              {isProcessing ? "Processing..." : "Confirm Sale"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}