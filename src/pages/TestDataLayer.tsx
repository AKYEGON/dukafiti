import useLiveData from '../hooks/useLiveData';
import { Product, Customer } from '../types/database';
import { db } from '../lib/database';
import { testDatabaseConnection } from '../lib/initDatabase';
import { useState, useEffect } from 'react';

export default function TestDataLayer() {
  const { items: products, loading: productsLoading, error: productsError } = useLiveData<Product>('products');
  const { items: customers, loading: customersLoading, error: customersError } = useLiveData<Customer>('customers');
  const [createLoading, setCreateLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<{ success: boolean; error?: string; user?: string } | null>(null);

  useEffect(() => {
    testDatabaseConnection().then(setDbStatus);
  }, []);

  const handleCreateTestProduct = async () => {
    setCreateLoading(true);
    try {
      await db.createProduct({
        name: `Test Product ${Date.now()}`,
        sku: `TEST-${Date.now()}`,
        price: 99.99,
        cost_price: 50.00,
        stock_quantity: 10,
        category: 'Test Category',
        description: 'A test product for verification'
      });
    } catch (error) {
      console.error('Error creating product:', error);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreateTestCustomer = async () => {
    setCreateLoading(true);
    try {
      await db.createCustomer({
        name: `Test Customer ${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        phone: `+1-555-${String(Date.now()).slice(-7)}`,
        address: '123 Test Street',
        credit_balance: 0
      });
    } catch (error) {
      console.error('Error creating customer:', error);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Data Layer Test</h1>
        <p className="text-gray-600 mb-4">
          This page tests the live data functionality and database operations.
        </p>
        
        <div className="mb-4 p-4 rounded-lg bg-gray-50">
          <h3 className="font-semibold text-gray-800 mb-2">Database Connection Status</h3>
          {dbStatus === null && <p className="text-gray-500">Testing connection...</p>}
          {dbStatus?.success && (
            <p className="text-green-600">✓ Connected successfully (User: {dbStatus.user})</p>
          )}
          {dbStatus && !dbStatus.success && (
            <p className="text-red-600">✗ Connection failed: {dbStatus.error}</p>
          )}
        </div>
        
        <div className="flex space-x-4 mb-6">
          <button
            onClick={handleCreateTestProduct}
            disabled={createLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {createLoading ? 'Creating...' : 'Create Test Product'}
          </button>
          <button
            onClick={handleCreateTestCustomer}
            disabled={createLoading}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            {createLoading ? 'Creating...' : 'Create Test Customer'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Products</h2>
          {productsLoading && <p className="text-gray-500">Loading products...</p>}
          {productsError && <p className="text-red-500">Error: {productsError}</p>}
          {!productsLoading && !productsError && (
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(products, null, 2)}
            </pre>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Customers</h2>
          {customersLoading && <p className="text-gray-500">Loading customers...</p>}
          {customersError && <p className="text-red-500">Error: {customersError}</p>}
          {!customersLoading && !customersError && (
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(customers, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}