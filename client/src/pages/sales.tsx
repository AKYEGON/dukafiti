import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { createSale, getProducts, searchProducts, createCustomer, getCustomers } from "@/lib/supabase-data";
import { useNotifications } from "@/hooks/useNotifications";
import { supabase } from "@/lib/supabase";



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
  const { createNotification } = useNotifications();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch all products for quick select functionality
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  // Get frequent products (first 6 for quick select)
  const { data: frequentProducts = [] } = useQuery<Product[]>({
    queryKey: ["products-frequent"],
    queryFn: async () => {
      const allProducts = await getProducts();
      return allProducts.sort((a: any, b: any) => (b.sales_count || 0) - (a.sales_count || 0));
    },
  });

  const quickSelectProducts = frequentProducts.length > 0 
    ? frequentProducts.slice(0, 6) 
    : products.slice(0, 6);

  // Set up real-time subscription for product updates (stock changes)
  useEffect(() => {
    console.log('🔗 Setting up real-time product subscription for Sales page...');
    
    const subscription = supabase
      .channel('products_realtime_sales')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'products'
      }, (payload) => {
        console.log('📦 Product updated via realtime on Sales page:', payload.new);
        
        // Update the products query cache with the new data
        queryClient.setQueryData<Product[]>(['products'], (oldProducts) => {
          if (!oldProducts) return oldProducts;
          
          const updatedProduct = payload.new as Product;
          return oldProducts.map(product => 
            product.id === updatedProduct.id ? updatedProduct : product
          );
        });
        
        // Also update frequent products cache
        queryClient.setQueryData<Product[]>(['products-frequent'], (oldProducts) => {
          if (!oldProducts) return oldProducts;
          
          const updatedProduct = payload.new as Product;
          return oldProducts.map(product => 
            product.id === updatedProduct.id ? updatedProduct : product
          );
        });
        
        // Update cart items with fresh product data to reflect stock changes
        setCartItems(prevCart => {
          return prevCart.map(cartItem => {
            const updatedProduct = payload.new as Product;
            if (cartItem.product.id === updatedProduct.id) {
              return {
                ...cartItem,
                product: updatedProduct
              };
            }
            return cartItem;
          });
        });
        
        console.log('✅ Sales page product cache and cart updated with real-time data');
      })
      .subscribe((status) => {
        console.log('📊 Sales page products subscription status:', status);
      });

    return () => {
      console.log('🔌 Cleaning up Sales page products real-time subscription');
      supabase.removeChannel(subscription);
    };
  }, [queryClient]);

  // Search function with timeout for debouncing
  const performSearch = useCallback(async (query: string) => {
    if (query.length < 1) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    try {
      const data = await searchProducts(query);
      setSearchResults(data || []);
      setShowSearchDropdown(true);
      setSelectedSearchIndex(-1);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setShowSearchDropdown(false);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Trigger search when query changes with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  // Handle keyboard navigation for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showSearchDropdown || searchResults.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedSearchIndex(prev => 
            prev < searchResults.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedSearchIndex(prev => prev > 0 ? prev - 1 : prev);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedSearchIndex >= 0 && selectedSearchIndex < searchResults.length) {
            handleSearchResultSelect(searchResults[selectedSearchIndex]);
          }
          break;
        case 'Escape':
          setShowSearchDropdown(false);
          setSelectedSearchIndex(-1);
          if (searchInputRef.current) {
            searchInputRef.current.blur();
          }
          break;
      }
    };

    if (showSearchDropdown) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showSearchDropdown, searchResults, selectedSearchIndex]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        // Small delay to allow for item selection
        setTimeout(() => {
          setShowSearchDropdown(false);
          setSelectedSearchIndex(-1);
        }, 150);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProductSelect = (product: Product) => {
    // Product selected for cart
    
    // Check if product already exists in cart
    const existingItem = cartItems.find(item => item.product.id === product.id);
    
    if (existingItem) {
      console.log('Product exists, incrementing quantity');
      // Increment quantity of existing item
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
        className: "bg-brand-50 border-brand-200 text-brand-800",
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
    
    // For credit sales, customer information is required
    if (paymentMethod === 'credit' && !customer?.name?.trim()) {
      toast({
        title: "Customer required",
        description: "Please select or add a customer for credit sales",
        variant: "destructive"
      });
      return;
    }
    
    let customerId = null;
    let customerName = customer?.name || 'Walk-in Customer';
    
    // If this is a new customer, save them to the database first
    if (customer?.isNew && customer.name) {
      try {
        const newCustomer = await createCustomer({
          name: customer.name,
          phone: customer.phone || null,
          email: null,
          address: null,
          balance: 0
        });
        
        customerId = newCustomer.id;
        console.log('New customer saved:', newCustomer);
        
        // No need to invalidate cache - useLiveData will pick up the change automatically
        
        toast({
          title: "Customer added",
          description: `${customer.name} has been added to your customers list`,
          className: "bg-brand-50 border-brand-200 text-brand-800",
          duration: 3000,
        });
      } catch (error) {
        console.error('Error saving new customer:', error);
        toast({
          title: "Warning",
          description: "Customer couldn't be saved, but sale will proceed",
          variant: "destructive",
          duration: 3000,
        });
      }
    } else if (customer?.name && paymentMethod === 'credit') {
      // For existing customers, find their ID
      try {
        const customers = await getCustomers();
        const existingCustomer = customers.find(c => c.name === customer.name);
        if (existingCustomer) {
          customerId = existingCustomer.id;
        }
      } catch (error) {
        console.error('Error finding existing customer:', error);
      }
    }
    
    // Calculate the new customer balance for credit sales
    let newCustomerBalance = 0;
    if (paymentMethod === 'credit' && customerId) {
      try {
        const customers = await getCustomers();
        const existingCustomer = customers.find(c => c.id === customerId);
        const currentBalance = parseFloat(existingCustomer?.balance || "0");
        const saleTotal = cartItems.reduce((sum, item) => sum + parseFloat(item.total), 0);
        newCustomerBalance = currentBalance + saleTotal;
      } catch (error) {
        console.error('Error calculating customer balance:', error);
      }
    }
    
    // Prepare sale data for Supabase
    const saleData = {
      customerId,
      customerName,
      total: cartItems.reduce((sum, item) => sum + parseFloat(item.total), 0),
      paymentMethod: paymentMethod as 'cash' | 'credit' | 'mobileMoney',
      items: cartItems.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.unitPrice,
        hasStock: item.product.stock !== null,
        newStock: item.product.stock !== null ? (item.product.stock || 0) - item.quantity : null,
        newSalesCount: (item.product.salesCount || 0) + item.quantity,
      })),
      newCustomerBalance: paymentMethod === 'credit' ? newCustomerBalance : null
    };

    console.log('Sale data being sent:', saleData);
    createSaleMutation.mutate(saleData);
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
      className: "bg-brand-50 border-brand-200 text-brand-800",
      duration: 2000,
    });
  };

  const createSaleMutation = useMutation({
    mutationFn: async (saleData: any) => {
      // Check if online
      if (!isOnline()) {
        // Queue sale for offline processing
        const queuedSaleId = await offlineQueue.queueSale({
          items: saleData.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          })),
          paymentType: saleData.paymentMethod as 'cash' | 'credit' | 'mobileMoney',
          customerName: saleData.customerName,
          customerPhone: '',
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

      // Online - proceed with direct Supabase call
      // Use the data as-is since it's already properly formatted from handleConfirmSale
      const result = await createSale(saleData);
      return { 
        success: true, 
        status: saleData.paymentMethod === 'credit' ? 'pending' : 'paid', 
        data: result 
      };
    },
    onSuccess: (result: any) => {
      // Close modal and clear cart
      setShowConfirmationModal(false);
      setCartItems([]);
      setPaymentMethod('');
      
      // No need to invalidate queries - useLiveData hooks will pick up changes automatically
      // Dashboard metrics, products, and customers will update in real-time
      
      // Show appropriate toast based on status
      const status = result.status;
      const totalAmount = cartItems.reduce((sum, item) => sum + parseFloat(item.total), 0);
      
      if (status === 'queued') {
        toast({ 
          title: "Sale queued – offline mode", 
          description: "Sale will be processed when connection is restored",
          className: "bg-blue-50 border-blue-200 text-blue-800",
          duration: 5000,
        });
      } else if (status === 'paid') {
        toast({ 
          title: "Sale completed successfully!", 
          description: `Payment received via ${paymentMethod}`,
          className: "bg-brand-50 border-brand-200 text-brand-800",
          duration: 3000,
        });
        
        // Create notification for completed sale
        createNotification({
          type: 'sale_completed',
          title: 'Sale Completed',
          message: `Sale of ${formatCurrency(totalAmount)} completed via ${paymentMethod}`
        }).catch(err => console.error('Failed to create sale notification:', err));
        
      } else if (status === 'pending') {
        toast({ 
          title: "Credit sale recorded", 
          description: "Customer payment is pending",
          className: "bg-yellow-50 border-yellow-200 text-yellow-800",
          duration: 3000,
        });
        
        // Create notification for credit sale
        createNotification({
          type: 'customer_payment',
          title: 'Credit Sale Recorded',
          message: `Credit sale of ${formatCurrency(totalAmount)} recorded for customer`
        }).catch(err => console.error('Failed to create credit sale notification:', err));
      }
    },
    onError: (error: any) => {
      console.error('Sale error:', error);
      toast({ 
        title: "Sale failed", 
        description: "Please try again or contact support",
        variant: "destructive" 
      });
    }
  });

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

  if (productsLoading) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex gap-3">
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 w-12" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-40" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 pb-20">
      {/* 1. Smart Product Search Bar */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Sales</h2>
        
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search products to add to cart..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.length > 0 && searchResults.length > 0) {
                  setShowSearchDropdown(true);
                }
              }}
              className="w-full h-12 pl-10 pr-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-accent-500 dark:focus:border-purple-400 focus:outline-none bg-white dark:bg-gray-800 text-base transition-all duration-200"
              style={{ minHeight: '48px' }}
            />
            {searchLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent-500"></div>
              </div>
            )}
          </div>

          {/* Search Results Dropdown */}
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
                        ? 'bg-accent-50 dark:bg-purple-900/30 border-l-4 border-l-accent-500' 
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
                        <p className="text-lg font-bold text-accent dark:text-purple-400">
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

      {/* 2. Quick-Select Panel */}
      <div className="bg-white dark:bg-[#1F1F1F] rounded-lg p-4 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Quick Select</h3>
          <div className="text-sm text-gray-500">Top {quickSelectProducts.length}</div>
        </div>
        
        {quickSelectProducts.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No products available</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {quickSelectProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => handleQuickSelectProduct(product.id)}
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-accent-50 dark:hover:bg-purple-900/20 hover:border-purple-200 dark:hover:border-purple-700 border border-transparent transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-accent-500 group"
                style={{ minHeight: '60px' }}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate text-sm group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                      {product.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Stock: {product.stock !== null ? product.stock : '—'}
                    </div>
                  </div>
                  <div className="text-right ml-2 flex-shrink-0">
                    <div className="text-sm font-bold text-accent dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300">
                      {formatCurrency(product.price)}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Mini-Cart Summary */}
      <div className="bg-white dark:bg-[#1F1F1F] rounded-lg p-4 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Cart</h3>
          {!isCartEmpty && (
            <button
              onClick={handleClearCart}
              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1"
            >
              Clear Cart
            </button>
          )}
        </div>
        
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
                <span className="text-2xl font-bold text-brand-600">
                  {formatCurrency(cartTotal.toFixed(2))}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Payment Method Selector */}
      {!isCartEmpty && (
        <div className="bg-white dark:bg-[#1F1F1F] rounded-lg p-4 shadow-md">
          <h3 className="text-lg font-semibold mb-3">Payment Method</h3>
          <div className="space-y-2">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`w-full h-12 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand ${
                paymentMethod === 'cash'
                  ? 'bg-brand text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <Banknote className="h-5 w-5" />
              Cash
            </button>
            
            <button
              onClick={() => setPaymentMethod('mobileMoney')}
              className={`w-full h-12 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand ${
                paymentMethod === 'mobileMoney'
                  ? 'bg-brand text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <Smartphone className="h-5 w-5" />
              Mobile Money
            </button>
            
            <button
              onClick={() => setPaymentMethod('credit')}
              className={`w-full h-12 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand ${
                paymentMethod === 'credit'
                  ? 'bg-brand text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <CreditCard className="h-5 w-5" />
              Credit
            </button>
          </div>
        </div>
      )}

      {/* 5. Sticky Sell Button */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <button
          ref={buttonRef}
          onClick={handleSellButtonClick}
          disabled={createSaleMutation.isPending}
          className={`w-full h-14 text-lg font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand ${
            canProceed && !createSaleMutation.isPending
              ? 'bg-brand hover:bg-brand-700 text-white transform active:scale-95'
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

