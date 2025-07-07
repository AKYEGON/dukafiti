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
import { RefreshButton } from "@/components/ui/refresh-button";
import { useComprehensiveRealtimeFixed } from "@/hooks/useComprehensiveRealtimeFixed";

type SortOption = "name-asc" | "name-desc" | "price-asc" | "price-desc";

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [deleteProductState, setDeleteProductState] = useState<Product | undefined>();
  const [restockProduct, setRestockProduct] = useState<Product | undefined>();

  // Use comprehensive real-time hook for all operations - FIXED VERSION
  const {
    products,
    productsLoading: isLoading,
    productsError: error,
    refreshProducts: refresh,
    deleteProductMutation,
    restockProductMutation,
    pendingOperations,
    isConnected
  } = useComprehensiveRealtimeFixed();

  const filteredAndSortedProducts = useMemo(() => {
    // First search, then sort
    const searchedProducts = searchProducts(search);
    return sortProducts(sortBy).filter(product => 
      searchedProducts.some(sp => sp.id === product.id)
    );
  }, [products, search, sortBy, searchProducts, sortProducts]);

  // Enhanced handlers with logging and state management
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
    console.log('✖️ Closing product form');
    setShowProductForm(false);
    setEditingProduct(undefined);
  }, []);

  const handleRestockClose = useCallback(() => {
    console.log('✖️ Closing restock modal');
    setRestockProduct(undefined);
  }, []);

  // Real-time subscriptions for inventory changes
  useEffect(() => {
    console.log('🔄 Setting up real-time inventory subscriptions');
    
    const handleProductChanges = (payload: any) => {
      console.log('📡 Real-time product change:', payload.eventType, payload.new?.name || payload.old?.name);
      
      // Force refresh inventory data
      setTimeout(() => {
        refresh();
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      }, 100);
    };

    const channel = supabase
      .channel('inventory-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'products'
      }, handleProductChanges)
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up real-time subscriptions');
      supabase.removeChannel(channel);
    };
  }, [refresh, queryClient]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1F1F1F]">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-[#1F1F1F]/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Inventory
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage your product inventory
              {(isLoading || pendingOperations > 0) && (
                <span className="ml-2 text-orange-600 dark:text-orange-400">• Updating...</span>
              )}
              {!isConnected && (
                <span className="ml-2 text-red-600 dark:text-red-400">• Offline</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <RefreshButton
              onRefresh={refresh}
              isLoading={isLoading || pendingOperations > 0}
              size="sm"
              variant="outline"
            />
            <Button 
              onClick={() => setShowProductForm(true)} 
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Search and Sort Bar */}
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
            <Input
              placeholder="Search by name, SKU, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-accent-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-accent-500/20 dark:focus:ring-purple-400/20 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg"
              aria-label="Search products by name, SKU, or category"
            />
          </div>
          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger className="w-full sm:w-48 h-12 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-accent-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-accent-500/20 dark:focus:ring-purple-400/20 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200">
              <SelectValue placeholder="Sort by Name/Qty/Price" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="price-asc">Price (Low to High)</SelectItem>
              <SelectItem value="price-desc">Price (High to Low)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>



      {/* Main Content with Professional Grid Layout */}
      <div className="px-6 py-6">
        {isLoading ? (
          /* Loading Skeleton */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-32 border-l-4 border-gray-300"></div>
            ))}
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {search ? "No products found" : "No products available"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {search ? "Try adjusting your search terms" : "Add your first product to get started"}
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
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-blue-600 transition-colors"
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
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-red-600 transition-colors"
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
        onOpenChange={(open) => !open && setRestockProduct(undefined)}
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
            <AlertDialogCancel disabled={deleteProductMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProductState && deleteProductMutation.mutate(deleteProductState.id)}
              disabled={deleteProductMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteProductMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
