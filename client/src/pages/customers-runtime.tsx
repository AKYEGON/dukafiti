import { useState, useMemo, useCallback } from "react";
import { type Customer } from "@/types/schema";
import { useDirectSupabase } from "@/hooks/useDirectSupabase";
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Edit, Trash2, RefreshCw, DollarSign, Phone, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  balance: z.string().default("0")
});

type CustomerFormData = z.infer<typeof customerSchema>;

export default function CustomersRuntime() {
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>();
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | undefined>();
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  // Direct Supabase hook for runtime data
  const {
    items: customers,
    loading: isLoading,
    error,
    addItem: addCustomer,
    updateItem: updateCustomer,
    deleteItem: deleteCustomerItem,
    refresh
  } = useDirectSupabase<Customer>({ 
    table: 'customers',
    orderBy: 'name',
    ascending: true
  });

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      phone: "",
      balance: "0"
    }
  });

  // Search filtering
  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    
    if (!search.trim()) return customers;
    
    const searchTerm = search.toLowerCase();
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm) ||
      customer.phone.toLowerCase().includes(searchTerm)
    );
  }, [customers, search]);

  // Form handlers with runtime operations
  const handleSubmit = useCallback(async (data: CustomerFormData) => {
    const customerData = {
      name: data.name,
      phone: data.phone,
      balance: parseFloat(data.balance) || 0
    };

    let success = false;
    if (editingCustomer) {
      success = await updateCustomer(editingCustomer.id, customerData);
    } else {
      success = await addCustomer(customerData);
    }

    if (success) {
      setShowForm(false);
      setEditingCustomer(undefined);
      form.reset();
    }
  }, [editingCustomer, updateCustomer, addCustomer, form]);

  const handleEdit = useCallback((customer: Customer) => {
    setEditingCustomer(customer);
    form.setValue("name", customer.name);
    form.setValue("phone", customer.phone);
    form.setValue("balance", customer.balance?.toString() || "0");
    setShowForm(true);
  }, [form]);

  const handleDelete = useCallback((customer: Customer) => {
    setDeleteCustomer(customer);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (deleteCustomer) {
      const success = await deleteCustomerItem(deleteCustomer.id);
      if (success) {
        setDeleteCustomer(undefined);
      }
    }
  }, [deleteCustomer, deleteCustomerItem]);

  const handleRecordPayment = useCallback(async (customer: Customer) => {
    const paymentAmount = prompt(`Enter payment amount for ${customer.name}:`);
    if (paymentAmount && !isNaN(parseFloat(paymentAmount))) {
      const amount = parseFloat(paymentAmount);
      const newBalance = Math.max(0, (customer.balance || 0) - amount);
      
      const success = await updateCustomer(customer.id, { balance: newBalance });
      if (success) {
        toast({
          title: "Payment recorded",
          description: `KES ${amount.toLocaleString()} payment recorded for ${customer.name}`
        });
      }
    }
  }, [updateCustomer, toast]);

  const openAddForm = useCallback(() => {
    setEditingCustomer(undefined);
    form.reset();
    setShowForm(true);
  }, [form]);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </div>
          <Skeleton className="h-10 w-[120px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[200px] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-red-600">Error Loading Customers</h2>
          <p className="text-gray-600">{error}</p>
          <Button onClick={refresh}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6 p-6 bg-gray-50/50 dark:bg-gray-900/30">
      {/* Header with Runtime Refresh */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Customer Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {filteredCustomers.length} customers • Runtime Data
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={refresh}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button
              onClick={openAddForm}
              className="bg-brand hover:bg-brand-700 text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Customer
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search customers by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600"
          />
        </div>
      </div>

      {/* Customers Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-24 h-24 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <User className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {search ? "No customers found" : "No customers yet"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              {search 
                ? "Try adjusting your search terms." 
                : "Start by adding your first customer."
              }
            </p>
            {!search && (
              <Button
                onClick={openAddForm}
                className="bg-brand hover:bg-brand-700 text-white"
              >
                Add First Customer
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="group relative bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {customer.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      {customer.phone}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(customer)}
                      className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-brand transition-colors"
                      aria-label="Edit customer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(customer)}
                      className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-red-600 transition-colors"
                      aria-label="Delete customer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Balance:</span>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className={`font-medium ${
                        (customer.balance || 0) > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        KES {(customer.balance || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  {(customer.balance || 0) > 0 && (
                    <Badge variant="secondary" className="w-full justify-center">
                      Credit Customer
                    </Badge>
                  )}
                  
                  {(customer.balance || 0) > 0 && (
                    <Button
                      onClick={() => handleRecordPayment(customer)}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Record Payment
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Customer Form Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? "Edit Customer" : "Add New Customer"}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer ? "Update customer information" : "Add a new customer to your store"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter customer name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Balance (KES)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-brand hover:bg-brand-700">
                  {editingCustomer ? "Update Customer" : "Add Customer"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteCustomer} onOpenChange={() => setDeleteCustomer(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteCustomer?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}