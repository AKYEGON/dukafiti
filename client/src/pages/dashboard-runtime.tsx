import { useState, useMemo, useCallback } from "react";
import { useDirectSupabase } from "@/hooks/useDirectSupabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  RefreshCw, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Users,
  AlertTriangle,
  Plus,
  Package,
  CreditCard,
  BarChart3
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: string;
  stock: number | null;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  balance: number | null;
}

interface Order {
  id: string;
  customer_name: string;
  total_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
}

export default function DashboardRuntime() {
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
    refresh: refreshCustomers
  } = useDirectSupabase<Customer>({ 
    table: 'customers',
    orderBy: 'name',
    ascending: true
  });

  const {
    items: orders,
    loading: ordersLoading,
    refresh: refreshOrders
  } = useDirectSupabase<Order>({ 
    table: 'orders',
    orderBy: 'created_at',
    ascending: false
  });

  // Calculate metrics from runtime data
  const metrics = useMemo(() => {
    if (!products || !customers || !orders) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        totalProducts: 0,
        totalCustomers: 0,
        lowStockCount: 0,
        creditBalance: 0
      };
    }

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const todayOrders = orders.filter(order => 
      new Date(order.created_at) >= startOfToday
    );

    const totalRevenue = todayOrders.reduce((sum, order) => sum + order.total_amount, 0);
    const totalOrders = todayOrders.length;
    const totalProducts = products.length;
    const totalCustomers = customers.length;
    
    const lowStockCount = products.filter(product => 
      product.stock !== null && product.stock <= 5
    ).length;
    
    const creditBalance = customers.reduce((sum, customer) => 
      sum + (customer.balance || 0), 0
    );

    return {
      totalRevenue,
      totalOrders,
      totalProducts,
      totalCustomers,
      lowStockCount,
      creditBalance
    };
  }, [products, customers, orders]);

  // Recent orders (last 5)
  const recentOrders = useMemo(() => {
    if (!orders) return [];
    return orders.slice(0, 5);
  }, [orders]);

  // Low stock products
  const lowStockProducts = useMemo(() => {
    if (!products) return [];
    return products
      .filter(product => product.stock !== null && product.stock <= 5)
      .slice(0, 5);
  }, [products]);

  // Top customers by credit balance
  const topCreditCustomers = useMemo(() => {
    if (!customers) return [];
    return customers
      .filter(customer => (customer.balance || 0) > 0)
      .sort((a, b) => (b.balance || 0) - (a.balance || 0))
      .slice(0, 5);
  }, [customers]);

  const refreshAll = useCallback(() => {
    Promise.all([
      refreshProducts(),
      refreshCustomers(),
      refreshOrders()
    ]);
  }, [refreshProducts, refreshCustomers, refreshOrders]);

  const isLoading = productsLoading || customersLoading || ordersLoading;

  if (isLoading) {
    return (
      <div className="h-full flex flex-col space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </div>
          <Skeleton className="h-10 w-[120px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6 p-6 bg-gray-50/50 dark:bg-gray-900/30">
      {/* Header with Runtime Refresh */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Runtime Data • Live Business Overview
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={refreshAll}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Today's Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KES {metrics.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-blue-100 mt-1">
              From {metrics.totalOrders} orders today
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Total Orders Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.totalOrders}
            </div>
            <p className="text-xs text-green-100 mt-1">
              Orders processed today
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="w-4 h-4" />
              Inventory Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.totalProducts}
            </div>
            <p className="text-xs text-purple-100 mt-1">
              Products in inventory
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.totalCustomers}
            </div>
            <p className="text-xs text-orange-100 mt-1">
              Registered customers
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.lowStockCount}
            </div>
            <p className="text-xs text-red-100 mt-1">
              Items need restocking
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Outstanding Credit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KES {metrics.creditBalance.toLocaleString()}
            </div>
            <p className="text-xs text-yellow-100 mt-1">
              Total credit balance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button 
            className="h-auto p-4 flex flex-col items-center gap-2 bg-brand hover:bg-brand-700"
            onClick={() => window.location.href = '/inventory'}
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm">Add Product</span>
          </Button>
          <Button 
            className="h-auto p-4 flex flex-col items-center gap-2 bg-green-600 hover:bg-green-700"
            onClick={() => window.location.href = '/sales'}
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="text-sm">New Sale</span>
          </Button>
          <Button 
            className="h-auto p-4 flex flex-col items-center gap-2 bg-blue-600 hover:bg-blue-700"
            onClick={() => window.location.href = '/customers'}
          >
            <Users className="w-5 h-5" />
            <span className="text-sm">Add Customer</span>
          </Button>
          <Button 
            className="h-auto p-4 flex flex-col items-center gap-2 bg-purple-600 hover:bg-purple-700"
            onClick={() => window.location.href = '/reports'}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-sm">View Reports</span>
          </Button>
        </div>
      </div>

      {/* Data Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No orders yet</p>
                <p className="text-sm">Start making sales to see recent orders here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{order.customer_name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(order.created_at).toLocaleDateString()} • {order.payment_method}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-brand">
                        KES {order.total_amount.toLocaleString()}
                      </div>
                      <Badge variant={order.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Products */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>All products well stocked</p>
                <p className="text-sm">No items need immediate restocking</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{product.name}</div>
                      <div className="text-sm text-red-600 dark:text-red-400">
                        Stock: {product.stock} units remaining
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-brand">
                        KES {parseFloat(product.price).toLocaleString()}
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        Low Stock
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Credit Customers */}
      {topCreditCustomers.length > 0 && (
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Top Credit Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCreditCustomers.map((customer) => (
                <div key={customer.id} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{customer.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {customer.phone}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-red-600">
                      KES {(customer.balance || 0).toLocaleString()}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Credit Balance
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}