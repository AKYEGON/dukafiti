import { useState } from "react";
import { Smartphone, Banknote, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

interface MpesaPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onPaymentInitiated: (reference: string) => void;
  isProcessing?: boolean;
}

export function MpesaPaymentModal({ 
  open, 
  onOpenChange, 
  total, 
  onPaymentInitiated, 
  isProcessing 
}: MpesaPaymentModalProps) {
  const [paymentReference, setPaymentReference] = useState("");

  const handleSubmit = () => {
    if (!paymentReference.trim()) {
      return;
    }
    onPaymentInitiated(paymentReference.trim());
    setPaymentReference("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && paymentReference.trim()) {
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-green-600" />
            M-Pesa Payment
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <Banknote className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-700">
              {formatCurrency(total.toFixed(2))}
            </div>
            <p className="text-sm text-green-600">Total Amount</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="payment-reference">Payment Reference</Label>
            <Input
              id="payment-reference"
              placeholder="e.g., Sale #123, Invoice #456"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              onKeyDown={handleKeyDown}
              className="border-2 border-gray-200 focus:border-green-500"
              disabled={isProcessing}
            />
            <p className="text-xs text-gray-500">
              Enter a reference for this payment that will be shown to the customer
            </p>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              <strong>Next steps:</strong> After clicking "Initiate Payment", the customer will receive an M-Pesa prompt on their phone to complete the payment.
            </p>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={handleSubmit}
              disabled={!paymentReference.trim() || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4 mr-2" />
                  Initiate Payment
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}