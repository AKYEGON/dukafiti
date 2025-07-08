import useLiveData from '../hooks/useLiveData';
import { Product, Customer, Sale } from '../types/schema';

export default function Dashboard() {
  const { items: products } = useLiveData<Product>('products');
  const { items: customers } = useLiveData<Customer>('customers');
  const { items: sales } = useLiveData<Sale>('sales');

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const lowStockProducts = products.filter(p => (p.stock_quantity || 0) <= 10);
  const pendingCredits = customers.reduce((sum, customer) => sum + customer.balance, 0);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Total Revenue</h3>
          <p className="text-3xl font-bold text-green-600">KES {totalRevenue.toLocaleString()}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Products</h3>
          <p className="text-3xl font-bold text-blue-600">{products.length}</p>
          {lowStockProducts.length > 0 && (
            <p className="text-sm text-red-600">{lowStockProducts.length} low stock</p>
          )}
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Pending Credits</h3>
          <p className="text-3xl font-bold text-orange-600">KES {pendingCredits.toLocaleString()}</p>
        </div>
      </div>

      {/* Recent Sales */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Sales</h3>
        <div className="space-y-2">
          {sales.slice(0, 5).map((sale) => (
            <div key={sale.id} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {sale.customer_name || 'Walk-in Customer'}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(sale.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900 dark:text-gray-100">KES {sale.total_amount.toLocaleString()}</p>
                <span className={`inline-block px-2 py-1 rounded text-xs ${
                  sale.status === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {sale.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}