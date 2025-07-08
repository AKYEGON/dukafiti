import { useState, useMemo } from "react";
import useData from "@/hooks/useData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Package, Edit3, PackagePlus, RefreshCw, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { ProductForm } from "@/components/inventory/product-form";
import { RestockModal } from "@/components/inventory/restock-modal";
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

export default function Inventory() {
  // Use instrumented data hook with real-time updates and logging
  const { items: products, refresh, debug, clearDebug, isLoading, user } = useData('products');
  const { toast } = useToast();
  
  // Local state for UI interactions
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockingProduct, setRestockingProduct] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // Filter and sort products based on search and sort criteria
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price":
          return a.price - b.price;
        case "stock":
          return (a.quantity || 0) - (b.quantity || 0);
        case "low-stock":
          return (a.quantity || 0) - (b.quantity || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, searchTerm, sortBy]);

  // Add product with comprehensive logging
  const handleAddProduct = async (productData) => {
    console.log('[Inventory] handleAddProduct start:', productData);
    
    if (!user?.id) {
      console.error('[Inventory] No user for product creation');
      return toast.error('Authentication required');
    }

    try {
      // Optimistic update
      const tempProduct = { 
        ...productData, 
        id: `temp-${Date.now()}`, 
        store_id: user.id,
        created_at: new Date().toISOString()
      };
      
      console.log('[Inventory] Adding product optimistically:', tempProduct);
      
      const { data, error } = await supabase
        .from('products')
        .insert([{ ...productData, store_id: user.id }])
        .select()
        .single();

      if (error) {
        console.error('[Inventory] Product creation error:', error);
        throw error;
      }

      console.log('[Inventory] Product created successfully:', data);
      
      // Force refresh to ensure latest data
      await refresh();
      toast.success('Product added successfully');
      setShowProductForm(false);
      setEditingProduct(null);
      
    } catch (error) {
      console.error('[Inventory] handleAddProduct failed:', error);
      toast.error(`Failed to add product: ${error.message}`);
    }
  };

  // Update product with comprehensive logging
  const handleUpdateProduct = async (productData) => {
    console.log('[Inventory] handleUpdateProduct start:', productData);
    
    if (!editingProduct?.id || !user?.id) {
      console.error('[Inventory] Missing product ID or user for update');
      return toast.error('Invalid product or authentication required');
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id)
        .eq('store_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('[Inventory] Product update error:', error);
        throw error;
      }

      console.log('[Inventory] Product updated successfully:', data);
      
      // Force refresh to ensure latest data
      await refresh();
      toast.success('Product updated successfully');
      setShowProductForm(false);
      setEditingProduct(null);
      
    } catch (error) {
      console.error('[Inventory] handleUpdateProduct failed:', error);
      toast.error(`Failed to update product: ${error.message}`);
    }
  };

  // Delete product with comprehensive logging
  const handleDeleteProduct = async () => {
    console.log('[Inventory] handleDeleteProduct start:', productToDelete);
    
    if (!productToDelete?.id || !user?.id) {
      console.error('[Inventory] Missing product ID or user for deletion');
      return toast.error('Invalid product or authentication required');
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete.id)
        .eq('store_id', user.id);

      if (error) {
        console.error('[Inventory] Product deletion error:', error);
        throw error;
      }

      console.log('[Inventory] Product deleted successfully:', productToDelete);
      
      // Force refresh to ensure latest data
      await refresh();
      toast.success('Product deleted successfully');
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      
    } catch (error) {
      console.error('[Inventory] handleDeleteProduct failed:', error);
      toast.error(`Failed to delete product: ${error.message}`);
    }
  };

  // Restock product with comprehensive logging
  const handleRestock = async (productId, quantity, buyingPrice) => {
    console.log('[Inventory] handleRestock start:', { productId, quantity, buyingPrice });
    
    if (!user?.id) {
      console.error('[Inventory] No user for restock');
      return toast.error('Authentication required');
    }

    try {
      const product = products.find(p => p.id === productId);
      if (!product) {
        console.error('[Inventory] Product not found for restock:', productId);
        throw new Error('Product not found');
      }

      const newQuantity = (product.quantity || 0) + parseInt(quantity);
      const updateData = { quantity: newQuantity };
      
      // Only update cost_price if provided and the column exists
      if (buyingPrice) {
        updateData.cost_price = parseFloat(buyingPrice);
      }

      console.log('[Inventory] Updating product with:', updateData);

      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId)
        .eq('store_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('[Inventory] Restock error:', error);
        throw error;
      }

      console.log('[Inventory] Restock successful:', data);
      
      // Force refresh to ensure latest data
      await refresh();
      toast.success(`Restocked ${quantity} units successfully`);
      setShowRestockModal(false);
      setRestockingProduct(null);
      
    } catch (error) {
      console.error('[Inventory] handleRestock failed:', error);
      toast.error(`Failed to restock: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-lg" />
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
              <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
              <p className="text-sm text-muted-foreground">
                Manage your product inventory ({products.length} items)
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
                onClick={() => setShowProductForm(true)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
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
                placeholder="Search products by name, SKU, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background text-foreground"
              >
                <option value="name">Sort by Name</option>
                <option value="price">Sort by Price</option>
                <option value="stock">Sort by Stock</option>
                <option value="low-stock">Low Stock First</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-6">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {products.length === 0 ? 'No products yet' : 'No products match your search'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {products.length === 0 
                ? 'Add your first product to get started'
                : 'Try adjusting your search terms'
              }
            </p>
            {products.length === 0 && (
              <Button onClick={() => setShowProductForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Product
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                    {product.sku && (
                      <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                    )}
                    {product.category && (
                      <Badge variant="secondary" className="mt-1">
                        {product.category}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingProduct(product);
                        setShowProductForm(true);
                      }}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setRestockingProduct(product);
                        setShowRestockModal(true);
                      }}
                    >
                      <PackagePlus className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setProductToDelete(product);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Price:</span>
                    <span className="font-medium">{formatCurrency(product.price)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Stock:</span>
                    <div className="flex items-center gap-2">
                      {product.quantity === null ? (
                        <Badge variant="secondary">Unknown Qty</Badge>
                      ) : (
                        <>
                          <span className="font-medium">{product.quantity}</span>
                          {product.quantity <= 10 && product.quantity > 0 && (
                            <Badge variant="destructive">Low Stock</Badge>
                          )}
                          {product.quantity === 0 && (
                            <Badge variant="destructive">Out of Stock</Badge>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  {product.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                      {product.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {showProductForm && (
        <ProductForm
          product={editingProduct}
          isOpen={showProductForm}
          onClose={() => {
            setShowProductForm(false);
            setEditingProduct(null);
          }}
          onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}
        />
      )}

      {/* Restock Modal */}
      {showRestockModal && restockingProduct && (
        <RestockModal
          product={restockingProduct}
          isOpen={showRestockModal}
          onClose={() => {
            setShowRestockModal(false);
            setRestockingProduct(null);
          }}
          onSubmit={handleRestock}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}