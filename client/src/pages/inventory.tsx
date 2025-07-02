import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Product } from "@shared/schema";
import { MobilePageWrapper } from "@/components/layout/mobile-page-wrapper";
import { ProductForm } from "@/components/inventory/product-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Plus, Search, Edit, Trash2, Package } from "lucide-react";
import { formatCurrency, getStockStatusColor, getStockStatusText } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [deleteProduct, setDeleteProduct] = useState<Product | undefined>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: search ? ["/api/products", { search }] : ["/api/products"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({ title: "Product deleted successfully" });
      setDeleteProduct(undefined);
    },
    onError: () => {
      toast({ title: "Failed to delete product", variant: "destructive" });
    },
  });

  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.sku.toLowerCase().includes(search.toLowerCase()) ||
    product.category.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleDelete = (product: Product) => {
    setDeleteProduct(product);
  };

  const handleFormClose = () => {
    setShowProductForm(false);
    setEditingProduct(undefined);
  };

  return (
    <MobilePageWrapper title="Inventory">
      <div className="space-y-6">
        {/* Mobile-first search and add button */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-12 text-base"
            />
          </div>
          <Button
            onClick={() => setShowProductForm(true)}
            className="w-full h-12 text-base bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Product
          </Button>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl leading-relaxed">Product Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="flex flex-col items-center space-y-2">
                      <Package className="h-8 w-8 text-gray-400" />
                      <p className="text-gray-500">
                        {search ? "No products found matching your search" : "No products available"}
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <Card
                      key={product.id}
                      interactive
                      className={`p-4 mb-2 mobile-compact ${
                        product.stock <= product.lowStockThreshold ? 'border-2 border-yellow-500' : ''
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-foreground">{product.name}</h3>
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => handleEdit(product)}
                              className="btn-purple mr-2"
                              aria-label={`Edit ${product.name}`}
                            >
                              Edit
                            </Button>
                            <Button
                              onClick={() => handleDelete(product)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md transition-all duration-200"
                              aria-label={`Delete ${product.name}`}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                          <div>
                            <span className="font-medium">Price:</span> KES {parseFloat(product.price).toLocaleString()}
                          </div>
                          <div>
                            <span className="font-medium">Quantity:</span> {product.stock} units
                          </div>
                          <div>
                            <span className="font-medium">Threshold:</span> {product.lowStockThreshold} units
                          </div>
                          <div>
                            <span className="font-medium">Category:</span> {product.category}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product Form Dialog */}
      <ProductForm
        open={showProductForm}
        onOpenChange={handleFormClose}
        product={editingProduct}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteProduct?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProduct && deleteMutation.mutate(deleteProduct.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MobilePageWrapper>
  );
}
