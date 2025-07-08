import { useState, useMemo } from "react";
import useData from "@/hooks/useData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Users, Edit3, CreditCard, RefreshCw, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { CustomerForm } from "@/components/customers/customer-form";
import { PaymentModal } from "@/components/customers/payment-modal";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Customers() {
  // Use instrumented data hook with real-time updates and logging
  const { items: customers, refresh, debug, clearDebug, isLoading, user } = useData('customers');
  const { toast } = useToast();
  
  // Local state for UI interactions
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentCustomer, setPaymentCustomer] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  // Filter and sort customers based on search and filter criteria
  const filteredCustomers = useMemo(() => {
    let filtered = customers.filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const balance = parseFloat(customer.balance || '0');
      
      switch (filterBy) {
        case "credit":
          return matchesSearch && balance > 0;
        case "no-credit":
          return matchesSearch && balance === 0;
        default:
          return matchesSearch;
      }
    });

    // Sort by balance (highest first), then by name
    filtered.sort((a, b) => {
      const balanceA = parseFloat(a.balance || '0');
      const balanceB = parseFloat(b.balance || '0');
      if (balanceB !== balanceA) {
        return balanceB - balanceA;
      }
      return a.name.localeCompare(b.name);
    });

    return filtered;
  }, [customers, searchTerm, filterBy]);

  // Add customer with comprehensive logging
  const handleAddCustomer = async (customerData) => {
    console.log('[Customers] handleAddCustomer start:', customerData);
    
    if (!user?.id) {
      console.error('[Customers] No user for customer creation');
      return toast.error('Authentication required');
    }

    try {
      console.log('[Customers] Adding customer optimistically:', customerData);
      
      const { data, error } = await supabase
        .from('customers')
        .insert([{ ...customerData, store_id: user.id }])
        .select()
        .single();

      if (error) {
        console.error('[Customers] Customer creation error:', error);
        throw error;
      }

      console.log('[Customers] Customer created successfully:', data);
      
      // Force refresh to ensure latest data
      await refresh();
      toast.success('Customer added successfully');
      setShowCustomerForm(false);
      setEditingCustomer(null);
      
    } catch (error) {
      console.error('[Customers] handleAddCustomer failed:', error);
      toast.error(`Failed to add customer: ${error.message}`);
    }
  };

  // Update customer with comprehensive logging
  const handleUpdateCustomer = async (customerData) => {
    console.log('[Customers] handleUpdateCustomer start:', customerData);
    
    if (!editingCustomer?.id || !user?.id) {
      console.error('[Customers] Missing customer ID or user for update');
      return toast.error('Invalid customer or authentication required');
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .update(customerData)
        .eq('id', editingCustomer.id)
        .eq('store_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('[Customers] Customer update error:', error);
        throw error;
      }

      console.log('[Customers] Customer updated successfully:', data);
      
      // Force refresh to ensure latest data
      await refresh();
      toast.success('Customer updated successfully');
      setShowCustomerForm(false);
      setEditingCustomer(null);
      
    } catch (error) {
      console.error('[Customers] handleUpdateCustomer failed:', error);
      toast.error(`Failed to update customer: ${error.message}`);
    }
  };

  // Delete customer with comprehensive logging
  const handleDeleteCustomer = async () => {
    console.log('[Customers] handleDeleteCustomer start:', customerToDelete);
    
    if (!customerToDelete?.id || !user?.id) {
      console.error('[Customers] Missing customer ID or user for deletion');
      return toast.error('Invalid customer or authentication required');
    }

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerToDelete.id)
        .eq('store_id', user.id);

      if (error) {
        console.error('[Customers] Customer deletion error:', error);
        throw error;
      }

      console.log('[Customers] Customer deleted successfully:', customerToDelete);
      
      // Force refresh to ensure latest data
      await refresh();
      toast.success('Customer deleted successfully');
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
      
    } catch (error) {
      console.error('[Customers] handleDeleteCustomer failed:', error);
      toast.error(`Failed to delete customer: ${error.message}`);
    }
  };

  // Record payment with comprehensive logging
  const handleRecordPayment = async (paymentAmount) => {
    console.log('[Customers] handleRecordPayment start:', { paymentCustomer, paymentAmount });
    
    if (!paymentCustomer?.id || !user?.id) {
      console.error('[Customers] Missing customer ID or user for payment');
      return toast.error('Invalid customer or authentication required');
    }

    try {
      const currentBalance = parseFloat(paymentCustomer.balance || '0');
      const payment = parseFloat(paymentAmount);
      const newBalance = Math.max(0, currentBalance - payment);

      console.log('[Customers] Recording payment:', {
        customerId: paymentCustomer.id,
        currentBalance,
        payment,
        newBalance
      });

      const { data, error } = await supabase
        .from('customers')
        .update({ balance: newBalance.toString() })
        .eq('id', paymentCustomer.id)
        .eq('store_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('[Customers] Payment recording error:', error);
        throw error;
      }

      console.log('[Customers] Payment recorded successfully:', data);
      
      // Force refresh to ensure latest data
      await refresh();
      toast.success(`Payment of ${formatCurrency(payment)} recorded successfully`);
      setShowPaymentModal(false);
      setPaymentCustomer(null);
      
    } catch (error) {
      console.error('[Customers] handleRecordPayment failed:', error);
      toast.error(`Failed to record payment: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Customers</h1>
              <p className="text-sm text-muted-foreground">
                Manage your customer database ({customers.length} customers)
                {isLoading && <span className="text-orange-500"> • Updating...</span>}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowDebug(!showDebug)}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                {showDebug ? 'Hide' : 'Show'} Debug
              </Button>
              
              <Button
                onClick={refresh}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button
                onClick={() => setShowCustomerForm(true)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </div>
          </div>
          
          {/* Debug Panel */}
          {showDebug && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Debug Logs</h3>
                <Button onClick={clearDebug} variant="outline" size="sm">
                  Clear
                </Button>
              </div>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap max-h-40 overflow-y-auto">
                {debug.length === 0 ? 'No debug logs yet...' : debug.join('\n')}
              </pre>
            </div>
          )}
          
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background text-foreground"
              >
                <option value="all">All Customers</option>
                <option value="credit">With Credit</option>
                <option value="no-credit">No Credit</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Customers Grid */}
      <div className="container mx-auto px-4 py-6">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {customers.length === 0 ? 'No customers yet' : 'No customers match your search'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {customers.length === 0 
                ? 'Add your first customer to get started'
                : 'Try adjusting your search terms or filters'
              }
            </p>
            {customers.length === 0 && (
              <Button onClick={() => setShowCustomerForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Customer
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map((customer) => {
              const balance = parseFloat(customer.balance || '0');
              
              return (
                <div
                  key={customer.id}
                  className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{customer.name}</h3>
                      {customer.phone && (
                        <p className="text-sm text-muted-foreground">📞 {customer.phone}</p>
                      )}
                      {customer.email && (
                        <p className="text-sm text-muted-foreground">✉️ {customer.email}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingCustomer(customer);
                          setShowCustomerForm(true);
                        }}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      
                      {balance > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPaymentCustomer(customer);
                            setShowPaymentModal(true);
                          }}
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCustomerToDelete(customer);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Credit Balance:</span>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(balance)}
                        </span>
                        {balance > 0 && (
                          <Badge variant="destructive">Credit</Badge>
                        )}
                        {balance === 0 && (
                          <Badge variant="secondary">Clear</Badge>
                        )}
                      </div>
                    </div>
                    
                    {customer.location && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Location:</span>
                        <span className="text-sm">{customer.location}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Added:</span>
                      <span className="text-sm">
                        {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Customer Form Modal */}
      {showCustomerForm && (
        <CustomerForm
          customer={editingCustomer}
          isOpen={showCustomerForm}
          onClose={() => {
            setShowCustomerForm(false);
            setEditingCustomer(null);
          }}
          onSubmit={editingCustomer ? handleUpdateCustomer : handleAddCustomer}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && paymentCustomer && (
        <PaymentModal
          customer={paymentCustomer}
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setPaymentCustomer(null);
          }}
          onSubmit={handleRecordPayment}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{customerToDelete?.name}"? This action cannot be undone and will remove all their purchase history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCustomerToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCustomer}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}