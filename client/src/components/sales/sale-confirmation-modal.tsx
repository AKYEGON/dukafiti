import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Banknote, Smartphone, User, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type SaleLineItem } from "@/components/sales/sale-line-item";
import { type Customer } from "@shared/schema";

interface SaleConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: SaleLineItem[];
  paymentMethod: 'cash' | 'mpesa' | 'credit' | 'mobileMoney' | '';
  onConfirm: (customer?: { name: string; phone?: string; isNew?: boolean }) => void;
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
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing customers
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    enabled: paymentMethod === 'credit' && open,
  });

  const total = items.reduce((sum, item) => sum + parseFloat(item.total), 0);

  // Handle customer selection
  const handleCustomerSelect = (mode: string) => {
    if (mode === 'new') {
      setIsNewCustomer(true);
      setSelectedCustomerId('');
      setCustomerName('');
      setCustomerPhone('');
    } else if (mode === 'existing') {
      setIsNewCustomer(false);
      setSelectedCustomerId('');
      setCustomerName('');
      setCustomerPhone('');
    }
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedCustomerId('');
      setCustomerName('');
      setCustomerPhone('');
      setIsNewCustomer(false);
    }
  }, [open]);

  const handleConfirm = () => {
    if (paymentMethod === 'credit' && !customerName.trim()) {
      return; // Validation handled by button disabled state
    }
    
    if (paymentMethod === 'credit') {
      onConfirm({
        name: customerName.trim(),
        phone: customerPhone.trim() || undefined,
        isNew: isNewCustomer
      });
    } else {
      onConfirm();
    }
    
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Banknote className="w-4 h-4" />;
      case 'mpesa': return <Smartphone className="w-4 h-4" />;
      case 'mobileMoney': return <Smartphone className="w-4 h-4" />;
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
              <span className="capitalize font-medium">
                {paymentMethod === 'mpesa' ? 'M-Pesa' : 
                 paymentMethod === 'mobileMoney' ? 'Mobile Money' : 
                 paymentMethod}
              </span>
            </div>
          </div>

          {/* Customer Information for Credit Sales */}
          {paymentMethod === 'credit' && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-blue-900">Customer Information</h4>
              </div>
              
              <div className="space-y-4">
                {/* Customer Selection Tabs */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={!isNewCustomer ? "default" : "outline"}
                    size="sm"
                    className={`flex-1 ${!isNewCustomer ? 'bg-blue-600 hover:bg-blue-700' : 'border-blue-300 text-blue-700 hover:bg-blue-50'}`}
                    onClick={() => handleCustomerSelect('existing')}
                  >
                    Existing Customer
                  </Button>
                  <Button
                    type="button"
                    variant={isNewCustomer ? "default" : "outline"}
                    size="sm"
                    className={`flex-1 ${isNewCustomer ? 'bg-green-600 hover:bg-green-700' : 'border-green-300 text-green-700 hover:bg-green-50'}`}
                    onClick={() => handleCustomerSelect('new')}
                  >
                    + New Customer
                  </Button>
                </div>

                {/* Existing Customer Selection */}
                {!isNewCustomer && (
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">
                      Select Customer *
                    </label>
                    <Select 
                      value={selectedCustomerId} 
                      onValueChange={(value) => {
                        const customer = customers.find(c => c.id.toString() === value);
                        if (customer) {
                          setSelectedCustomerId(value);
                          setCustomerName(customer.name);
                          setCustomerPhone(customer.phone || '');
                        }
                      }}
                    >
                      <SelectTrigger className="w-full border-blue-300 focus:border-blue-500">
                        <SelectValue placeholder="Choose a customer from your list" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            <div className="flex justify-between w-full">
                              <span className="font-medium">{customer.name}</span>
                              {customer.phone && (
                                <span className="text-gray-500 ml-2">{customer.phone}</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {/* Selected Customer Preview */}
                    {selectedCustomerId && customerName && (
                      <div className="mt-3 p-3 bg-blue-100 rounded-md border border-blue-200">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-blue-900">{customerName}</span>
                        </div>
                        {customerPhone && (
                          <p className="text-sm text-blue-700 mt-1">Phone: {customerPhone}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* New Customer Form */}
                {isNewCustomer && (
                  <div className="space-y-3 p-3 bg-green-50 rounded-md border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Adding New Customer</span>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Enter full name"
                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:border-green-500 focus:ring-green-500/20 focus:outline-none bg-white"
                        required
                        autoFocus
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        Phone Number (Optional)
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="e.g. 0712345678"
                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:border-green-500 focus:ring-green-500/20 focus:outline-none bg-white"
                      />
                    </div>
                    
                    <div className="text-xs text-green-600 bg-green-100 p-2 rounded">
                      💡 This customer will be automatically saved to your customers list
                    </div>
                  </div>
                )}
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