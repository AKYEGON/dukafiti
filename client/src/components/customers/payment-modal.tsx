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
import { formatCurrency } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
  onPaymentRecorded: () => void;
}

export function PaymentModal({ isOpen, onClose, customer, onPaymentRecorded }: PaymentModalProps) {
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  console.log('[PaymentModal] Rendered with customer:', customer);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return;
    }

    setIsProcessing(true);
    console.log('[PaymentModal] Recording payment:', { 
      customerId: customer.id, 
      amount: Number(amount),
      currentBalance: customer.balance 
    });

    try {
      const paymentAmount = Number(amount);
      const newBalance = Math.max(0, (customer.balance || 0) - paymentAmount);

      // Update customer balance
      const { error } = await supabase
        .from('customers')
        .update({ balance: newBalance })
        .eq('id', customer.id);

      if (error) {
        console.error('[PaymentModal] Payment recording error:', error);
        throw error;
      }

      console.log('[PaymentModal] Payment recorded successfully:', {
        oldBalance: customer.balance,
        newBalance,
        paymentAmount
      });

      onPaymentRecorded();
      onClose();
      setAmount("");
    } catch (error) {
      console.error('[PaymentModal] Payment recording failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const maxPayment = customer?.balance || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment from {customer?.name}
            <br />
            Current balance: <span className="font-semibold text-red-600">
              {formatCurrency(maxPayment)}
            </span>
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <div className="col-span-3">
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={maxPayment}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter payment amount"
                  required
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isProcessing || !amount}>
              {isProcessing ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}