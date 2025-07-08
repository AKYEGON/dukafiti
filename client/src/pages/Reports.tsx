import useLiveData from '../hooks/useLiveData';
import { Sale, Product, Customer } from '../types/schema';

export default function Reports() {
  const { items: sales, loading: salesLoading } = useLiveData<Sale>('sales');
  const { items: products } = useLiveData<Product>('products');
  const { items: customers } = useLiveData<Customer>('customers');

  if (salesLoading) {
    return <div className="p-6 text-center">Loading reports...</div>;
  }

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const totalSales = sales.length;
  const avgSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  // Today's sales
  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(sale => 
    sale.created_at.startsWith(today)
  );
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total_amount, 0);

  // Top selling products (simplified)
  const productSales = sales.flatMap(sale => sale.items || []);
  const productTotals = productSales.reduce((acc, item) => {
    acc[item.product_name] = (acc[item.product_name] || 0) + item.quantity;
    return acc;
  }, {} as Record<string, number>);

  const topProducts = Object.entries(productTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Top customers by credit balance
  const topCustomers = [...customers]
    .filter(customer => customer.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reports</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</h3>
          <p className="text-2xl font-bold text-green-600">KES {totalRevenue.toLocaleString()}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Sales</h3>
          <p className="text-2xl font-bold text-blue-600">{totalSales}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Today's Revenue</h3>
          <p className="text-2xl font-bold text-purple-600">KES {todayRevenue.toLocaleString()}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Sale Value</h3>
          <p className="text-2xl font-bold text-orange-600">KES {avgSaleValue.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Top Selling Products</h3>
          <div className="space-y-3">
            {topProducts.length > 0 ? (
              topProducts.map(([productName, quantity], index) => (
                <div key={productName} className="flex justify-between items-center">
                  <div>
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">{productName}</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{quantity} sold</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No sales data available</p>
            )}
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Top Customers (Credit)</h3>
          <div className="space-y-3">
            {topCustomers.length > 0 ? (
              topCustomers.map((customer, index) => (
                <div key={customer.id} className="flex justify-between items-center">
                  <div>
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">{customer.name}</span>
                  </div>
                  <span className="font-semibold text-red-600">
                    KES {customer.balance.toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No customers with credit balance</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Sales */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Recent Sales</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 text-gray-900 dark:text-gray-100">Date</th>
                <th className="text-left py-2 text-gray-900 dark:text-gray-100">Customer</th>
                <th className="text-left py-2 text-gray-900 dark:text-gray-100">Amount</th>
                <th className="text-left py-2 text-gray-900 dark:text-gray-100">Payment</th>
                <th className="text-left py-2 text-gray-900 dark:text-gray-100">Status</th>
              </tr>
            </thead>
            <tbody>
              {sales.slice(0, 10).map((sale) => (
                <tr key={sale.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 text-gray-900 dark:text-gray-100">
                    {new Date(sale.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2 text-gray-900 dark:text-gray-100">
                    {sale.customer_name || 'Walk-in'}
                  </td>
                  <td className="py-2 font-semibold text-gray-900 dark:text-gray-100">
                    KES {sale.total_amount.toLocaleString()}
                  </td>
                  <td className="py-2 text-gray-900 dark:text-gray-100 capitalize">
                    {sale.payment_method}
                  </td>
                  <td className="py-2">
                    <span className={`inline-block px-2 py-1 rounded text-xs ${
                      sale.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {sale.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}