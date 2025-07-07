import { useState, useMemo, useCallback } from "react";
import { useDirectSupabase } from "@/hooks/useDirectSupabase";
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  Download, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Users,
  Calendar,
  BarChart3
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Order {
  id: string;
  customer_name: string;
  total_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_sale: number;
}

export default function ReportsRuntime() {
  const [timeframe, setTimeframe] = useState("7d");
  const [chartView, setChartView] = useState("daily");
  const { toast } = useToast();

  // Direct Supabase hooks for runtime data
  const {
    items: orders,
    loading: ordersLoading,
    refresh: refreshOrders
  } = useDirectSupabase<Order>({ 
    table: 'orders',
    orderBy: 'created_at',
    ascending: false
  });

  const {
    items: orderItems,
    loading: orderItemsLoading,
    refresh: refreshOrderItems
  } = useDirectSupabase<OrderItem>({ 
    table: 'order_items',
    orderBy: 'created_at',
    ascending: false
  });

  const {
    items: products,
    loading: productsLoading,
    refresh: refreshProducts
  } = useDirectSupabase({ 
    table: 'products',
    orderBy: 'name',
    ascending: true
  });

  const {
    items: customers,
    loading: customersLoading,
    refresh: refreshCustomers
  } = useDirectSupabase({ 
    table: 'customers',
    orderBy: 'balance',
    ascending: false
  });

  // Calculate summary metrics
  const summaryData = useMemo(() => {
    if (!orders || orders.length === 0) return null;

    const now = new Date();
    const timeframeDays = timeframe === "24h" ? 1 : timeframe === "7d" ? 7 : timeframe === "30d" ? 30 : 365;
    const cutoffDate = new Date(now.getTime() - timeframeDays * 24 * 60 * 60 * 1000);

    const filteredOrders = orders.filter(order => new Date(order.created_at) >= cutoffDate);
    
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total_amount, 0);
    const totalOrders = filteredOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const paymentMethods = filteredOrders.reduce((acc, order) => {
      acc[order.payment_method] = (acc[order.payment_method] || 0) + order.total_amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      paymentMethods
    };
  }, [orders, timeframe]);

  // Generate chart data
  const chartData = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    const now = new Date();
    const timeframeDays = timeframe === "24h" ? 1 : timeframe === "7d" ? 7 : timeframe === "30d" ? 30 : 365;
    const cutoffDate = new Date(now.getTime() - timeframeDays * 24 * 60 * 60 * 1000);

    const filteredOrders = orders.filter(order => new Date(order.created_at) >= cutoffDate);

    // Group by day for simplicity
    const dailyData = filteredOrders.reduce((acc, order) => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, revenue: 0, orders: 0 };
      }
      acc[date].revenue += order.total_amount;
      acc[date].orders += 1;
      return acc;
    }, {} as Record<string, { date: string; revenue: number; orders: number }>);

    return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
  }, [orders, timeframe]);

  // Top selling products
  const topProducts = useMemo(() => {
    if (!orderItems || !products || orderItems.length === 0) return [];

    const productSales = orderItems.reduce((acc, item) => {
      if (!acc[item.product_id]) {
        acc[item.product_id] = { quantity: 0, revenue: 0 };
      }
      acc[item.product_id].quantity += item.quantity;
      acc[item.product_id].revenue += item.price_at_sale * item.quantity;
      return acc;
    }, {} as Record<string, { quantity: number; revenue: number }>);

    return Object.entries(productSales)
      .map(([productId, data]) => {
        const product = products.find((p: any) => p.id === productId);
        return {
          id: productId,
          name: product?.name || 'Unknown Product',
          quantity: data.quantity,
          revenue: data.revenue
        };
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [orderItems, products]);

  // Top customers by credit
  const topCustomers = useMemo(() => {
    if (!customers || customers.length === 0) return [];
    
    return customers
      .filter((customer: any) => (customer.balance || 0) > 0)
      .sort((a: any, b: any) => (b.balance || 0) - (a.balance || 0))
      .slice(0, 5);
  }, [customers]);

  // Export CSV functionality
  const exportToCSV = useCallback(() => {
    if (!orders || orders.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no orders to export",
        variant: "destructive"
      });
      return;
    }

    const csvData = [
      ['Order ID', 'Customer', 'Total Amount', 'Payment Method', 'Status', 'Date'],
      ...orders.map(order => [
        order.id,
        order.customer_name,
        order.total_amount,
        order.payment_method,
        order.status,
        new Date(order.created_at).toLocaleDateString()
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reports_${timeframe}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "Reports data has been exported to CSV"
    });
  }, [orders, timeframe, toast]);

  const refreshAll = useCallback(() => {
    Promise.all([
      refreshOrders(),
      refreshOrderItems(),
      refreshProducts(),
      refreshCustomers()
    ]);
  }, [refreshOrders, refreshOrderItems, refreshProducts, refreshCustomers]);

  if (ordersLoading || orderItemsLoading || productsLoading || customersLoading) {
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
          {Array.from({ length: 4 }).map((_, i) => (
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
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Reports & Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Runtime Data • {orders?.length || 0} total orders
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
            <Button
              onClick={exportToCSV}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={chartView} onValueChange={setChartView}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Chart view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily View</SelectItem>
              <SelectItem value="weekly">Weekly View</SelectItem>
              <SelectItem value="monthly">Monthly View</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      {summaryData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                KES {summaryData.totalRevenue.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaryData.totalOrders.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Average Order
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                KES {summaryData.averageOrderValue.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Object.entries(summaryData.paymentMethods).map(([method, amount]) => (
                  <div key={method} className="text-sm">
                    {method}: KES {(amount as number).toLocaleString()}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-24 h-24 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <BarChart3 className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Data Available</h3>
          <p className="text-gray-500 dark:text-gray-400">Start making sales to see reports and analytics.</p>
        </div>
      )}

      {/* Sales Trend Chart */}
      {chartData.length > 0 && (
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Sales Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'revenue' ? `KES ${(value as number).toLocaleString()}` : value,
                      name === 'revenue' ? 'Revenue' : 'Orders'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Products and Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No product sales data</p>
            ) : (
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{product.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {product.quantity} units sold
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-brand">
                        KES {product.revenue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Customers by Credit */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle>Top Customers by Credit</CardTitle>
          </CardHeader>
          <CardContent>
            {topCustomers.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No credit customers</p>
            ) : (
              <div className="space-y-4">
                {topCustomers.map((customer: any, index) => (
                  <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{customer.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {customer.phone}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-red-600">
                        KES {(customer.balance || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {!orders || orders.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 10).map((order) => (
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
    </div>
  );
}