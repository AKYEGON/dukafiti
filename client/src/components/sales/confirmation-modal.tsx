import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (saleData: any) => void;
  cartItems: any[];
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  isProcessing?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  cartItems,
  paymentMethod,
  setPaymentMethod,
  isProcessing = false
}: ConfirmationModalProps) {
  const [customerInfo, setCustomerInfo] = useState("");

  console.log('[ConfirmationModal] Rendered with:', { 
    cartItems: cartItems.length, 
    paymentMethod,
    isProcessing 
  });

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleConfirm = () => {
    const saleData = {
      items: cartItems,
      payment_method: paymentMethod,
      customer_name: paymentMethod === 'credit' ? customerInfo : null,
      total: totalAmount
    };

    console.log('[ConfirmationModal] Confirming sale:', saleData);
    onConfirm(saleData);
  };

  const handleClose = () => {
    setCustomerInfo("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirm Sale</DialogTitle>
          <DialogDescription>
            Review the sale details and confirm the transaction
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Sale Items */}
          <div>
            <h4 className="font-medium mb-2">Sale Items</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
              {cartItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="flex-1">{item.name}</span>
                  <span className="text-muted-foreground mx-2">
                    {item.quantity} × {formatCurrency(item.price)}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <Label htmlFor="payment-method" className="text-sm font-medium">
              Payment Method
            </Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="mobileMoney">Mobile Money</SelectItem>
                <SelectItem value="credit">Credit Sale</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Customer Information for Credit Sales */}
          {paymentMethod === 'credit' && (
            <div>
              <Label htmlFor="customer-info" className="text-sm font-medium">
                Customer Name
              </Label>
              <Input
                id="customer-info"
                value={customerInfo}
                onChange={(e) => setCustomerInfo(e.target.value)}
                placeholder="Enter customer name"
                className="mt-1"
                required
              />
            </div>
          )}

          {/* Total */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center font-medium text-lg">
              <span>Total Amount:</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isProcessing || (paymentMethod === 'credit' && !customerInfo.trim())}
          >
            {isProcessing ? "Processing..." : "Confirm Sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}