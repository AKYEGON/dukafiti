import { useState } from "react";
import { CreditCard, Banknote, User, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

interface PaymentMethodSelectorProps {
  total: number
  onPaymentSelected: (method: 'cash' | 'credit' | 'mobileMoney', reference?: string) => void
  isProcessing?: boolean
};

export function PaymentMethodSelector({ total, onPaymentSelected, isProcessing, mpesaEnabled = false }: PaymentMethodSelectorProps) {;
  const [showMpesaDialog, setShowMpesaDialog]  =  useState(false);
  const [mpesaReference, setMpesaReference]  =  useState("");
;
  const handleCashPayment = () => {
    onPaymentSelected('cash')
  };
;
  const handleMpesaPayment = () => {
    setShowMpesaDialog(true)
  };
;
  const handleMpesaConfirm = () => {;
    if (mpesaReference.trim()) {
      onPaymentSelected('mpesa', mpesaReference.trim());
      setShowMpesaDialog(false);
      setMpesaReference("")
    }
  };
;
  const handleCreditPayment = () => {
    onPaymentSelected('credit')
  };
;
  return (
    <>
      <Card className = "border-2 border-[#00AA00]/20">
        <CardHeader className = "pb-4">
          <CardTitle className = "text-lg flex items-center gap-2">
            <CreditCard className = "w-5 h-5 text-[#00AA00]" />
            Select Payment Method
          </CardTitle>
          <div className = "text-2xl font-bold text-[#00AA00]">
            {formatCurrency(total.toFixed(2))}
          </div>
        </CardHeader>
        <CardContent className = "space-y-3">
          {/* Cash Payment */}
          <Button
            className = "w-full h-auto p-4 bg-[#00AA00] hover:bg-[#00AA00]/90 text-white justify-start"
            onClick = {handleCashPayment}
            disabled = {isProcessing}
          >
            <div className = "flex items-center gap-3 w-full">
              <div className = "w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Banknote className = "w-5 h-5" />
              </div>
              <div className = "text-left flex-1">
                <div className = "font-medium">Cash Payment</div>
                <div className = "text-sm opacity-90">Pay with cash</div>
              </div>
            </div>
          </Button>

          {/* M-Pesa Payment - Only show if enabled */}
          {mpesaEnabled && (
            <Button
              className = "w-full h-auto p-4 bg-green-600 hover:bg-green-700 text-white justify-start"
              onClick = {handleMpesaPayment}
              disabled = {isProcessing}
            >
              <div className = "flex items-center gap-3 w-full">
                <div className = "w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Smartphone className = "w-5 h-5" />
                </div>
                <div className = "text-left flex-1">
                  <div className = "font-medium">M-Pesa Payment</div>
                  <div className = "text-sm opacity-90">Mobile money transfer</div>
                </div>
              </div>
            </Button>
          )}

          {/* Credit Payment */}
          <Button
            variant = "outline"
            className = "w-full h-auto p-4 border-2 border-[#00AA00] text-[#00AA00] hover:bg-[#00AA00]/10 justify-start"
            onClick = {handleCreditPayment}
            disabled = {isProcessing}
          >
            <div className = "flex items-center gap-3 w-full">
              <div className = "w-10 h-10 bg-[#00AA00]/10 rounded-lg flex items-center justify-center">
                <User className = "w-5 h-5 text-[#00AA00]" />
              </div>
              <div className = "text-left flex-1">
                <div className = "font-medium">Credit Sale</div>
                <div className = "text-sm text-gray-600">Customer pays later</div>
              </div>
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* M-Pesa Reference Dialog */}
      <Dialog open = {showMpesaDialog} onOpenChange = {setShowMpesaDialog}>
        <DialogContent className = "sm:max-w-md">
          <DialogHeader>
            <DialogTitle className = "flex items-center gap-2">
              <Smartphone className = "w-5 h-5 text-green-600" />
              M-Pesa Payment Reference
            </DialogTitle>
          </DialogHeader>

          <div className = "space-y-4 pt-4">
            <div className = "text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className = "text-2xl font-bold text-green-700">
                {formatCurrency(total.toFixed(2))}
              </div>
              <p className = "text-sm text-green-600">Total Amount</p>
            </div>

            <div className = "space-y-2">
              <Label htmlFor = "mpesa-reference">Payment Reference</Label>
              <Input
                id = "mpesa-reference"
                placeholder = "e.g., Sale #123, Customer Name, Invoice #456"
                value = {mpesaReference}
                onChange = {(e) => setMpesaReference(e.target.value)}
                className = "border-2 border-gray-200 focus:border-green-500"
                disabled = {isProcessing}
              />
              <p className = "text-xs text-gray-500">
                Enter a reference for this M-Pesa payment
              </p>
            </div>

            <div className = "bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <p className = "text-sm text-yellow-700">
                <strong>Note:</strong> The customer will receive an M-Pesa prompt to complete the payment. This sale will be marked as pending until payment is confirmed.
              </p>
            </div>

            <div className = "flex gap-2 pt-4">
              <Button
                variant = "outline"
                className = "flex-1"
                onClick = {() => setShowMpesaDialog(false)}
                disabled = {isProcessing}
              >
                Cancel
              </Button>
              <Button
                className = "flex-1 bg-green-600 hover:bg-green-700"
                onClick = {handleMpesaConfirm}
                disabled = {!mpesaReference.trim() || isProcessing}
              >
                <Smartphone className = "w-4 h-4 mr-2" />
                Send M-Pesa Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}