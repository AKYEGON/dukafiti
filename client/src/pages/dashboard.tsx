import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import useData from "@/hooks/useData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Plus,
  UserPlus,
  FileText,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function MetricCard({ title, value, icon, trend }: MetricCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {trend && (
            <div className={`flex items-center mt-1 text-sm ${
              trend.isPositive ? "text-green-600" : "text-red-600"
            }`}>
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        <div className="h-12 w-12 bg-brand/10 rounded-full flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Use instrumented data hooks for real-time updates and comprehensive logging
  const { items: products, refresh: refreshProducts, debug: productsDebug, isLoading: productsLoading, user } = useData('products');
  const { items: customers, refresh: refreshCustomers, debug: customersDebug, isLoading: customersLoading } = useData('customers');
  const { items: orders, refresh: refreshOrders, debug: ordersDebug, isLoading: ordersLoading } = useData('orders');
  
  // Local state
  const [showDebug, setShowDebug] = useState(false);

  // Combine all debug logs
  const allDebugLogs = [...productsDebug, ...customersDebug, ...ordersDebug];

  // Calculate dashboard metrics in real-time
  const dashboardMetrics = useMemo(() => {
    console.log('[Dashboard] Calculating metrics:', { 
      productsCount: products.length,
      customersCount: customers.length,
      ordersCount: orders.length
    });

    // Calculate total revenue from completed orders
    const totalRevenue = orders
      .filter(order => order.status === 'completed')
      .reduce((sum, order) => sum + parseFloat(order.total_amount || '0'), 0);

    // Count today's orders
    const today = new Date().toISOString().split('T')[0];
    const todaysOrders = orders.filter(order => 
      order.created_at && order.created_at.startsWith(today)
    ).length;

    // Count low stock items (stock <= 10 and not null)
    const lowStockItems = products.filter(product => 
      product.quantity !== null && product.quantity <= 10
    ).length;

    // Calculate total credit outstanding
    const totalCredit = customers.reduce((sum, customer) => 
      sum + parseFloat(customer.balance || '0'), 0
    );

    return {
      totalRevenue,
      ordersToday: todaysOrders,
      inventoryItems: products.length,
      totalCustomers: customers.length,
      lowStockItems,
      totalCredit
    };
  }, [products, customers, orders]);

  // Get recent orders (last 10)
  const recentOrders = useMemo(() => {
    return orders
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);
  }, [orders]);

  // Manual refresh all data
  const handleRefreshAll = async () => {
    console.log('[Dashboard] Manual refresh all triggered');
    toast.info('Refreshing all data...');
    
    try {
      await Promise.all([
        refreshProducts(),
        refreshCustomers(), 
        refreshOrders()
      ]);
      toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('[Dashboard] Refresh failed:', error);
      toast.error('Failed to refresh data');
    }
  };

  // Clear debug logs
  const clearAllDebug = () => {
    // This would need to be implemented in the individual hooks
    console.log('[Dashboard] Clear all debug logs requested');
  };

  const isLoading = productsLoading || customersLoading || ordersLoading;

  if (isLoading && products.length === 0 && customers.length === 0 && orders.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto">
          <Skeleton className="h-12 w-64 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's what's happening with your store.
              {isLoading && <span className="text-orange-500"> • Updating...</span>}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowDebug(!showDebug)}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              {showDebug ? 'Hide' : 'Show'} Debug
            </Button>
            
            <Button
              onClick={handleRefreshAll}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh All
            </Button>
          </div>
        </div>

        {/* Debug Panel */}
        {showDebug && (
          <div className="mb-8 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Debug Logs (All Data Sources)</h3>
              <Button onClick={clearAllDebug} variant="outline" size="sm">
                Clear
              </Button>
            </div>
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap max-h-40 overflow-y-auto">
              {allDebugLogs.length === 0 ? 'No debug logs yet...' : allDebugLogs.join('\n')}
            </pre>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(dashboardMetrics.totalRevenue)}
            icon={<DollarSign className="h-6 w-6 text-brand" />}
          />
          
          <MetricCard
            title="Orders Today"
            value={dashboardMetrics.ordersToday}
            icon={<ShoppingCart className="h-6 w-6 text-brand" />}
          />
          
          <MetricCard
            title="Inventory Items"
            value={dashboardMetrics.inventoryItems}
            icon={<Package className="h-6 w-6 text-brand" />}
          />
          
          <MetricCard
            title="Total Customers"
            value={dashboardMetrics.totalCustomers}
            icon={<Users className="h-6 w-6 text-brand" />}
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold">{dashboardMetrics.lowStockItems}</p>
                <p className="text-sm text-muted-foreground">Items with stock ≤ 10</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Credit Outstanding</p>
                <p className="text-2xl font-bold">{formatCurrency(dashboardMetrics.totalCredit)}</p>
                <p className="text-sm text-muted-foreground">Amount owed by customers</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                onClick={() => navigate("/sales")}
                className="h-20 flex flex-col items-center justify-center"
              >
                <Plus className="h-6 w-6 mb-2" />
                New Sale
              </Button>
              
              <Button
                onClick={() => navigate("/inventory")}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
              >
                <Package className="h-6 w-6 mb-2" />
                Add Product
              </Button>
              
              <Button
                onClick={() => navigate("/customers")}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
              >
                <UserPlus className="h-6 w-6 mb-2" />
                Add Customer
              </Button>
              
              <Button
                onClick={() => navigate("/reports")}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
              >
                <FileText className="h-6 w-6 mb-2" />
                View Reports
              </Button>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Orders</h2>
              <Button 
                onClick={() => navigate("/reports")}
                variant="ghost" 
                size="sm"
              >
                View All
              </Button>
            </div>
            
            {recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No orders yet</p>
                <p className="text-sm text-muted-foreground">Start selling to see orders here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            {order.customer_name || 'Walk-in Customer'}
                          </TableCell>
                          <TableCell>{formatCurrency(parseFloat(order.total_amount || '0'))}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {order.payment_method || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={order.status === 'completed' ? 'default' : 'secondary'}
                            >
                              {order.status || 'pending'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Unknown'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{order.customer_name || 'Walk-in Customer'}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Unknown date'}
                          </p>
                        </div>
                        <Badge 
                          variant={order.status === 'completed' ? 'default' : 'secondary'}
                        >
                          {order.status || 'pending'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{formatCurrency(parseFloat(order.total_amount || '0'))}</span>
                        <Badge variant="outline">
                          {order.payment_method || 'Unknown'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}