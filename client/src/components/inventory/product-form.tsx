import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { type InsertProduct, type Product } from "@/types/schema";
import { useToast } from "@/hooks/use-toast";
import { useRuntimeData } from "@/hooks/useRuntimeData";
import { useCRUDMutations } from "@/hooks/useCRUDMutations";
import {
  Dialog,
  DialogContent,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
}

export function ProductForm({ open, onOpenChange, product }: ProductFormProps) {
  const { toast } = useToast();
  const { refetchProducts } = useRuntimeData();
  const { createProductMutation, updateProductMutation } = useCRUDMutations();
  const [unknownQuantity, setUnknownQuantity] = useState(false);

  const form = useForm<InsertProduct>({
    defaultValues: {
      name: "",
      sku: "",
      description: "",
      price: "0",
      costPrice: "0",
      stock: 0,
      category: "",
      lowStockThreshold: 10,
      unknownQuantity: false,
    },
  });

  // Reset form with product data when editing
  useEffect(() => {
    if (product) {
      const hasUnknownQuantity = product.stock === null;
      setUnknownQuantity(hasUnknownQuantity);
      form.reset({
        name: product.name || "",
        sku: product.sku || "",
        description: product.description || "",
        price: product.price || "0",
        costPrice: (product.cost_price || 0).toString(),
        stock: hasUnknownQuantity ? 0 : (product.stock || 0),
        category: product.category || "",
        lowStockThreshold: product.lowStockThreshold || 10,
        unknownQuantity: hasUnknownQuantity,
      });
    } else {
      // Reset to empty form when creating new product
      setUnknownQuantity(false);
      form.reset({
        name: "",
        sku: "",
        description: "",
        price: "0",
        costPrice: "0",
        stock: 0,
        category: "",
        lowStockThreshold: 10,
        unknownQuantity: false,
      });
    }
  }, [product, form]);

  // Handle form submission
  const onSubmit = async (data: InsertProduct) => {
    try {
      if (product) {
        // Editing existing product
        await updateProductMutation.mutateAsync({
          id: product.id,
          updates: {
            name: data.name,
            sku: data.sku,
            description: data.description,
            price: parseFloat(data.price),
            cost_price: parseFloat(data.costPrice),
            stock: unknownQuantity ? null : data.stock,
            category: data.category || 'General',
            low_stock_threshold: data.lowStockThreshold,
          }
        });
      } else {
        // Creating new product
        await createProductMutation.mutateAsync({
          name: data.name,
          sku: data.sku,
          description: data.description,
          price: parseFloat(data.price),
          cost_price: parseFloat(data.costPrice),
          stock: unknownQuantity ? null : data.stock,
          category: data.category || 'General',
          low_stock_threshold: data.lowStockThreshold,
          sales_count: 0,
        });
      }
      
      // Force refresh the products data to ensure UI shows the new/updated product
      await refetchProducts();
      
      // Show success message
      toast({
        title: "Success",
        description: `Product ${product ? 'updated' : 'created'} successfully`,
      });
      
      // Reset form and close dialog on success
      onOpenChange(false);
      form.reset();
      setUnknownQuantity(false);
      
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Error",
        description: `Failed to ${product ? 'update' : 'create'} product: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-6 border-b border-gray-100 dark:border-gray-700">
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {product ? "Edit Product" : "Add New Product"}
          </DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {product ? "Update the product information below" : "Fill in the details to add a new product to your inventory"}
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Product Name *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Enter product name"
                        className="h-10 text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">SKU (Product Code) *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="e.g. PROD001, TEA001"
                        className="h-10 text-base"
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-gray-500 dark:text-gray-400">Must be unique for each product</p>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value ?? ""} 
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder="Enter product description (optional)"
                        className="min-h-[80px] text-base resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Pricing & Stock Information</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Selling Price (KES) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          {...field} 
                          placeholder="0.00"
                          className="h-10 text-base"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="costPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Cost Price (KES) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          {...field} 
                          placeholder="0.00"
                          className="h-10 text-base"
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-gray-500 dark:text-gray-400">Used for profit calculations</p>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Stock Quantity {unknownQuantity && "(Disabled)"}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          value={unknownQuantity ? "" : (field.value || "")}
                          placeholder={unknownQuantity ? "Unknown quantity" : "Enter stock quantity"}
                          disabled={unknownQuantity}
                          onChange={(e) => {
                            if (!unknownQuantity) {
                              const value = e.target.value;
                              // Allow empty string to be handled properly
                              if (value === "") {
                                field.onChange(0);
                              } else {
                                const numValue = parseInt(value);
                                field.onChange(isNaN(numValue) ? 0 : Math.max(0, numValue));
                              }
                            }
                          }}
                          className={`h-10 text-base ${unknownQuantity ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400" : ""}`}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Unknown Quantity Toggle */}
              <div className="relative bg-gradient-to-r from-accent-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200 dark:border-purple-700 rounded-xl p-5 transition-all duration-200 hover:shadow-md">
                <div className="flex items-start space-x-4">
                  <div className="relative">
                    <Checkbox
                      id="unknown-quantity"
                      checked={unknownQuantity}
                      onCheckedChange={(checked) => {
                        setUnknownQuantity(checked === true);
                        form.setValue("unknownQuantity", checked === true);
                        if (checked) {
                          form.setValue("stock", 0);
                        }
                      }}
                      className="w-5 h-5 data-[state=checked]:bg-accent data-[state=checked]:border-accent data-[state=checked]:text-white border-2 border-purple-300 dark:border-accent rounded-md transition-all duration-200 hover:border-purple-400 dark:hover:border-accent-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label
                      htmlFor="unknown-quantity"
                      className="block text-sm font-semibold text-purple-900 dark:text-purple-100 leading-tight cursor-pointer hover:text-purple-700 dark:hover:text-purple-200 transition-colors"
                    >
                      Unknown Quantity
                    </label>
                    <p className="text-xs text-accent dark:text-purple-300 mt-2 leading-relaxed">
                      Check this for items measured in variable units (e.g., sacks sold by cups, services, or bulk items)
                    </p>
                  </div>
                </div>
                {/* Visual accent */}
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-accent-500 to-indigo-500 rounded-l-xl"></div>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Additional Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="e.g. Beverages, Food"
                          className="h-10 text-base"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lowStockThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Low Stock Alert</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          placeholder="10"
                          className="h-10 text-base"
                          disabled={unknownQuantity}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Alert when stock falls below this level
                      </p>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100 dark:border-gray-700 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createProductMutation.isPending || updateProductMutation.isPending}
                className="h-10 px-6 text-base"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createProductMutation.isPending || updateProductMutation.isPending}
                className="h-10 px-6 text-base bg-accent hover:bg-purple-700 text-white font-medium shadow-sm"
              >
                {createProductMutation.isPending || updateProductMutation.isPending
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
  );
}
