import { CreditCard, Banknote, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface PaymentMethodSelectorProps {
  total: number;
  onPaymentSelected: (method: 'cash' | 'credit') => void;
  isProcessing?: boolean;
}

export function PaymentMethodSelector({ total, onPaymentSelected, isProcessing }: PaymentMethodSelectorProps) {
  const handleCashPayment = () => {
    onPaymentSelected('cash');
  };

  const handleCreditPayment = () => {
    onPaymentSelected('credit');
  };

  return (
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
  );
}