import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { ShoppingCart, CreditCard, Smartphone, Banknote, Search, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { type Product } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { type SaleLineItem } from "@/components/sales/sale-line-item";
import { formatCurrency } from "@/lib/utils";
import { offlineQueue, isOnline } from "@/lib/offline-queue";
import { Skeleton } from "@/components/ui/skeleton";
import { SaleConfirmationModal } from "@/components/sales/sale-confirmation-modal";

// Use SaleLineItem from the components instead of local CartItem

// Using enhanced SaleConfirmationModal component
// Legacy inline component removed - now using advanced customer selection modal
/*
const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  cartItems, 
  paymentMethod, 
  onConfirm,
  isProcessing 
}: {
  isOpen: boolean;
  onClose: () => void;
  cartItems: SaleLineItem[];
  paymentMethod: 'cash' | 'credit' | 'mobileMoney';
  onConfirm: (customer?: { name: string; phone?: string }) => void;
  isProcessing: boolean;
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Get fresh product data for accurate stock validation
  const { data: freshProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: isOpen // Only fetch when modal is open
  });

  if (!isOpen) return null;

  const total = cartItems.reduce((sum, item) => sum + parseFloat(item.total), 0);
  
  const getPaymentIcon = () => {
    switch (paymentMethod) {
      case 'cash': return <Banknote className="h-5 w-5" />;
      case 'mobileMoney': return <Smartphone className="h-5 w-5" />;
      case 'credit': return <CreditCard className="h-5 w-5" />;
    }
  };

  const getPaymentLabel = () => {
    switch (paymentMethod) {
      case 'cash': return 'Cash Payment';
      case 'mobileMoney': return 'Mobile Money';
      case 'credit': return 'Credit Sale';
    }
  };

  // Use fresh product data for stock validation instead of stale cart product data
  const stockIssues = cartItems.filter(item => {
    const freshProduct = freshProducts.find(p => p.id === item.product.id);
    if (!freshProduct) return false; // Product not found, skip validation
    
    // Skip validation for unknown quantity items (null stock)
    if (freshProduct.stock === null) return false;
    
    // Check if requested quantity exceeds available stock
    return item.quantity > (freshProduct.stock || 0);
  });
  const hasStockIssues = stockIssues.length > 0;

  const handleConfirm = () => {
    // Double-check stock before confirming
    if (hasStockIssues) {
      return; // Button should be disabled anyway
    }
    
    if (paymentMethod === 'credit' && customerName.trim()) {
      onConfirm({ name: customerName.trim(), phone: customerPhone.trim() });
    } else {
      onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <div className="bg-white dark:bg-[#1F1F1F] rounded-t-xl p-6 shadow-lg w-full max-w-md animate-in slide-in-from-bottom duration-300">
        <h3 className="text-lg font-semibold mb-4">Confirm Sale</h3>
        
        {/* Items list */}
        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
          {cartItems.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.product.name} × {item.quantity}</span>
              <span>{formatCurrency(item.total)}</span>
            </div>
          ))}
        </div>
        
        {/* Total */}
        <div className="border-t pt-3 mb-4">
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>{formatCurrency(total.toFixed(2))}</span>
          </div>
        </div>
        
        {/* Payment method */}
        <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          {getPaymentIcon()}
          <span className="font-medium">{getPaymentLabel()}</span>
        </div>
        
        {/* Stock Issues Warning */}
        {hasStockIssues && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200 font-medium text-sm">Stock Issue:</p>
            {stockIssues.map(item => {
              const freshProduct = freshProducts.find(p => p.id === item.product.id);
              return (
                <p key={item.id} className="text-red-700 dark:text-red-300 text-sm">
                  {item.product.name}: Need {item.quantity}, Available {freshProduct?.stock || 0}
                </p>
              );
            })}
          </div>
        )}

        {/* Customer info for credit sales */}
        {paymentMethod === 'credit' && (
          <div className="space-y-3 mb-4">
            <input
              type="text"
              placeholder="Customer Name (required)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            />
            <input
              type="text"
              placeholder="Customer Phone (optional)"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            />
          </div>
        )}
        
        {/* Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={handleConfirm}
            disabled={isProcessing || hasStockIssues || (paymentMethod === 'credit' && !customerName.trim())}
            className={`w-full h-12 text-lg font-semibold ${
              hasStockIssues 
                ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isProcessing ? 'Processing...' : hasStockIssues ? 'Insufficient Stock' : 'Confirm Sale'}
          </Button>
          <Button 
            onClick={onClose}
            variant="outline"
            disabled={isProcessing}
            className="w-full h-12"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
*/

export default function Sales() {
  const [cartItems, setCartItems] = useState<SaleLineItem[]>([]);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit' | 'mobileMoney' | ''>('');
  
  // Smart search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch all products for quick select functionality
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Get frequent products (first 6 for quick select)
  const { data: frequentProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products/frequent"],
  });

  const quickSelectProducts = frequentProducts.length > 0 
    ? frequentProducts.slice(0, 6) 
    : products.slice(0, 6);

  // Update cart items with fresh product data when products are refreshed
  useEffect(() => {
    if (products.length > 0 && cartItems.length > 0) {
      setCartItems(prevItems => 
        prevItems.map(item => {
          const freshProduct = products.find(p => p.id === item.product.id);
          if (freshProduct) {
            return {
              ...item,
              product: freshProduct // Update with fresh product data
            };
          }
          return item;
        })
      );
    }
  }, [products]); // Re-run when products data changes

  // Debounced search function
  const debouncedSearch = useCallback(
    async (query: string) => {
      if (query.trim().length < 1) {
        setSearchResults([]);
        setShowSearchDropdown(false);
        return;
      }

      setSearchLoading(true);
      try {
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`, {
          credentials: 'include'
        });
        if (response.ok) {
          const results = await response.json();
          setSearchResults(results);
          setShowSearchDropdown(results.length > 0);
          setSelectedSearchIndex(-1);
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
        setShowSearchDropdown(false);
      } finally {
        setSearchLoading(false);
      }
    },
    []
  );

  // Search debounce effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      debouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, debouncedSearch]);

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle search keyboard navigation
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!showSearchDropdown || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSearchIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSearchIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSearchIndex >= 0 && selectedSearchIndex < searchResults.length) {
          const selectedProduct = searchResults[selectedSearchIndex];
          handleSearchResultSelect(selectedProduct);
        }
        break;
      case 'Escape':
        setShowSearchDropdown(false);
        setSelectedSearchIndex(-1);
        break;
    }
  };

  // Handle search result selection
  const handleSearchResultSelect = (product: Product) => {
    console.log('Search result selected:', product);
    handleProductSelect(product);
    setSearchQuery('');
    setShowSearchDropdown(false);
    setSelectedSearchIndex(-1);
    
    // Blur the search input
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
    
    // Add success toast notification
    toast({
      title: "Product added",
      description: `${product.name} added to cart`,
      className: "bg-green-50 border-green-200 text-green-800",
      duration: 2000,
    });
  };

  const createSaleMutation = useMutation({
    mutationFn: async (saleData: { 
      items: Array<{ productId: number; qty: number }>;
      paymentType: 'cash' | 'credit' | 'mobileMoney';
      customerName?: string;
      customerPhone?: string;
    }) => {
      // Check if online
      if (!isOnline()) {
        // Queue sale for offline processing
        const queuedSaleId = await offlineQueue.queueSale({
          items: saleData.items.map(item => ({
            productId: item.productId,
            quantity: item.qty,
            price: cartItems.find(cartItem => cartItem.product.id === item.productId)?.unitPrice || "0"
          })),
          paymentType: saleData.paymentType as 'cash' | 'credit' | 'mobileMoney',
          customerName: saleData.customerName,
          customerPhone: saleData.customerPhone,
        });

        // Register background sync if supported
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then(registration => {
            try {
              // Use any to bypass TypeScript limitations with experimental API
              const syncManager = (registration as any).sync;
              if (syncManager) {
                syncManager.register('sync-sales');
              }
            } catch (error) {
              console.error('Background sync registration failed:', error);
            }
          });
        }

        return { success: true, status: 'queued', saleId: queuedSaleId };
      }

      // Online - proceed with normal API call
      const response = await apiRequest("POST", "/api/sales", saleData);
      return response.json();
    },
    onSuccess: (result: any) => {
      // Close modal and clear cart
      setShowConfirmationModal(false);
      setCartItems([]);
      setPaymentMethod('');
      
      // Immediately refresh all relevant data if online
      if (isOnline()) {
        // Dashboard metrics
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
        queryClient.invalidateQueries({ queryKey: ["/api/metrics/dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["/api/orders/recent"] });
        
        // Reports data  
        queryClient.invalidateQueries({ queryKey: ["/api/reports/summary"] });
        queryClient.invalidateQueries({ queryKey: ["/api/reports/trend"] });
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        
        // Inventory data
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        queryClient.invalidateQueries({ queryKey: ["/api/products/frequent"] });
        
        // Customer data for credit sales
        if (paymentMethod === 'credit') {
          queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
        }
      }
      
      // Show appropriate toast based on status
      const status = result.status;
      if (status === 'queued') {
        toast({ 
          title: "Sale queued – offline mode", 
          description: "Sale will be processed when connection is restored",
          className: "bg-yellow-50 border-yellow-200 text-yellow-800",
          duration: 5000
        });
      } else if (status === 'paid') {
        const paymentLabel = paymentMethod === 'mobileMoney' ? 'Mobile Money' : 'Cash';
        toast({ 
          title: `Sale recorded (${paymentLabel})`, 
          description: `Sale #${result.saleId} completed successfully`,
          className: "bg-green-50 border-green-200 text-green-800",
          duration: 3000
        });
      } else if (status === 'pending') {
        toast({ 
          title: "Sale recorded – payment pending", 
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
      console.error('Sale error:', error);
      let errorMessage = "Failed to complete sale";
      
      // Extract more specific error messages
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({ 
        title: "Sale Failed", 
        description: errorMessage,
        variant: "destructive",
        duration: 5000
      });
    },
  });

  const handleProductSelect = (product: Product) => {
    console.log('handleProductSelect called with:', product);
    console.log('Current cartItems:', cartItems);
    
    const existingItem = cartItems.find(item => item.product.id === product.id);
    
    if (existingItem) {
      console.log('Product exists in cart, incrementing quantity');
      // Increment quantity if product already in cart
      handleQuantityChange(existingItem.id, existingItem.quantity + 1);
    } else {
      console.log('Adding new product to cart');
      // Add new item to cart
      const newItem: SaleLineItem = {
        id: `${product.id}-${Date.now()}`,
        product,
        quantity: 1,
        unitPrice: product.price,
        total: product.price,
      };
      console.log('New item created:', newItem);
      setCartItems(prev => {
        const updated = [...prev, newItem];
        console.log('Updated cart items:', updated);
        return updated;
      });
    }
  };

  const handleQuickSelectProduct = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      handleProductSelect(product);
      toast({
        title: "Product added",
        description: `${product.name} added to cart`,
        className: "bg-green-50 border-green-200 text-green-800",
        duration: 2000,
      });
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

    // Check for stock issues using fresh product data (skip products with unknown quantities)
    const stockIssues = cartItems.filter(item => {
      const freshProduct = products.find(p => p.id === item.product.id);
      if (!freshProduct) return false; // Product not found, skip validation
      
      // Skip validation for unknown quantity items (null stock)
      if (freshProduct.stock === null) return false;
      
      // Check if requested quantity exceeds available stock
      return item.quantity > (freshProduct.stock || 0);
    });
    
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
        const newCustomer = await apiRequest("POST", "/api/customers", {
          name: customer.name,
          phone: customer.phone || null,
          email: null,
          address: null,
          balance: "0.00"
        });
        
        // Invalidate customers cache to refresh the list
        queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
        
        toast({
          title: "Customer Added",
          description: `${customer.name} has been added to customers list`,
          className: "bg-blue-600 text-foreground border-blue-500",
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
      paymentType: paymentMethod as 'cash' | 'credit' | 'mobileMoney',
      customer: customerName,
    };

    createSaleMutation.mutate(saleData);
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + parseFloat(item.total), 0);
  const isCartEmpty = cartItems.length === 0;
  const canProceed = !isCartEmpty && paymentMethod !== '';

  // Button click handler with ripple effect
  const handleSellButtonClick = () => {
    if (!canProceed) {
      if (isCartEmpty) {
        toast({ title: "Cart is empty", description: "Scan or select items to start a sale", variant: "destructive" });
      } else {
        toast({ title: "Select payment method", variant: "destructive" });
      }
      return;
    }

    // Add button animation
    if (buttonRef.current) {
      buttonRef.current.style.transform = 'scale(0.95)';
      setTimeout(() => {
        if (buttonRef.current) {
          buttonRef.current.style.transform = 'scale(1)';
        }
      }, 100);
    }

    setShowConfirmationModal(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Responsive Single-Column Flow */}
      <div className="container mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-40 md:pb-32 max-w-2xl">{/* pb-40 mobile, pb-32 tablet+ for sticky button space */}
        
        {/* 1. Quick-Select Panel (Top 6) */}
        <div className="bg-white dark:bg-[#1F1F1F] rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Select</h3>
          {productsLoading ? (
            <div className="flex gap-2 overflow-x-auto">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="min-w-24 h-12 flex-shrink-0 rounded" />
              ))}
            </div>
          ) : quickSelectProducts.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {quickSelectProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  aria-label={`Add ${product.name} to cart`}
                  className="min-w-24 h-12 flex-shrink-0 bg-gray-50 dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-gray-200 dark:border-gray-600 rounded text-xs p-2 transition-all duration-200 transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  style={{ minHeight: '48px' }}
                >
                  <div className="text-center">
                    <div className="font-medium truncate leading-tight">{product.name}</div>
                    <div className="text-purple-600 font-semibold">{formatCurrency(product.price)}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No products available for quick select
            </div>
          )}
          
          {/* Subtle divider */}
          <div className="border-t border-gray-200 dark:border-gray-700 mt-4 mb-4"></div>
          
          {/* 2. Smart Product Search Bar */}
          <div className="relative">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Search Products</h4>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => {
                  if (searchResults.length > 0) {
                    setShowSearchDropdown(true);
                  }
                }}
                placeholder="Type to search products..."
                aria-label="Search products to add to cart"
                className="w-full h-14 pl-12 pr-12 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-base shadow-sm"
              />
              {searchLoading && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin h-5 w-5 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                </div>
              )}
              {!searchLoading && searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchDropdown(false);
                    setSearchResults([]);
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ×
                </button>
              )}
            </div>
            
            {/* Enhanced Search Dropdown */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-2xl max-h-80 overflow-hidden">
                <div className="p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {searchResults.length} product{searchResults.length !== 1 ? 's' : ''} found
                  </p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {searchResults.map((product, index) => (
                    <div
                      key={product.id}
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent input blur
                        handleSearchResultSelect(product);
                      }}
                      className={`px-4 py-4 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-all duration-150 ${
                        index === selectedSearchIndex 
                          ? 'bg-purple-50 dark:bg-purple-900/30 border-l-4 border-l-purple-500' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                      style={{ minHeight: '60px' }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate text-base">
                            {product.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Stock: {product.stock !== null ? product.stock : '—'} • SKU: {product.sku}
                          </p>
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                            {formatCurrency(product.price)}
                          </p>
                          <div className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full mt-1">
                            Click to add
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No results message */}
            {showSearchDropdown && searchQuery.length > 0 && searchResults.length === 0 && !searchLoading && (
              <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-lg p-6 text-center">
                <div className="text-gray-400 mb-2">
                  <Search className="h-8 w-8 mx-auto opacity-50" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">No products found</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Try searching with different keywords
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 3. Mini-Cart Summary */}
        <div className="bg-white dark:bg-[#1F1F1F] rounded-lg p-4 shadow-md">
          <h3 className="text-lg font-semibold mb-3">Cart</h3>
          
          {isCartEmpty ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Scan or select items to start a sale</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-all duration-200"
                >
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{item.product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      × {item.quantity} @ {formatCurrency(item.unitPrice)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuantityChange(item.id, Math.max(1, item.quantity - 1))}
                      className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      +
                    </button>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="ml-2 w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                  <div className="w-20 text-right font-semibold">
                    {formatCurrency(item.total)}
                  </div>
                </div>
              ))}
              
              {/* Grand Total */}
              <div className="border-t pt-3 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold">Total</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(cartTotal.toFixed(2))}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Payment Method Selector */}
        {!isCartEmpty && (
          <div className="bg-white dark:bg-[#1F1F1F] rounded-lg p-4 shadow-md">
            <h3 className="text-lg font-semibold mb-3">Payment Method</h3>
            <div className="space-y-2">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`w-full h-12 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-600 ${
                  paymentMethod === 'cash'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <Banknote className="h-5 w-5" />
                Cash
              </button>
              
              <button
                onClick={() => setPaymentMethod('mobileMoney')}
                className={`w-full h-12 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-600 ${
                  paymentMethod === 'mobileMoney'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <Smartphone className="h-5 w-5" />
                Mobile Money
              </button>
              
              <button
                onClick={() => setPaymentMethod('credit')}
                className={`w-full h-12 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-600 ${
                  paymentMethod === 'credit'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <CreditCard className="h-5 w-5" />
                Credit
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Sticky Sell Button - with mobile bottom nav spacing */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <button
          ref={buttonRef}
          onClick={handleSellButtonClick}
          disabled={createSaleMutation.isPending}
          className={`w-full h-14 text-lg font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-600 ${
            canProceed && !createSaleMutation.isPending
              ? 'bg-green-600 hover:bg-green-700 text-white transform active:scale-95'
              : 'bg-gray-400 text-gray-600 cursor-not-allowed'
          }`}
        >
          {createSaleMutation.isPending ? 'Processing...' : 'Complete Sale'}
        </button>
      </div>

      {/* Enhanced Confirmation Modal with Customer Selection */}
      <SaleConfirmationModal
        open={showConfirmationModal}
        onOpenChange={setShowConfirmationModal}
        items={cartItems}
        paymentMethod={paymentMethod as 'cash' | 'credit' | 'mobileMoney'}
        onConfirm={handleConfirmSale}
        isProcessing={createSaleMutation.isPending}
      />
    </div>
  );
}