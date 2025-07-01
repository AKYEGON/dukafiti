import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingCart, Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ProductSearch } from "@/components/sales/product-search";
import { MiniCart } from "@/components/sales/mini-cart";
import { SaleConfirmationModal } from "@/components/sales/sale-confirmation-modal";
import { type SaleLineItem } from "@/components/sales/sale-line-item";
import { type Product } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";

export default function Sales() {
  const [cartItems, setCartItems] = useState<SaleLineItem[]>([]);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'credit' | ''>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createSaleMutation = useMutation({
    mutationFn: async (saleData: { 
      items: Array<{ productId: number; qty: number }>;
      paymentType: 'cash' | 'mpesa' | 'credit';
    }) => {
      const response = await apiRequest("POST", "/api/sales", saleData);
      return response.json();
    },
    onSuccess: (result: any) => {
      // Close modal and clear cart
      setShowConfirmationModal(false);
      setCartItems([]);
      setPaymentMethod('');
      
      // Invalidate products query to refresh stock levels
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
      // Show appropriate toast based on status
      const status = result.status;
      if (status === 'paid') {
        toast({ 
          title: "Sale recorded (Cash)", 
          description: `Sale #${result.saleId} completed successfully`,
          className: "bg-green-50 border-green-200 text-green-800",
          duration: 3000
        });
      } else if (status === 'pending') {
        toast({ 
          title: "Sale recorded – awaiting M-Pesa", 
          description: `Sale #${result.saleId} pending payment confirmation`,
          className: "bg-yellow-50 border-yellow-200 text-yellow-800",
          duration: 3000
        });
      } else if (status === 'credit') {
        toast({ 
          title: "Sale recorded (Credit)", 
          description: `Sale #${result.saleId} saved as credit sale`,
          className: "bg-green-50 border-green-200 text-green-800",
          duration: 3000
        });
      }
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
  };

  const handleSellClick = () => {
    if (cartItems.length === 0) {
      toast({ title: "Cart is empty", variant: "destructive" });
      return;
    }

    if (!paymentMethod) {
      toast({ title: "Please select a payment method", variant: "destructive" });
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

    setShowConfirmationModal(true);
  };

  const handleConfirmSale = async (customer?: { name: string; phone?: string; isNew?: boolean }) => {
    if (!paymentMethod) return; // Safety check
    
    let customerName = customer?.name;
    
    // If this is a new customer, save them to the database first
    if (customer?.isNew && customer.name) {
      try {
        const newCustomer = await apiRequest({
          url: "/api/customers",
          method: "POST",
          body: {
            name: customer.name,
            phone: customer.phone || null,
            email: null,
            address: null,
            balance: "0.00"
          }
        });
        
        // Invalidate customers cache to refresh the list
        queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
        
        toast({
          title: "Customer Added",
          description: `${customer.name} has been added to customers list`,
          className: "bg-blue-600 text-white border-blue-500",
        });
      } catch (error) {
        console.error("Failed to create customer:", error);
        toast({
          title: "Warning",
          description: "Customer could not be saved, but sale will continue",
          variant: "destructive",
        });
      }
    }
    
    const saleData = {
      items: cartItems.map(item => ({
        productId: item.product.id,
        qty: item.quantity,
      })),
      paymentType: paymentMethod as 'cash' | 'mpesa' | 'credit',
      customer: customerName,
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
            onCheckout={handleSellClick}
            isProcessing={createSaleMutation.isPending}
          />
          
          {/* Payment Method and Sell Button */}
          {cartItems.length > 0 && (
            <Card className="border-2 border-[#00AA00]/20">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-2">Total Amount</div>
                    <div className="text-3xl font-bold text-[#00AA00]">
                      {formatCurrency(cartTotal.toFixed(2))}
                    </div>
                  </div>
                  
                  {/* Payment Method Buttons */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-700 text-center">Payment Method</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPaymentMethod('cash')}
                        className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
                          paymentMethod === 'cash'
                            ? 'bg-[#00AA00] text-white'
                            : 'bg-black text-white hover:bg-gray-800'
                        }`}
                      >
                        Cash
                      </button>
                      <button
                        onClick={() => setPaymentMethod('mpesa')}
                        className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
                          paymentMethod === 'mpesa'
                            ? 'bg-[#00AA00] text-white'
                            : 'bg-black text-white hover:bg-gray-800'
                        }`}
                      >
                        M-Pesa
                      </button>
                      <button
                        onClick={() => setPaymentMethod('credit')}
                        className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
                          paymentMethod === 'credit'
                            ? 'bg-[#00AA00] text-white'
                            : 'bg-black text-white hover:bg-gray-800'
                        }`}
                      >
                        Credit
                      </button>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleSellClick}
                    disabled={!paymentMethod || createSaleMutation.isPending}
                    className={`w-full h-12 text-white text-lg font-semibold ${
                      !paymentMethod || createSaleMutation.isPending
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-[#00AA00] hover:bg-[#00AA00]/90'
                    }`}
                  >
                    {createSaleMutation.isPending ? "Processing..." : "Sell"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Confirmation Modal */}
          <SaleConfirmationModal
            open={showConfirmationModal}
            onOpenChange={setShowConfirmationModal}
            items={cartItems}
            paymentMethod={paymentMethod}
            onConfirm={handleConfirmSale}
            isProcessing={createSaleMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
}