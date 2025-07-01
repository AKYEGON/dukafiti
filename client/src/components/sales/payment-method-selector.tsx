import { useState } from "react";
import { CreditCard, Banknote, Smartphone, User, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { MpesaPaymentModal } from "./mpesa-payment-modal";

interface PaymentMethodSelectorProps {
  total: number;
  onPaymentSelected: (method: 'cash' | 'mpesa' | 'credit', customerInfo?: { name: string; phone?: string }, paymentReference?: string) => void;
  isProcessing?: boolean;
}

export function PaymentMethodSelector({ total, onPaymentSelected, isProcessing }: PaymentMethodSelectorProps) {
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [showMpesaModal, setShowMpesaModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const handleCashPayment = () => {
    onPaymentSelected('cash');
  };

  const handleMpesaPayment = () => {
    setShowMpesaModal(true);
  };

  const handleMpesaPaymentInitiated = (reference: string) => {
    onPaymentSelected('mpesa', undefined, reference);
    setShowMpesaModal(false);
  };

  const handleCreditPayment = () => {
    if (!customerName.trim()) {
      setShowCreditDialog(true);
      return;
    }
    
    onPaymentSelected('credit', { 
      name: customerName.trim(), 
      phone: customerPhone.trim() || undefined 
    });
    setCustomerName("");
    setCustomerPhone("");
  };

  const handleCreditConfirm = () => {
    if (customerName.trim()) {
      onPaymentSelected('credit', { 
        name: customerName.trim(), 
        phone: customerPhone.trim() || undefined 
      });
      setShowCreditDialog(false);
      setCustomerName("");
      setCustomerPhone("");
    }
  };

  return (
    <>
      <Card className="border-2 border-[#00AA00]/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#00AA00]" />
            Select Payment Method
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="text-center mb-4">
            <div className="text-2xl font-bold text-[#00AA00]">
              {formatCurrency(total.toFixed(2))}
            </div>
            <p className="text-sm text-gray-600">Total Amount</p>
          </div>

          {/* Cash Payment */}
          <Button
            className="w-full h-auto p-4 bg-[#00AA00] hover:bg-[#00AA00]/90 text-white justify-start"
            onClick={handleCashPayment}
            disabled={isProcessing}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Banknote className="w-5 h-5" />
              </div>
              <div className="text-left flex-1">
                <div className="font-medium">Cash Payment</div>
                <div className="text-sm opacity-90">Immediate payment in cash</div>
              </div>
            </div>
          </Button>

          {/* M-Pesa Payment */}
          <Button
            className="w-full h-auto p-4 bg-green-600 hover:bg-green-700 text-white justify-start"
            onClick={handleMpesaPayment}
            disabled={isProcessing}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="text-left flex-1">
                <div className="font-medium">M-Pesa Payment</div>
                <div className="text-sm opacity-90">Mobile money transfer</div>
              </div>
            </div>
          </Button>

          {/* Credit Payment */}
          <Button
            variant="outline"
            className="w-full h-auto p-4 border-2 border-[#00AA00] text-[#00AA00] hover:bg-[#00AA00]/10 justify-start"
            onClick={handleCreditPayment}
            disabled={isProcessing}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 bg-[#00AA00]/10 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-[#00AA00]" />
              </div>
              <div className="text-left flex-1">
                <div className="font-medium">Credit Sale</div>
                <div className="text-sm text-gray-600">Customer pays later</div>
              </div>
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* Credit Customer Info Dialog */}
      <Dialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-[#00AA00]" />
              Customer Information
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="text-sm text-gray-600 mb-4">
              Enter customer details for this credit sale of {formatCurrency(total.toFixed(2))}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="credit-customer-name">Customer Name *</Label>
              <Input
                id="credit-customer-name"
                placeholder="Enter customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="border-2 border-gray-200 focus:border-[#00AA00]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="credit-customer-phone">Phone Number (Optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="credit-customer-phone"
                  placeholder="e.g., +254712345678"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="pl-10 border-2 border-gray-200 focus:border-[#00AA00]"
                />
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCreditDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#00AA00] hover:bg-[#00AA00]/90"
                onClick={handleCreditConfirm}
                disabled={!customerName.trim()}
              >
                Confirm Credit Sale
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* M-Pesa Payment Modal */}
      <MpesaPaymentModal
        open={showMpesaModal}
        onOpenChange={setShowMpesaModal}
        total={total}
        onPaymentInitiated={handleMpesaPaymentInitiated}
        isProcessing={isProcessing}
      />
    </>
  );
}