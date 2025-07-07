import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { type Product, type Customer } from "@/types/schema";
import { useDirectSupabase } from "@/hooks/useDirectSupabase";
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  X, 
  RefreshCw,
  CreditCard,
  DollarSign,
  Smartphone
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface CartItem {
  productId: string;
  name: string;
  price: string;
  quantity: number;
  total: string;
  hasStock: boolean;
  currentStock: number | null;
}

const creditSaleSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerPhone: z.string().min(1, "Customer phone is required")
});

type CreditSaleFormData = z.infer<typeof creditSaleSchema>;

export default function SalesRuntime() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit' | 'mobileMoney'>('cash');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Direct Supabase hooks for runtime data
  const {
    items: products,
    loading: productsLoading,
    refresh: refreshProducts
  } = useDirectSupabase<Product>({ 
    table: 'products',
    orderBy: 'name',
    ascending: true
  });

  const {
    items: customers,
    loading: customersLoading,
    refresh: refreshCustomers,
    updateItem: updateCustomer
  } = useDirectSupabase<Customer>({ 
    table: 'customers',
    orderBy: 'name',
    ascending: true
  });

  const form = useForm<CreditSaleFormData>({
    resolver: zodResolver(creditSaleSchema),
    defaultValues: {
      customerName: "",
      customerPhone: ""
    }
  });

  // Get frequent products for quick select
  const frequentProducts = useMemo(() => {
    if (!products) return [];
    return products.slice(0, 6); // Top 6 for quick select
  }, [products]);

  // Search functionality
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    setSearchLoading(true);
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      const searchTerm = query.toLowerCase();
      const filtered = products?.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        (product.sku && product.sku.toLowerCase().includes(searchTerm)) ||
        (product.category && product.category.toLowerCase().includes(searchTerm))
      ) || [];

      setSearchResults(filtered.slice(0, 8)); // Limit to 8 results
      setShowSearchDropdown(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearchLoading(false);
    }
  }, [products]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  // Cart operations
  const addToCart = useCallback((product: Product) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.productId === product.id);
      
      if (existingItem) {
        return prev.map(item =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (parseFloat(product.price) * (item.quantity + 1)).toFixed(2)
              }
            : item
        );
      } else {
        return [...prev, {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          total: product.price,
          hasStock: product.stock !== null,
          currentStock: product.stock
        }];
      }
    });

    setSearchQuery('');
    setSearchResults([]);
    setShowSearchDropdown(false);

    toast({
      title: "Product added",
      description: `${product.name} added to cart`,
      className: "bg-brand-50 border-brand-200 text-brand-800",
      duration: 2000,
    });
  }, [toast]);

  const updateQuantity = useCallback((productId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCartItems(prev => prev.filter(item => item.productId !== productId));
    } else {
      setCartItems(prev => prev.map(item =>
        item.productId === productId
          ? {
              ...item,
              quantity: newQuantity,
              total: (parseFloat(item.price) * newQuantity).toFixed(2)
            }
          : item
      ));
    }
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCartItems(prev => prev.filter(item => item.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setPaymentMethod('cash');
  }, []);

  // Process sale with runtime operations
  const processSale = useCallback(async (saleData: any) => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('No user found');

      // Create order
      const orderData = {
        customer_name: saleData.customerName || "Walk-in Customer",
        customer_phone: saleData.customerPhone || "",
        total_amount: saleData.totalAmount,
        payment_method: saleData.paymentMethod,
        status: saleData.paymentMethod === 'credit' ? 'pending' : 'completed',
        store_id: user.data.user.id
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items and update stock
      for (const item of saleData.items) {
        // Insert order item
        const { error: itemError } = await supabase
          .from('order_items')
          .insert([{
            order_id: order.id,
            product_id: item.productId,
            quantity: item.quantity,
            price_at_sale: parseFloat(item.price),
            store_id: user.data.user.id
          }]);

        if (itemError) throw itemError;

        // Update product stock if applicable
        if (item.hasStock) {
          const product = products?.find(p => p.id === item.productId);
          if (product && product.stock !== null) {
            const newStock = Math.max(0, product.stock - item.quantity);
            const { error: stockError } = await supabase
              .from('products')
              .update({ stock: newStock })
              .eq('id', item.productId);

            if (stockError) throw stockError;
          }
        }
      }

      // Update customer balance for credit sales
      if (saleData.paymentMethod === 'credit' && saleData.customerName) {
        const customer = customers?.find(c => c.name === saleData.customerName);
        if (customer) {
          const newBalance = (customer.balance || 0) + saleData.totalAmount;
          await updateCustomer(customer.id, { balance: newBalance });
        } else {
          // Create new customer
          const { error: customerError } = await supabase
            .from('customers')
            .insert([{
              name: saleData.customerName,
              phone: saleData.customerPhone || "",
              balance: saleData.totalAmount,
              store_id: user.data.user.id
            }]);

          if (customerError) throw customerError;
        }
      }

      // Refresh all data
      await Promise.all([
        refreshProducts(),
        refreshCustomers()
      ]);

      return { success: true, order };
    } catch (error) {
      console.error('Sale processing error:', error);
      throw error;
    }
  }, [products, customers, updateCustomer, refreshProducts, refreshCustomers]);

  const handleConfirmSale = useCallback(async (formData?: CreditSaleFormData) => {
    const totalAmount = cartItems.reduce((sum, item) => sum + parseFloat(item.total), 0);
    
    const saleData = {
      totalAmount,
      paymentMethod,
      customerName: formData?.customerName || "",
      customerPhone: formData?.customerPhone || "",
      items: cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        hasStock: item.hasStock
      }))
    };

    setIsProcessingSale(true);
    try {
      await processSale(saleData);
      
      // Clear cart and close modal
      setShowConfirmationModal(false);
      setCartItems([]);
      setPaymentMethod('cash');
      form.reset();

      toast({
        title: "Sale completed successfully!",
        description: `Payment received via ${paymentMethod}`,
        className: "bg-brand-50 border-brand-200 text-brand-800",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Sale failed",
        description: "Please try again or contact support",
        variant: "destructive"
      });
    } finally {
      setIsProcessingSale(false);
    }
  }, [cartItems, paymentMethod, processSale, form, toast]);

  const cartTotal = cartItems.reduce((sum, item) => sum + parseFloat(item.total), 0);
  const isCartEmpty = cartItems.length === 0;
  const canProceed = !isCartEmpty && paymentMethod !== '';

  const handleSellButtonClick = () => {
    if (!canProceed) {
      if (isCartEmpty) {
        toast({ title: "Cart is empty", description: "Add items to start a sale", variant: "destructive" });
      } else {
        toast({ title: "Select payment method", variant: "destructive" });
      }
      return;
    }
    setShowConfirmationModal(true);
  };

  if (productsLoading || customersLoading) {
    return (
      <div className="h-full flex flex-col space-y-6 p-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] rounded-lg" />
          <Skeleton className="h-[400px] rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50/50 dark:bg-gray-900/30 pb-20 md:pb-6">
      {/* Header with Runtime Refresh */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-4 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Sales</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Runtime POS • {products?.length || 0} products</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                refreshProducts();
                refreshCustomers();
              }}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            {cartItems.length > 0 && (
              <Button
                onClick={clearCart}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Clear Cart
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* 1. Smart Search Bar */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              ref={searchInputRef}
              placeholder="Search products to add to cart..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 focus:border-brand rounded-lg"
            />
          </div>
          
          {/* Search Dropdown */}
          {showSearchDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-30 max-h-64 overflow-y-auto">
              {searchLoading ? (
                <div className="p-4 text-center text-gray-500">Searching...</div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No products found</div>
              ) : (
                searchResults.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900 dark:text-white">{product.name}</span>
                      <span className="text-brand font-semibold">KES {parseFloat(product.price).toLocaleString()}</span>
                    </div>
                    {product.stock !== null && (
                      <span className="text-xs text-gray-500">Stock: {product.stock}</span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* 2. Quick-Select Products Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Quick Select</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {frequentProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-brand hover:bg-brand/5 transition-colors text-left"
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{product.name}</div>
                <div className="text-xs text-brand font-semibold">KES {parseFloat(product.price).toLocaleString()}</div>
                {product.stock !== null && (
                  <div className="text-xs text-gray-500">Stock: {product.stock}</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Mini Cart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Cart ({cartItems.length})
              </h3>
              <div className="text-xl font-bold text-brand">
                KES {cartTotal.toLocaleString()}
              </div>
            </div>
          </div>
          
          <div className="p-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Cart is empty. Add products to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        KES {parseFloat(item.price).toLocaleString()} each
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="font-semibold text-brand w-20 text-right">
                        KES {parseFloat(item.total).toLocaleString()}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/50"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 4. Payment Method Selection */}
        {!isCartEmpty && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Payment Method</h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 rounded-lg border-2 transition-colors flex flex-col items-center gap-2 ${
                  paymentMethod === 'cash'
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <DollarSign className="h-5 w-5" />
                Cash
              </button>
              <button
                onClick={() => setPaymentMethod('mobileMoney')}
                className={`p-3 rounded-lg border-2 transition-colors flex flex-col items-center gap-2 ${
                  paymentMethod === 'mobileMoney'
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <Smartphone className="h-5 w-5" />
                M-Pesa
              </button>
              <button
                onClick={() => setPaymentMethod('credit')}
                className={`p-3 rounded-lg border-2 transition-colors flex flex-col items-center gap-2 ${
                  paymentMethod === 'credit'
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <CreditCard className="h-5 w-5" />
                Credit
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Sticky Sell Button */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <button
          ref={buttonRef}
          onClick={handleSellButtonClick}
          disabled={isProcessingSale}
          className={`w-full h-14 text-lg font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand ${
            canProceed && !isProcessingSale
              ? 'bg-brand hover:bg-brand-700 text-white transform active:scale-95'
              : 'bg-gray-400 text-gray-600 cursor-not-allowed'
          }`}
        >
          {isProcessingSale ? 'Processing...' : 'Complete Sale'}
        </button>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmationModal} onOpenChange={setShowConfirmationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Sale</DialogTitle>
            <DialogDescription>
              Review the sale details before completing the transaction.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium mb-2">Order Summary</h4>
              <div className="space-y-1 text-sm">
                {cartItems.map((item) => (
                  <div key={item.productId} className="flex justify-between">
                    <span>{item.name} x {item.quantity}</span>
                    <span>KES {parseFloat(item.total).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t mt-2 pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>KES {cartTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline">Payment: {paymentMethod}</Badge>
            </div>

            {paymentMethod === 'credit' && (
              <Form {...form}>
                <div className="space-y-4 border-t pt-4">
                  <FormField
                    control={form.control}
                    name="customerName"
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
                    name="customerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter customer phone" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Form>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmationModal(false)} disabled={isProcessingSale}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (paymentMethod === 'credit') {
                  form.handleSubmit(handleConfirmSale)();
                } else {
                  handleConfirmSale();
                }
              }}
              disabled={isProcessingSale}
              className="bg-brand hover:bg-brand-700"
            >
              {isProcessingSale ? 'Processing...' : 'Confirm Sale'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}