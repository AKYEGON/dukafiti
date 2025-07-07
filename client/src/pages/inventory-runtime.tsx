import { useState, useMemo, useCallback } from "react";
import { type Product } from "@/types/schema";
import { useDirectSupabase } from "@/hooks/useDirectSupabase";
import { ProductForm } from "@/components/inventory/product-form";
import { RestockModal } from "@/components/inventory/restock-modal";
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, PackagePlus, Edit, Trash2, RefreshCw } from "lucide-react";

type SortOption = "name-asc" | "name-desc" | "price-asc" | "price-desc";

export default function InventoryRuntime() {
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [deleteProductState, setDeleteProductState] = useState<Product | undefined>();
  const [restockProduct, setRestockProduct] = useState<Product | undefined>();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const { toast } = useToast();

  // Direct Supabase hook for runtime data
  const {
    items: products,
    loading: isLoading,
    error,
    addItem: addProduct,
    updateItem: updateProduct,
    deleteItem: deleteProduct,
    refresh
  } = useDirectSupabase<Product>({ 
    table: 'products',
    orderBy: 'name',
    ascending: true
  });

  // Search and sort logic
  const filteredAndSortedProducts = useMemo(() => {
    if (!products) return [];
    
    let filtered = products;
    
    // Apply search filter
    if (search.trim()) {
      const searchTerm = search.toLowerCase();
      filtered = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        (product.sku && product.sku.toLowerCase().includes(searchTerm)) ||
        (product.category && product.category.toLowerCase().includes(searchTerm))
      );
    }
    
    // Apply sorting
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "price-asc":
          return parseFloat(a.price) - parseFloat(b.price);
        case "price-desc":
          return parseFloat(b.price) - parseFloat(a.price);
        default:
          return 0;
      }
    });
  }, [products, search, sortBy]);

  // Form handlers with runtime operations
  const handleProductSubmit = useCallback(async (productData: Partial<Product>) => {
    if (editingProduct) {
      const success = await updateProduct(editingProduct.id, productData);
      if (success) {
        setEditingProduct(undefined);
        setShowProductForm(false);
      }
    } else {
      const success = await addProduct(productData);
      if (success) {
        setShowProductForm(false);
      }
    }
  }, [editingProduct, updateProduct, addProduct]);

  const handleEdit = useCallback((product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  }, []);

  const handleDelete = useCallback((product: Product) => {
    setDeleteProductState(product);
  }, []);

  const handleRestock = useCallback((product: Product) => {
    setRestockProduct(product);
  }, []);

  const handleRestockSubmit = useCallback(async (productId: string, quantity: number, cost?: number) => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('No user found');

      const product = products.find(p => p.id === productId);
      if (!product) throw new Error('Product not found');

      const newStock = (product.stock || 0) + quantity;
      const updates: Partial<Product> = { stock: newStock };
      
      if (cost !== undefined) {
        updates.cost_price = cost.toString();
      }

      const success = await updateProduct(productId, updates);
      if (success) {
        setRestockProduct(undefined);
      }
    } catch (error) {
      console.error('Restock error:', error);
      toast({
        title: "Error",
        description: "Failed to restock product",
        variant: "destructive"
      });
    }
  }, [products, updateProduct, toast]);

  const handleRestockClose = useCallback(() => {
    setRestockProduct(undefined);
  }, []);

  // Confirm delete with runtime operation
  const confirmDelete = useCallback(async () => {
    if (deleteProductState) {
      const success = await deleteProduct(deleteProductState.id);
      if (success) {
        setDeleteProductState(undefined);
      }
    }
  }, [deleteProductState, deleteProduct]);

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
          <h2 className="text-xl font-semibold text-red-600">Error Loading Inventory</h2>
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
              Inventory Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {filteredAndSortedProducts.length} products • Runtime Data
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
              onClick={() => setShowProductForm(true)}
              className="bg-brand hover:bg-brand-700 text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Search and Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search products, SKU, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600"
            />
          </div>
          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger className="w-full sm:w-[200px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="price-asc">Price (Low-High)</SelectItem>
              <SelectItem value="price-desc">Price (High-Low)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Grid */}
      {filteredAndSortedProducts.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-24 h-24 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <Plus className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {search ? "No products found" : "No products yet"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              {search 
                ? "Try adjusting your search terms or filters." 
                : "Start building your inventory by adding your first product."
              }
            </p>
            {!search && (
              <Button
                onClick={() => setShowProductForm(true)}
                className="bg-brand hover:bg-brand-700 text-white"
              >
                Add First Product
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedProducts.map((product) => (
            <Card key={product.id} className="group relative bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-brand">
              <CardContent className="p-6">
                <div className="space-y-3">
                  {/* Product Info */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight">
                        {product.name}
                      </h3>
                    </div>
                    
                    {product.sku && (
                      <Badge variant="secondary" className="text-xs">
                        SKU: {product.sku}
                      </Badge>
                    )}
                    
                    {product.category && (
                      <Badge variant="outline" className="text-xs">
                        {product.category}
                      </Badge>
                    )}
                  </div>

                  {/* Price and Stock */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Price:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        KES {parseFloat(product.price).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Stock:</span>
                      <span className={`font-medium ${
                        product.stock === null 
                          ? 'text-gray-500' 
                          : product.stock <= 5 
                            ? 'text-red-600' 
                            : 'text-green-600'
                      }`}>
                        {product.stock === null ? "—" : product.stock}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="absolute top-4 right-4 flex gap-1">
                    <button
                      onClick={() => handleRestock(product)}
                      disabled={false}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50"
                      aria-label="Add stock"
                    >
                      <PackagePlus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-brand transition-colors"
                      aria-label="Edit product"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      disabled={false}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
                      aria-label="Delete product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Product Form Modal */}
      <ProductForm
        open={showProductForm}
        onOpenChange={setShowProductForm}
        product={editingProduct}
        onSubmit={handleProductSubmit}
      />

      {/* Restock Modal */}
      {restockProduct && (
        <RestockModal
          open={!!restockProduct}
          onOpenChange={handleRestockClose}
          product={restockProduct}
          onSubmit={handleRestockSubmit}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteProductState} onOpenChange={() => setDeleteProductState(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteProductState?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={false}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={false}
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