import { useState, useMemo } from "react";
import useData from "@/hooks/useData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, ShoppingCart, Minus, RefreshCw, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { ConfirmationModal } from "@/components/sales/confirmation-modal";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export default function Sales() {
  // Use instrumented data hooks for real-time updates and logging
  const { items: products, refresh: refreshProducts, debug: productsDebug, isLoading: productsLoading, user } = useData('products');
  const { items: customers, refresh: refreshCustomers, debug: customersDebug, isLoading: customersLoading } = useData('customers');
  
  const { toast } = useToast();
  
  // Local state for cart and UI interactions
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // Combine debug logs from both hooks
  const allDebugLogs = [...productsDebug, ...customersDebug];

  // Filter products for quick select and search
  const availableProducts = useMemo(() => {
    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  // Top selling products for quick select (mock for now)
  const quickSelectProducts = useMemo(() => {
    return products.slice(0, 6);
  }, [products]);

  // Calculate cart totals
  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  // Add product to cart with comprehensive logging
  const addToCart = (product) => {
    console.log('[Sales] addToCart start:', product);
    
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        console.log('[Sales] Incrementing existing cart item:', existingItem);
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        console.log('[Sales] Adding new item to cart:', product);
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  // Update cart item quantity with comprehensive logging
  const updateCartQuantity = (productId, newQuantity) => {
    console.log('[Sales] updateCartQuantity:', { productId, newQuantity });
    
    if (newQuantity <= 0) {
      setCart(prevCart => prevCart.filter(item => item.id !== productId));
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === productId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  // Remove item from cart
  const removeFromCart = (productId) => {
    console.log('[Sales] removeFromCart:', productId);
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  // Clear entire cart
  const clearCart = () => {
    console.log('[Sales] clearCart');
    setCart([]);
  };

  // Process sale with comprehensive logging
  const processSale = async (saleData) => {
    console.log('[Sales] processSale start:', saleData);
    
    if (!user?.id) {
      console.error('[Sales] No user for sale processing');
      return toast.error('Authentication required');
    }

    if (cart.length === 0) {
      console.error('[Sales] Empty cart for sale processing');
      return toast.error('Cart is empty');
    }

    try {
      // Validate stock levels first (except for unknown quantity items)
      for (const cartItem of cart) {
        const product = products.find(p => p.id === cartItem.id);
        if (product && product.quantity !== null && product.quantity < cartItem.quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.quantity}, Requested: ${cartItem.quantity}`);
        }
      }

      // Create order
      console.log('[Sales] Creating order...');
      const orderData = {
        store_id: user.id,
        customer_name: saleData.customer || 'Walk-in Customer',
        total_amount: cartTotal,
        payment_method: paymentMethod,
        status: paymentMethod === 'credit' ? 'pending' : 'completed'
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (orderError) {
        console.error('[Sales] Order creation error:', orderError);
        throw orderError;
      }

      console.log('[Sales] Order created successfully:', order);

      // Create order items
      console.log('[Sales] Creating order items...');
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('[Sales] Order items creation error:', itemsError);
        throw itemsError;
      }

      console.log('[Sales] Order items created successfully');

      // Update product stock levels (only for items with known quantities)
      console.log('[Sales] Updating product stock levels...');
      for (const cartItem of cart) {
        const product = products.find(p => p.id === cartItem.id);
        if (product && product.quantity !== null) {
          const newQuantity = Math.max(0, product.quantity - cartItem.quantity);
          
          const { error: stockError } = await supabase
            .from('products')
            .update({ quantity: newQuantity })
            .eq('id', cartItem.id)
            .eq('store_id', user.id);

          if (stockError) {
            console.error('[Sales] Stock update error:', stockError);
            throw stockError;
          }

          console.log('[Sales] Stock updated for product:', cartItem.id, 'new quantity:', newQuantity);
        }
      }

      // Handle credit sales - update customer balance
      if (paymentMethod === 'credit' && saleData.customer && saleData.customer !== 'Walk-in Customer') {
        console.log('[Sales] Processing credit sale...');
        
        // Find or create customer
        let customer = customers.find(c => c.name === saleData.customer);
        
        if (!customer) {
          console.log('[Sales] Creating new customer for credit sale:', saleData.customer);
          const { data: newCustomer, error: customerError } = await supabase
            .from('customers')
            .insert([{
              name: saleData.customer,
              store_id: user.id,
              balance: cartTotal.toString()
            }])
            .select()
            .single();

          if (customerError) {
            console.error('[Sales] Customer creation error:', customerError);
            throw customerError;
          }
          
          customer = newCustomer;
          console.log('[Sales] New customer created:', customer);
        } else {
          // Update existing customer balance
          const currentBalance = parseFloat(customer.balance || '0');
          const newBalance = currentBalance + cartTotal;
          
          console.log('[Sales] Updating customer balance:', {
            customerId: customer.id,
            currentBalance,
            newBalance
          });

          const { error: balanceError } = await supabase
            .from('customers')
            .update({ balance: newBalance.toString() })
            .eq('id', customer.id)
            .eq('store_id', user.id);

          if (balanceError) {
            console.error('[Sales] Customer balance update error:', balanceError);
            throw balanceError;
          }
        }

        await refreshCustomers();
      }

      // Refresh all data to reflect changes immediately
      console.log('[Sales] Refreshing all data...');
      await Promise.all([refreshProducts(), refreshCustomers()]);

      // Clear cart and show success
      clearCart();
      setShowConfirmation(false);
      toast.success(`Sale completed successfully! Total: ${formatCurrency(cartTotal)}`);
      
      console.log('[Sales] Sale completed successfully');
      
    } catch (error) {
      console.error('[Sales] processSale failed:', error);
      toast.error(`Failed to process sale: ${error.message}`);
    }
  };

  // Manual refresh all data
  const refreshAllData = async () => {
    console.log('[Sales] Manual refresh triggered');
    await Promise.all([refreshProducts(), refreshCustomers()]);
  };

  if (productsLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto">
          <Skeleton className="h-12 w-full mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
            <Skeleton className="h-96 w-full" />
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
              <h1 className="text-2xl font-bold text-foreground">Point of Sale</h1>
              <p className="text-sm text-muted-foreground">
                Process sales and manage transactions
                {(productsLoading || customersLoading) && <span className="text-orange-500"> • Updating...</span>}
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
                onClick={refreshAllData}
                variant="outline"
                size="sm"
                disabled={productsLoading || customersLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${(productsLoading || customersLoading) ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              {cart.length > 0 && (
                <Button
                  onClick={clearCart}
                  variant="destructive"
                  size="sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Cart
                </Button>
              )}
            </div>
          </div>
          
          {/* Debug Panel */}
          {showDebug && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Debug Logs (Products & Customers)</h3>
                <Button onClick={() => {}} variant="outline" size="sm">
                  Clear
                </Button>
              </div>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap max-h-40 overflow-y-auto">
                {allDebugLogs.length === 0 ? 'No debug logs yet...' : allDebugLogs.join('\n')}
              </pre>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Selection */}
          <div className="space-y-6">
            {/* Quick Select Products */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Quick Select</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {quickSelectProducts.map((product) => (
                  <Button
                    key={product.id}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center text-center"
                    onClick={() => addToCart(product)}
                    disabled={product.quantity === 0}
                  >
                    <span className="font-medium text-sm">{product.name}</span>
                    <span className="text-xs text-muted-foreground">{formatCurrency(product.price)}</span>
                    {product.quantity !== null && (
                      <Badge variant={product.quantity > 0 ? "secondary" : "destructive"} className="mt-1">
                        {product.quantity > 0 ? `${product.quantity} left` : "Out of stock"}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            {/* Product Search */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Search Products</h2>
              
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products by name, SKU, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{formatCurrency(product.price)}</p>
                      {product.quantity !== null && (
                        <p className="text-xs text-muted-foreground">Stock: {product.quantity}</p>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => addToCart(product)}
                      disabled={product.quantity === 0}
                      size="sm"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {searchTerm && availableProducts.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No products found matching "{searchTerm}"
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Cart and Checkout */}
          <div className="space-y-6">
            {/* Cart */}
            <div className="border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Cart ({cartItemCount} items)</h2>
                {cart.length > 0 && (
                  <Button onClick={clearCart} variant="ghost" size="sm">
                    Clear All
                  </Button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Your cart is empty</p>
                  <p className="text-sm text-muted-foreground">Add products to get started</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(item.price)} each
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                            variant="outline"
                            size="sm"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          
                          <span className="w-12 text-center">{item.quantity}</span>
                          
                          <Button
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                            variant="outline"
                            size="sm"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            onClick={() => removeFromCart(item.id)}
                            variant="ghost"
                            size="sm"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total:</span>
                      <span>{formatCurrency(cartTotal)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Payment Method */}
            {cart.length > 0 && (
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
                
                <div className="grid grid-cols-3 gap-2 mb-6">
                  <Button
                    variant={paymentMethod === "cash" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("cash")}
                  >
                    Cash
                  </Button>
                  
                  <Button
                    variant={paymentMethod === "mobileMoney" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("mobileMoney")}
                  >
                    Mobile Money
                  </Button>
                  
                  <Button
                    variant={paymentMethod === "credit" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("credit")}
                  >
                    Credit
                  </Button>
                </div>

                <Button
                  onClick={() => setShowConfirmation(true)}
                  className="w-full"
                  size="lg"
                  disabled={cart.length === 0}
                >
                  Complete Sale - {formatCurrency(cartTotal)}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <ConfirmationModal
          cart={cart}
          total={cartTotal}
          paymentMethod={paymentMethod}
          isOpen={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          onConfirm={processSale}
        />
      )}
    </div>
  );
}