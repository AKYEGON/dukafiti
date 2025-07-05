import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";
import { createCustomer, updateCustomer, deleteCustomer } from "@/lib/supabase-data";
import type { Customer } from "@shared/schema";

const customerFormSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  phone: z.string().min(1, "Phone number is required").regex(/^[0-9+\-\s()]+$/, "Please enter a valid phone number"),
  balance: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

interface CustomerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer;
}

export function CustomerForm({ open, onOpenChange, customer }: CustomerFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      balance: "",
    },
  });

  // Reset form when customer prop changes
  useEffect(() => {
    if (customer) {
      form.reset({
        name: customer.name || "",
        phone: customer.phone || "",
        balance: customer.balance || "",
      });
    } else {
      form.reset({
        name: "",
        phone: "",
        balance: "",
      });
    }
  }, [customer, form]);

  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: CustomerFormData) => {
    setIsLoading(true);
    
    try {
      const customerData = {
        ...data,
        balance: data.balance && data.balance.trim() !== "" ? parseFloat(data.balance) : 0,
      };
      
      if (customer) {
        await updateCustomer(customer.id, customerData);
        toast({
          title: "Success",
          description: "Customer updated successfully",
        });
      } else {
        await createCustomer(customerData);
        toast({
          title: "Success",
          description: "Customer created successfully",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save customer",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customer) return;
    
    setIsLoading(true);
    
    try {
      await deleteCustomer(customer.id);
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {customer ? "Edit Customer" : "Add New Customer"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Customer name" 
                      {...field} 
                      className="bg-input border-border text-foreground placeholder-muted-foreground"
                    />
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
                  <FormLabel className="text-foreground">Phone Number</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="0712345678" 
                      {...field} 
                      className="bg-input border-border text-foreground placeholder-muted-foreground"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {!customer && (
              <FormField
                control={form.control}
                name="balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Initial Debt Amount (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                          KES
                        </span>
                        <Input 
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00" 
                          {...field} 
                          value={field.value || ''}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                          }}
                          className="bg-input border-border text-foreground placeholder-muted-foreground pl-12"
                        />
                      </div>
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter amount if customer already owes money
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-between space-x-2 pt-4">
              {customer && (
                <Button 
                  type="button" 
                  variant="destructive"
                  onClick={handleDeleteCustomer}
                  disabled={isLoading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isLoading ? "Deleting..." : "Delete"}
                </Button>
              )}
              
              <div className="flex space-x-2 ml-auto">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  className="border-border text-muted-foreground hover:bg-input"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-foreground"
                >
                  {isLoading ? "Saving..." : customer ? "Update Customer" : "Add Customer"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}