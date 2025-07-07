import { useState, useMemo, useCallback } from "react";
import { type Product } from "@/types/schema";
import { ProductForm } from "@/components/inventory/product-form";
import { RestockModal } from "@/components/inventory/restock-modal";
import { RefreshButton } from "@/components/ui/refresh-button";

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
import { Search, Package, Edit, Trash2, Plus, PackagePlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRuntimeData } from "@/hooks/useRuntimeData";
import { useRuntimeOperations } from "@/hooks/useRuntimeOperations";

type SortOption = "name-asc" | "name-desc" | "price-asc" | "price-desc";

export default function Inventory() {
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [deleteProductState, setDeleteProductState] = useState<Product | undefined>();
  const [restockProduct, setRestockProduct] = useState<Product | undefined>();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");

  // Use runtime data and operations hooks
  const {
    products,
    productsLoading: isLoading,
    productsError: error,
    fetchProducts: refresh,
    isConnected
  } = useRuntimeData();

  const {
    deleteProduct,
    restockProduct: restockProductOperation
  } = useRuntimeOperations();

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
    return filtered.sort((a, b) => {
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

  // Enhanced handlers with immediate feedback
  const handleEdit = useCallback((product: Product) => {
    console.log('✏️ Editing product:', product.id, product.name);
    setEditingProduct(product);
    setShowProductForm(true);
  }, []);

  const handleDelete = useCallback((product: Product) => {
    console.log('🗑️ Preparing to delete product:', product.id, product.name);
    setDeleteProductState(product);
  }, []);

  const handleRestock = useCallback((product: Product) => {
    console.log('📦 Preparing to restock product:', product.id, product.name);
    setRestockProduct(product);
  }, []);

  const handleFormClose = useCallback(() => {
    setShowProductForm(false);
    setEditingProduct(undefined);
  }, []);

  const handleRestockClose = useCallback(() => {
    setRestockProduct(undefined);
  }, []);

  // Confirm delete with runtime operation
  const confirmDelete = useCallback(async () => {
    if (deleteProductState) {
      await deleteProduct(deleteProductState.id);
      setDeleteProductState(undefined);
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

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-[150px]" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#1F1F1F] rounded-lg shadow-lg p-6">
              <Skeleton className="h-6 w-[150px] mb-2" />
              <Skeleton className="h-4 w-[100px] mb-4" />
              <Skeleton className="h-4 w-[120px]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <Package className="w-12 h-12 text-gray-400 mx-auto" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Failed to load inventory
          </h3>
          <p className="text-gray-500 dark:text-gray-400">{error.message}</p>
          <Button onClick={refresh}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6 p-2 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Inventory Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your products and stock levels
            {isLoading && (
              <span className="ml-2 text-sm text-blue-600 dark:text-blue-400">
                • Updating...
              </span>
            )}
            {!isConnected && (
              <span className="ml-2 text-sm text-red-600 dark:text-red-400">
                • Offline
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <RefreshButton onClick={refresh} />
          <Button 
            onClick={() => setShowProductForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search products by name, SKU, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
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

      {/* Products Grid */}
      <div className="flex-1 overflow-auto">
        {filteredAndSortedProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {search ? "No products found" : "No products yet"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {search 
                ? "Try adjusting your search criteria"
                : "Start by adding your first product to the inventory"
              }
            </p>
            {!search && (
              <Button 
                onClick={() => setShowProductForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Add your first product
              </Button>
            )}
          </div>
        ) : (
          /* Product Grid - Desktop: 3 columns, Tablet: 2 columns, Mobile: 1 column */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedProducts.map((product) => {
              const isLowStock = product.stock !== null && product.stock <= (product.lowStockThreshold || 10);
              
              return (
                <div
                  key={product.id}
                  tabIndex={0}
                  className={`bg-white dark:bg-[#1F1F1F] rounded-lg shadow-lg hover:shadow-xl dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] hover:dark:shadow-[0_6px_16px_rgba(0,0,0,0.7)] transition-shadow duration-200 border-l-4 ${
                    isLowStock ? 'border-red-500' : 'border-green-500'
                  } relative focus:outline-none focus:ring-2 focus:ring-accent-500 cursor-pointer`}
                  aria-label={`Product: ${product.name}`}
                >
                  {/* Action Buttons - Top Right Corner */}
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
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-green-600 transition-colors"
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

                  <div className="p-6 pr-20">
                    {/* Product Name */}
                    <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-gray-100">
                      {product.name}
                    </h3>
                    
                    {/* Price */}
                    <p className="text-base text-gray-700 dark:text-gray-300 mb-3">
                      KES {parseFloat(product.price).toLocaleString()}
                    </p>
                    
                    {/* Quantity and Threshold on same line */}
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {product.stock !== null ? (
                        <span>Qty: {product.stock} | Min: {product.lowStockThreshold || 10}</span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          Unknown quantity
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Form Dialog */}
      <ProductForm
        open={showProductForm}
        onOpenChange={handleFormClose}
        product={editingProduct}
      />

      {/* Restock Modal */}
      <RestockModal
        product={restockProduct || null}
        open={!!restockProduct}
        onOpenChange={(open) => !open && handleRestockClose()}
      />

      {/* Delete Confirmation Dialog */}
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