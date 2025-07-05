import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Wallet, Smartphone, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { recordCustomerRepayment } from "@/lib/supabase-data";
import type { Customer } from "@shared/schema";

interface RecordRepaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  previousPayments?: Array<{ date: string; amount: string; method: string }>;
}

export function RecordRepaymentModal({ isOpen, onClose, customer, previousPayments = [] }: RecordRepaymentModalProps) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"cash" | "mobileMoney">("cash");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resetForm = () => {
    setAmount("");
    setMethod("cash");
    setNote("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const paymentAmount = parseFloat(amount);
    const totalOwed = parseFloat(customer.balance || "0");
    
    if (!amount || paymentAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }
    
    if (paymentAmount > totalOwed) {
      toast({
        title: "Amount Too High",
        description: "Payment amount cannot exceed total debt",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await recordCustomerRepayment(
        customer.id,
        paymentAmount,
        method,
        note.trim() || undefined
      );
      
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      
      toast({
        title: "Payment Recorded",
        description: `Repayment of ${formatCurrency(paymentAmount)} recorded successfully`,
        className: "bg-green-600 text-white",
      });
      
      onClose();
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to record payment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      resetForm();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={handleClose}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                    Record Repayment for {customer.name}
                  </DialogTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="h-8 w-8 p-0"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Customer Debt Info */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Owed:</span>
                    <span className="text-lg font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(parseFloat(customer.balance || "0"))}
                    </span>
                  </div>
                  
                  {previousPayments.length > 0 && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Recent Payments:</p>
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {previousPayments.slice(0, 3).map((payment, index) => (
                          <div key={index} className="flex justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">{payment.date}</span>
                            <span className="text-green-600 dark:text-green-400">
                              +{formatCurrency(parseFloat(payment.amount))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                {/* Payment Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Repayment Amount *
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={customer.balance}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="text-lg border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500"
                    aria-label="Payment amount"
                    required
                  />
                </div>

                {/* Payment Method */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Payment Method *
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMethod("cash")}
                      className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                        method === "cash"
                          ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                          : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                      }`}
                      aria-label="Cash payment method"
                    >
                      <Wallet className="h-6 w-6 mb-2" />
                      <span className="text-sm font-medium">Cash</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setMethod("mobileMoney")}
                      className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                        method === "mobileMoney"
                          ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                          : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                      }`}
                      aria-label="Mobile money payment method"
                    >
                      <Smartphone className="h-6 w-6 mb-2" />
                      <span className="text-sm font-medium">Mobile Money</span>
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="note" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Note or Reference (Optional)
                  </Label>
                  <Textarea
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add any notes or reference details..."
                    className="resize-none border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500"
                    rows={3}
                    aria-label="Payment note"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="flex-1 border-gray-300 dark:border-gray-600"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!amount || isLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white min-h-[48px]"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Recording...
                      </div>
                    ) : (
                      "Save Payment"
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}