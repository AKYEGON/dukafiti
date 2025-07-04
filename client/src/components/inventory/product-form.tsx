import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { insertProductSchema, type InsertProduct, type Product } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface ProductFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product
};

export function ProductForm({ open, onOpenChange, product }: ProductFormProps) {;
  const { toast }  =  useToast();
  const queryClient = useQueryClient();
  const [unknownQuantity, setUnknownQuantity]  =  useState(false);
;
  const form = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: "",
      sku: "",
      description: "",
      price: "0",
      stock: 0,
      category: "",
      lowStockThreshold: 10,
      unknownQuantity: false
    }
  });

  // Reset form with product data when editing
  useEffect(() => {;
    if (product) {;
      const hasUnknownQuantity = product.stock  ===  null;
      setUnknownQuantity(hasUnknownQuantity);
      form.reset({
        name: product.name || "",
        sku: product.sku || "",
        description: product.description || "",
        price: product.price || "0",
        stock: hasUnknownQuantity ? 0 : (product.stock || 0),
        category: product.category || "",
        lowStockThreshold: product.lowStockThreshold || 10,
        unknownQuantity: hasUnknownQuantity
      })
    } else {
      // Reset to empty form when creating new product
      setUnknownQuantity(false);
      form.reset({
        name: "",
        sku: "",
        description: "",
        price: "0",
        stock: 0,
        category: "",
        lowStockThreshold: 10,
        unknownQuantity: false
      })
    }
  }, [product, form]);
;
  const createMutation = useMutation({
    mutationFn: async (data: InsertProduct) => {;
      const response = await apiRequest("POST", "/api/products", data);
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] })
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] })
      toast({ title: "Product created successfully" })
      onOpenChange(false);
      form.reset()
    },
    onError: (error: any) => {;
      const errorMessage = error?.response?.data?.message || "Failed to create product";
      toast({ title: errorMessage, variant: "destructive" })
    }
  });
;
  const updateMutation = useMutation({
    mutationFn: async (data: InsertProduct) => {;
      const response = await apiRequest("PUT", `/api/products/${product!.id}`, data);
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] })
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] })
      toast({ title: "Product updated successfully" })
      onOpenChange(false)
    },
    onError: (error: any) => {;
      const errorMessage = error?.response?.data?.message || "Failed to update product";
      toast({ title: errorMessage, variant: "destructive" })
    }
  });
;
  const onSubmit = (data: InsertProduct) => {
    // Handle unknown quantity logic;
    const processedData = {
      ...data,
      stock: unknownQuantity ? null : data.stock,
      unknownQuantity: unknownQuantity
    };
;
    if (product) {
      updateMutation.mutate(processedData)
    } else {
      createMutation.mutate(processedData)
    }
  };
