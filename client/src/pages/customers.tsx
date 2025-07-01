import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, User, Phone, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { CustomerForm } from "@/components/customers/customer-form";
import type { Customer } from "@shared/schema";

export default function Customers() {
  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Customer Directory</h1>
            <p className="text-muted-foreground">Manage your customer relationships</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-gray-800 border-gray-700 animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded mb-4 w-2/3"></div>
                <div className="h-6 bg-gray-700 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Directory</h1>
          <p className="text-muted-foreground">Manage your customer relationships</p>
        </div>
        <Button 
          onClick={() => setShowNewCustomerForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Customer
        </Button>
      </div>

      {customers && customers.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-12 text-center">
            <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No customers yet</h3>
            <p className="text-muted-foreground mb-4">
              Start building your customer base by adding your first customer.
            </p>
            <Button 
              onClick={() => setShowNewCustomerForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
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
              className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors cursor-pointer"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-lg">
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

      <CustomerForm 
        open={showNewCustomerForm} 
        onOpenChange={setShowNewCustomerForm} 
      />
    </div>
  );
}