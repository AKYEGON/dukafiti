import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, User, Phone, DollarSign, CreditCard, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatCurrency } from "@/lib/utils";
import { CustomerForm } from "@/components/customers/customer-form";
import { useToast } from "@/hooks/use-toast";
import type { Customer } from "@shared/schema";

export default function Customers() {
  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [showPaymentPanel, setShowPaymentPanel] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const recordPayment = useMutation({
    mutationFn: async (data: { customerId: number; amount: string; method: string }) => {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to record payment");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setShowPaymentPanel(false);
      setSelectedCustomerId("");
      setPaymentAmount("");
      setPaymentMethod("");
      toast({
        title: "Payment Recorded",
        description: data.message,
        className: "bg-green-600 text-foreground",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record payment",
        variant: "destructive",
      });
    },
  });

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !paymentAmount || !paymentMethod) {
      return;
    }
    recordPayment.mutate({
      customerId: parseInt(selectedCustomerId),
      amount: paymentAmount,
      method: paymentMethod,
    });
  };

  const selectedCustomer = customers?.find(c => c.id.toString() === selectedCustomerId);
  const isPaymentFormValid = selectedCustomerId && paymentAmount && paymentMethod;

  if (isLoading) {
    return (
      <div className="space-y-6">
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-card border-border animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded mb-4 w-2/3"></div>
                <div className="h-6 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button 
          onClick={() => setShowNewCustomerForm(true)}
          className="btn-purple"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Customer
        </Button>
      </div>

      {customers && customers.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center">
            <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No customers yet</h3>
            <p className="text-muted-foreground mb-4">
              Start building your customer base by adding your first customer.
            </p>
            <Button 
              onClick={() => setShowNewCustomerForm(true)}
              className="bg-green-600 hover:bg-green-700 text-foreground"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Customer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {customers?.map((customer) => (
            <Card 
              key={customer.id} 
              className="bg-card border-border hover:bg-gray-750 transition-colors cursor-pointer"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">
                        {customer.name}
                      </h3>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-gray-300">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">{customer.phone}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-400">Outstanding Balance:</span>
                  </div>
                  <div className="text-right">
                    <span 
                      className={`text-lg font-bold ${
                        Number(customer.balance) > 0 
                          ? 'text-green-400' 
                          : 'text-gray-300'
                      }`}
                    >
                      {formatCurrency(customer.balance)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Record Payment Section */}
      <Collapsible open={showPaymentPanel} onOpenChange={setShowPaymentPanel}>
        <Card className="bg-card border-border">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-750 transition-colors">
              <CardTitle className="flex items-center justify-between text-foreground">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Record Payment</span>
                </div>
                {showPaymentPanel ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="customer" className="text-foreground">Customer</Label>
                    <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                      <SelectTrigger className="bg-muted border-gray-600 text-foreground">
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent className="bg-muted border-gray-600">
                        {customers?.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name} - {customer.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="amount" className="text-foreground">Amount (KES)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="0.00"
                      className="bg-muted border-gray-600 text-foreground placeholder-muted-foreground"
                    />
                  </div>
                  <div>
                    <Label htmlFor="method" className="text-foreground">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="bg-muted border-gray-600 text-foreground">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent className="bg-muted border-gray-600">
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="mobileMoney">Mobile Money</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {selectedCustomer && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-gray-300">
                      Recording payment for: <span className="text-foreground font-medium">{selectedCustomer.name}</span>
                    </p>
                    <p className="text-sm text-gray-300">
                      Current balance: <span className="text-foreground font-medium">{formatCurrency(selectedCustomer.balance)}</span>
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowPaymentPanel(false)}
                    className="border-gray-600 text-gray-300 hover:bg-muted"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={!isPaymentFormValid || recordPayment.isPending}
                    className="bg-green-600 hover:bg-green-700 text-foreground disabled:opacity-50"
                  >
                    {recordPayment.isPending ? "Recording..." : "Save Payment"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <CustomerForm 
        open={showNewCustomerForm} 
        onOpenChange={setShowNewCustomerForm} 
      />
    </div>
  );
}