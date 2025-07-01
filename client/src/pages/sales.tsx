import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingCart, Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ProductSearch } from "@/components/sales/product-search";
import { MiniCart } from "@/components/sales/mini-cart";
import { PaymentMethodSelector } from "@/components/sales/payment-method-selector";
import { type SaleLineItem } from "@/components/sales/sale-line-item";
import { type Product, type InsertOrder, type InsertOrderItem } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";

export default function Sales() {
  const [cartItems, setCartItems] = useState<SaleLineItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createSaleMutation = useMutation({
    mutationFn: async (saleData: { 
      items: any[]; 
      paymentMethod: string; 
      customerInfo?: { name: string; phone?: string }; 
      customerName?: string;
    }) => {
      const response = await apiRequest("POST", "/api/sales", saleData);
      return response.json();
    },
    onSuccess: (result: any) => {
      toast({ 
        title: result.message || "Sale completed successfully!", 
        description: `Order #${result.order.id} for ${formatCurrency(result.order.total)}`
      });
      setCartItems([]);
      setCustomerName("");
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || "Failed to complete sale";
      toast({ title: errorMessage, variant: "destructive" });
    },
  });

  const handleProductSelect = (product: Product) => {
    const existingItem = cartItems.find(item => item.product.id === product.id);
    
    if (existingItem) {
      // Increment quantity if product already in cart
      handleQuantityChange(existingItem.id, existingItem.quantity + 1);
    } else {
      // Add new item to cart
      const newItem: SaleLineItem = {
        id: `${product.id}-${Date.now()}`,
        product,
        quantity: 1,
        unitPrice: product.price,
        total: product.price,
      };
      setCartItems(prev => [...prev, newItem]);
    }
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const total = (parseFloat(item.unitPrice) * newQuantity).toFixed(2);
        return { ...item, quantity: newQuantity, total };
      }
      return item;
    }));
  };

  const handleRemoveItem = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleClearCart = () => {
    setCartItems([]);
    setCustomerName("");
  };

  const handlePaymentSelected = (method: 'cash' | 'mpesa' | 'credit', customerInfo?: { name: string; phone?: string }) => {
    if (cartItems.length === 0) {
      toast({ title: "Cart is empty", variant: "destructive" });
      return;
    }

    // Check for stock issues
    const stockIssues = cartItems.filter(item => item.quantity > item.product.stock);
    if (stockIssues.length > 0) {
      toast({ 
        title: "Stock issue", 
        description: "Please adjust quantities for items that exceed available stock.",
        variant: "destructive" 
      });
      return;
    }

    const saleData = {
      items: cartItems.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.unitPrice,
      })),
      paymentMethod: method,
      customerInfo,
      customerName: customerName || "Walk-in Customer",
    };

    createSaleMutation.mutate(saleData);
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + parseFloat(item.total), 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#00AA00]/10 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-[#00AA00]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-black">Sales</h1>
            <p className="text-gray-600">Create new sales and manage transactions</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="border-[#00AA00]/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#00AA00]/10 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-[#00AA00]" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Sale</p>
                <p className="font-semibold text-black">{formatCurrency(cartTotal.toFixed(2))}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#00AA00]/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#00AA00]/10 rounded-full flex items-center justify-center">
                <Plus className="w-4 h-4 text-[#00AA00]" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Items in Cart</p>
                <p className="font-semibold text-black">{totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#00AA00]/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#00AA00]/10 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#00AA00]" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-semibold text-[#00AA00]">
                  {cartItems.length > 0 ? 'In Progress' : 'Ready'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Product Search and Customer */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card className="border-2 border-[#00AA00]/20">
            <CardHeader>
              <CardTitle className="text-lg">Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name (Optional)
                  </label>
                  <input
                    id="customerName"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name or leave blank for walk-in"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-[#00AA00] focus:ring-[#00AA00]/20 focus:outline-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Search */}
          <Card className="border-2 border-[#00AA00]/20">
            <CardHeader>
              <CardTitle className="text-lg">Add Products to Sale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ProductSearch onProductSelect={handleProductSelect} />
                <p className="text-sm text-gray-500">
                  Search by product name, SKU, or category. Click on a product to add it to your sale.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Cart and Payment */}
        <div className="space-y-6">
          <MiniCart
            items={cartItems}
            onQuantityChange={handleQuantityChange}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onCheckout={() => {}} // Disabled - payment method selector handles this
            isProcessing={createSaleMutation.isPending}
          />
          
          {cartItems.length > 0 && (
            <PaymentMethodSelector
              total={cartTotal}
              onPaymentSelected={handlePaymentSelected}
              isProcessing={createSaleMutation.isPending}
            />
          )}
        </div>
      </div>
    </div>
  );
}