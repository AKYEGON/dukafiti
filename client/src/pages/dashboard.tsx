import { useState } from "react";
import { useLocation } from "wouter";
import { type DashboardMetrics, type Order } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  BarChart3,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductForm } from "@/components/inventory/product-form";
import { CustomerForm } from "@/components/customers/customer-form";
import { RefreshButton } from "@/components/ui/refresh-button";
import { useEnhancedQuery } from "@/hooks/useEnhancedQuery";
import { useSales } from "@/hooks/useSales";
import { useComprehensiveRealtime, useVisibilityRefresh } from "@/hooks/useComprehensiveRealtime";
import { getDashboardMetrics } from "@/lib/supabase-data";
import { DashboardMonitor } from "@/components/debug/dashboard-monitor";



export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  // Enable comprehensive real-time updates
  const { forceRefresh, isConnected } = useComprehensiveRealtime({
    enabled: true,
    tables: ['products', 'customers', 'orders', 'notifications'],
    autoRefresh: true,
    showNotifications: true,
  });

  // Auto-refresh when page becomes visible
  useVisibilityRefresh();

  // Enhanced dashboard metrics query
  const { 
    data: metrics, 
    isLoading: metricsLoading, 
    refresh: refreshMetrics,
    isStale: metricsStale,
    isFetching: metricsFetching
  } = useEnhancedQuery<DashboardMetrics>({
    queryKey: ["dashboard-metrics"],
    queryFn: getDashboardMetrics,
    enableRealtime: true,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Enhanced recent orders query using the new sales hook
  const { 
    recentOrders, 
    recentOrdersLoading, 
    refreshRecentOrders,
    isStale: ordersStale,
    isFetching: ordersFetching
  } = useSales();

  // Quick Actions handlers
  const handleAddProduct = () => {
    setShowProductForm(true);
  };

  const handleCreateOrder = () => {
    setLocation("/sales");
  };

  const handleAddCustomer = () => {
    setShowCustomerForm(true);
  };

  const handleGenerateReport = () => {
    setLocation("/reports");
  };

  const handleViewAllOrders = () => {
    setLocation("/reports");
  };

  // Summary Card Component with accessibility and skeleton loading
  const SummaryCard = ({ 
    title, 
    value, 
    icon: Icon, 
    isLoading,
    iconColor = "bg-green-600"
  }: { 
    title: string; 
    value: string; 
    icon: any; 
    isLoading: boolean;
    iconColor?: string;
  }) => (
    <div className="bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2 font-medium">
            {title}
          </p>
          {isLoading ? (
            <Skeleton className="h-8 w-24 animate-pulse bg-gray-200 dark:bg-gray-700 rounded" />
          ) : (
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {value}
            </p>
          )}
        </div>
        <div className={`${iconColor} p-3 rounded-full`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );

  // Quick Action Button Component
  const QuickActionButton = ({ 
    onClick, 
    icon: Icon, 
    label,
    ariaLabel
  }: { 
    onClick: () => void; 
    icon: any; 
    label: string;
    ariaLabel: string;
  }) => (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="flex items-center justify-center bg-accent hover:bg-purple-700 text-white rounded-lg px-6 py-4 shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 min-w-[180px] focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
    >
      <Icon className="h-5 w-5 mr-3" />
      <span className="font-medium">{label}</span>
    </button>
  );

  // Loading State Component
  const DashboardSkeleton = () => (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 gap-8">
        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <Skeleton className="h-4 w-3/4 mb-3 animate-pulse bg-gray-200 dark:bg-gray-700 rounded" />
              <Skeleton className="h-8 w-1/2 animate-pulse bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
        
        {/* Quick Actions Skeleton */}
        <div className="flex flex-wrap gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-48 rounded-lg animate-pulse bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
        
        {/* Recent Orders Skeleton */}
        <div className="bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <Skeleton className="h-6 w-48 mb-4 animate-pulse bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full animate-pulse bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (metricsLoading) {
    return <DashboardSkeleton />;
  }

  // Refresh all dashboard data
  const handleRefreshAll = async () => {
    await Promise.all([
      refreshMetrics(),
      refreshRecentOrders()
    ]);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with refresh button */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Business overview and key metrics
                {(metricsStale || ordersStale) && (
                  <span className="ml-2 text-orange-600 dark:text-orange-400">• Updating...</span>
                )}
              </p>
            </div>
            <RefreshButton
              onRefresh={async () => {
                forceRefresh();
                await handleRefreshAll();
              }}
              isLoading={metricsFetching || ordersFetching}
              size="sm"
              variant="outline"
              showLabel={true}
              label="Refresh All"
            />
          </div>
        </div>
      </div>

      {/* Responsive Container */}
      <div className="container mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:gap-8">
          {/* Summary Cards - Mobile: 2 cols, Tablet: 3 cols, Desktop: 4 cols */}
          <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6" role="region" aria-label="Key performance indicators">
            <SummaryCard
              title="Total Revenue"
              value={formatCurrency(metrics?.totalRevenue || "0")}
              icon={DollarSign}
              isLoading={metricsLoading}
              iconColor="bg-green-600"
            />
            <SummaryCard
              title="Total Orders"
              value={(metrics?.totalOrders || 0).toString()}
              icon={ShoppingCart}
              isLoading={metricsLoading}
              iconColor="bg-blue-600"
            />
            <SummaryCard
              title="Inventory Items"
              value={(metrics?.totalProducts || 0).toString()}
              icon={Package}
              isLoading={metricsLoading}
              iconColor="bg-accent"
            />
            <SummaryCard
              title="Active Customers"
              value={(metrics?.totalCustomers || 0).toString()}
              icon={Users}
              isLoading={metricsLoading}
              iconColor="bg-orange-600"
            />
          </section>

          {/* Quick Actions - Mobile: 1 col, Tablet: 2 per row, Desktop: flex wrap */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-4" role="region" aria-label="Quick actions">
            <QuickActionButton
              onClick={handleAddProduct}
              icon={Plus}
              label="Add Product"
              ariaLabel="Add a new product to inventory"
            />
            <QuickActionButton
              onClick={handleCreateOrder}
              icon={ShoppingCart}
              label="Create Order"
              ariaLabel="Create a new sales order"
            />
            <QuickActionButton
              onClick={handleAddCustomer}
              icon={UserPlus}
              label="Add Customer"
              ariaLabel="Add a new customer"
            />
            <QuickActionButton
              onClick={handleGenerateReport}
              icon={BarChart3}
              label="Generate Report"
              ariaLabel="Generate business reports"
            />
          </section>

          {/* Recent Orders */}
          <section className="bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg shadow-md" role="region" aria-label="Recent orders">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Recent Orders</h2>
                <button
                  onClick={handleViewAllOrders}
                  className="text-green-600 hover:text-green-700 hover:underline focus:outline-none focus:ring-2 focus:ring-green-600 rounded px-2 py-1 text-sm font-medium"
                >
                  View All
                </button>
              </div>

              {ordersLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full animate-pulse bg-gray-200 dark:bg-gray-700 rounded" />
                  ))}
                </div>
              ) : recentOrders && recentOrders.length > 0 ? (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block">
                    <Table className="table-auto w-full text-sm">
                      <TableHeader>
                        <TableRow className="bg-gray-100 dark:bg-gray-800">
                          <TableHead className="text-gray-700 dark:text-gray-200 font-medium">Products</TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-200 font-medium">Customer</TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-200 font-medium text-right">Amount</TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-200 font-medium">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentOrders.map((order, index) => (
                          <TableRow 
                            key={order.id} 
                            className={`${
                              index % 2 === 0 
                                ? 'bg-white dark:bg-[#1F1F1F]' 
                                : 'bg-gray-50 dark:bg-gray-800'
                            } hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                          >
                            <TableCell className="font-medium text-neutral-900 dark:text-neutral-100">
                              {order.products && order.products.length > 0 ? (
                                <span className="text-sm">
                                  {order.products.slice(0, 2).map((product, idx) => (
                                    <span key={idx}>
                                      {product.name} x{product.quantity}
                                      {idx < Math.min(order.products.length, 2) - 1 ? ', ' : ''}
                                    </span>
                                  ))}
                                  {order.products.length > 2 && (
                                    <span className="text-gray-500 dark:text-gray-400">
                                      {' '}+{order.products.length - 2} more
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-gray-500 dark:text-gray-400 text-sm">No products</span>
                              )}
                            </TableCell>
                            <TableCell className="text-neutral-700 dark:text-neutral-300">{order.customerName || 'N/A'}</TableCell>
                            <TableCell className="text-right font-semibold text-neutral-900 dark:text-neutral-100">{formatCurrency(order.total)}</TableCell>
                            <TableCell>
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full text-xs font-medium">
                                {order.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                              {order.products && order.products.length > 0 ? (
                                <span className="text-sm">
                                  {order.products.slice(0, 2).map((product, idx) => (
                                    <span key={idx}>
                                      {product.name} x{product.quantity}
                                      {idx < Math.min(order.products.length, 2) - 1 ? ', ' : ''}
                                    </span>
                                  ))}
                                  {order.products.length > 2 && (
                                    <span className="text-gray-500 dark:text-gray-400">
                                      {' '}+{order.products.length - 2} more
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-gray-500 dark:text-gray-400 text-sm">No products</span>
                              )}
                            </div>
                            <p className="text-sm text-neutral-700 dark:text-neutral-300">{order.customerName || 'N/A'}</p>
                          </div>
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full text-xs font-medium">
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{formatCurrency(order.total)}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg">No recent orders</p>
                </div>
              )}
            </div>
          </section>

          {/* Debug Monitor - Remove after testing */}
          {process.env.NODE_ENV === 'development' && (
            <div className="container mx-auto px-4 sm:px-6 md:px-8 py-4">
              <DashboardMonitor />
            </div>
          )}
        </div>
      </div>

      {/* Modal Components */}
      <ProductForm 
        open={showProductForm} 
        onOpenChange={setShowProductForm} 
      />
      
      <CustomerForm 
        open={showCustomerForm} 
        onOpenChange={setShowCustomerForm} 
      />
    </div>
  );
}