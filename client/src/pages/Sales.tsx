import { useState } from 'react';
import useLiveData from '../hooks/useLiveData';
import useMutation from '../hooks/useMutation';
import { Product, Customer, Sale } from '../types/schema';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function Sales() {
  const { items: products, loading: productsLoading } = useLiveData<Product>('products');
  const { items: customers } = useLiveData<Customer>('customers');
  const createSale = useMutation<Sale>('sales', 'insert');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<
    'cash' | 'credit' | 'mobileMoney'
  >('cash');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
    } else {
      setCart((prev) =>
        prev.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
  };

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handleSale = async () => {
    if (cart.length === 0) return;

    // Validate stock availability
    for (const item of cart) {
      if (item.product.stock_quantity !== null && item.product.stock_quantity < item.quantity) {
        alert(`Insufficient stock for ${item.product.name}. Available: ${item.product.stock_quantity}`);
        return;
      }
    }

    try {
      const saleData = {
        customer_id: selectedCustomer?.id || null,
        customer_name: selectedCustomer?.name || 'Walk-in Customer',
        total_amount: totalAmount,
        payment_method: paymentMethod,
        status: 'completed' as const,
      };

      // Create the sale
      await createSale.mutate(saleData);
      
      // Update product stock levels
      for (const item of cart) {
        if (item.product.stock_quantity !== null) {
          const updateProduct = useMutation<Product>('products', 'update');
          await updateProduct.mutate({
            id: item.product.id,
            stock_quantity: item.product.stock_quantity - item.quantity,
          });
        }
      }

      clearCart();
      alert('Sale completed successfully!');
    } catch (error) {
      console.error('Failed to complete sale:', error);
      alert('Failed to complete sale. Please try again.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Sales
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Products
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => addToCart(product)}
              >
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {product.name}
                </h3>
                <p className="text-green-600 font-bold">
                  KES {product.price.toLocaleString()}
                </p>
                {product.stock_quantity !== undefined && (
                  <p className="text-sm text-gray-500">
                    Stock: {product.stock_quantity}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Cart
            </h2>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Clear Cart
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No items in cart</p>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {item.product.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        KES {item.product.price.toLocaleString()} each
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity - 1)
                        }
                        className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded text-gray-700"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity + 1)
                        }
                        className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded text-gray-700"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <p className="text-right font-semibold text-gray-900 dark:text-gray-100 mt-2">
                    KES {(item.product.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}

              {/* Payment Options */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">
                  Payment Method
                </h3>
                <div className="space-y-2">
                  {(['cash', 'credit', 'mobileMoney'] as const).map(
                    (method) => (
                      <label key={method} className="flex items-center">
                        <input
                          type="radio"
                          name="payment"
                          value={method}
                          checked={paymentMethod === method}
                          onChange={(e) =>
                            setPaymentMethod(e.target.value as typeof method)
                          }
                          className="mr-2"
                        />
                        <span className="text-gray-900 dark:text-gray-100 capitalize">
                          {method === 'mobileMoney' ? 'Mobile Money' : method}
                        </span>
                      </label>
                    )
                  )}
                </div>

                {paymentMethod === 'credit' && (
                  <div className="mt-3">
                    <button
                      onClick={() => setShowCustomerModal(true)}
                      className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 py-2 rounded-lg"
                    >
                      {selectedCustomer
                        ? selectedCustomer.name
                        : 'Select Customer'}
                    </button>
                  </div>
                )}
              </div>

              {/* Total and Checkout */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Total:
                  </span>
                  <span className="text-xl font-bold text-green-600">
                    KES {totalAmount.toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={handleSale}
                  disabled={
                    createSale.loading ||
                    (paymentMethod === 'credit' && !selectedCustomer)
                  }
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold"
                >
                  {createSale.loading ? 'Processing...' : 'Complete Sale'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Select Customer
            </h2>
            <div className="space-y-2">
              {customers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setShowCustomerModal(false);
                  }}
                  className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {customer.name}
                  </div>
                  {customer.phone && (
                    <div className="text-sm text-gray-500">
                      {customer.phone}
                    </div>
                  )}
                  <div className="text-sm text-red-600">
                    Balance: KES {customer.balance.toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowCustomerModal(false)}
              className="mt-4 w-full bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
