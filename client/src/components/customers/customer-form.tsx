import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import type { Customer } from "@/lib/types";

const customerFormSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  phone: z.string().optional(),
  balance: z.string().optional()
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
      balance: ""
    }
  });

  // Reset form when customer prop changes
  useEffect(() => {
    if (customer) {
      form.reset({
        name: customer.name || "",
        phone: customer.phone || "",
        balance: customer.balance || ""
      });
    } else {
      form.reset({
        name: "",
        phone: "",
        balance: ""
      });
    }
  }, [customer, form]);

  const createCustomer = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone || null,
          balance: data.balance || "0.00"
        })
      });
      if (!response.ok) throw new Error("Failed to create customer");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Success",
        description: "Customer created successfully"
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create customer: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const updateCustomer = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      if (!customer) throw new Error("No customer to update");
      const response = await apiRequest(`/api/customers/${customer.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: data.name,
          phone: data.phone || null,
          balance: data.balance || "0.00"
        })
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Success",
        description: "Customer updated successfully"
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update customer: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: CustomerFormData) => {
    if (customer) {
      updateCustomer.mutate(data);
    } else {
      createCustomer.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {customer ? "Edit Customer" : "Add New Customer"}
          </DialogTitle>
        </DialogHeader>

        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., +254700000000" {...field} />
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
                      <FormLabel>Initial Credit Balance (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., 500.00" 
                          type="number"
                          step="0.01"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createCustomer.isPending || updateCustomer.isPending}
                  >
                    {createCustomer.isPending || updateCustomer.isPending
                      ? "Saving..." 
                      : customer 
                        ? "Update Customer" 
                        : "Add Customer"
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}