;
  return (
    <Dialog open = {open} onOpenChange = {onOpenChange}>
      <DialogContent className = "sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className = "space-y-3 pb-6 border-b border-gray-100 dark:border-gray-700">
          <DialogTitle className = "text-xl font-semibold text-gray-900 dark:text-gray-100">
            {product ? "Edit Product" : "Add New Product"}
          </DialogTitle>
          <p className = "text-sm text-gray-600 dark:text-gray-400">
            {product ? "Update the product information below" : "Fill in the details to add a new product to your inventory"}
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit = {form.handleSubmit(onSubmit)} className = "space-y-6 pt-6">
            <div className = "space-y-4">
              <FormField
                control = {form.control}
                name = "name"
                render = {({ field }) => (
                  <FormItem>
                    <FormLabel className = "text-sm font-medium text-gray-700 dark:text-gray-300">Product Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder = "Enter product name"
                        className = "h-10 text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control = {form.control}
                name = "sku"
                render = {({ field }) => (
                  <FormItem>
                    <FormLabel className = "text-sm font-medium text-gray-700 dark:text-gray-300">SKU (Product Code) *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder = "e.g. PROD001, TEA001"
                        className = "h-10 text-base"
                      />
                    </FormControl>
                    <FormMessage />
                    <p className = "text-xs text-gray-500 dark:text-gray-400">Must be unique for each product</p>
                  </FormItem>
                )}
              />

              <FormField
                control = {form.control}
                name = "description"
                render = {({ field }) => (
                  <FormItem>
                    <FormLabel className = "text-sm font-medium text-gray-700 dark:text-gray-300">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value = {field.value ?? ""}
                        onChange = {(e) => field.onChange(e.target.value)}
                        placeholder = "Enter product description (optional)"
                        className = "min-h-[80px] text-base resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className = "border-t border-gray-100 dark:border-gray-700 pt-6">
              <h3 className = "text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Pricing & Stock Information</h3>

              <div className = "grid grid-cols-2 gap-4 mb-4">
                <FormField
                  control = {form.control}
                  name = "price"
                  render = {({ field }) => (
                    <FormItem>
                      <FormLabel className = "text-sm font-medium text-gray-700 dark:text-gray-300">Price (KES) *</FormLabel>
                      <FormControl>
                        <Input
                          type = "number"
                          step = "0.01"
                          {...field}
                          placeholder = "0.00"
                          className = "h-10 text-base"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control = {form.control}
                  name = "stock"
                  render = {({ field }) => (
                    <FormItem>
                      <FormLabel className = "text-sm font-medium text-gray-700 dark:text-gray-300">
                        Stock Quantity {unknownQuantity && "(Disabled)"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type = "number"
                          {...field}
                          value = {unknownQuantity ? "" : (field.value || "")}
                          placeholder = {unknownQuantity ? "Unknown quantity" : "Enter stock quantity"}
                          disabled = {unknownQuantity}
                          onChange = {(e) => {;
                            if (!unknownQuantity) {
                              field.onChange(parseInt(e.target.value) || 0)
                            }
                          }}
                          className = {`h-10 text-base ${unknownQuantity ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400" : ""}`}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Unknown Quantity Toggle */}
              <div className = "relative bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200 dark:border-purple-700 rounded-xl p-5 transition-all duration-200 hover:shadow-md">
                <div className = "flex items-start space-x-4">
                  <div className = "relative">
                    <Checkbox
                      id = "unknown-quantity"
                      checked = {unknownQuantity}
                      onCheckedChange = {(checked) => {
                        setUnknownQuantity(checked  ===  true);
                        form.setValue("unknownQuantity", checked  ===  true);
                        if (checked) {
                          form.setValue("stock", 0)
                        }
                      }}
                      className = "w-5 h-5 data-[state = checked]:bg-purple-600 data-[state = checked]:border-purple-600 data-[state = checked]:text-white border-2 border-purple-300 dark:border-purple-600 rounded-md transition-all duration-200 hover:border-purple-400 dark:hover:border-purple-500"
                    />
                  </div>
                  <div className = "flex-1">
                    <label
                      htmlFor = "unknown-quantity"
                      className = "block text-sm font-semibold text-purple-900 dark:text-purple-100 leading-tight cursor-pointer hover:text-purple-700 dark:hover:text-purple-200 transition-colors"
                    >
                      Unknown Quantity
                    </label>
                    <p className = "text-xs text-purple-600 dark:text-purple-300 mt-2 leading-relaxed">
                      Check this for items measured in variable units (e.g., sacks sold by cups, services, or bulk items)
                    </p>
                  </div>
                </div>
                {/* Visual accent */}
                <div className = "absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-indigo-500 rounded-l-xl"></div>
              </div>
            </div>

            <div className = "border-t border-gray-100 dark:border-gray-700 pt-6">
              <h3 className = "text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Additional Information</h3>

              <div className = "grid grid-cols-2 gap-4">
                <FormField
                  control = {form.control}
                  name = "category"
                  render = {({ field }) => (
                    <FormItem>
                      <FormLabel className = "text-sm font-medium text-gray-700 dark:text-gray-300">Category</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder = "e.g. Beverages, Food"
                          className = "h-10 text-base"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control = {form.control}
                  name = "lowStockThreshold"
                  render = {({ field }) => (
                    <FormItem>
                      <FormLabel className = "text-sm font-medium text-gray-700 dark:text-gray-300">Low Stock Alert</FormLabel>
                      <FormControl>
                        <Input
                          type = "number"
                          {...field}
                          onChange = {(e) => field.onChange(parseInt(e.target.value) || 0)}
                          placeholder = "10"
                          className = "h-10 text-base"
                          disabled = {unknownQuantity}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className = "text-xs text-gray-500 dark:text-gray-400">
                        Alert when stock falls below this level
                      </p>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className = "flex justify-end space-x-3 pt-6 border-t border-gray-100 dark:border-gray-700 mt-6">
              <Button
                type = "button"
                variant = "outline"
                onClick = {() => onOpenChange(false)}
                disabled = {createMutation.isPending || updateMutation.isPending}
                className = "h-10 px-6 text-base"
              >
                Cancel
              </Button>
              <Button
                type = "submit"
                disabled = {createMutation.isPending || updateMutation.isPending}
                className = "h-10 px-6 text-base bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-sm"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : product
                  ? "Update Product"
                  : "Add Product"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
