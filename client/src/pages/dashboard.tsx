import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { type DashboardMetrics, type Order } from "@shared/schema";
import { formatCurrency as formatCurrencyUtil } from "@shared/utils";
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

interface DetailedMetrics {
  revenue: {
    today: number;
    yesterday: number;
    weekToDate: number;
    priorWeekToDate: number;
  };
  orders: {
    today: number;
    yesterday: number;
  };
  inventory: {
    totalItems: number;
    priorSnapshot: number;
  };
  customers: {
    active: number;
    priorActive: number;
  };
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: detailedMetrics, isLoading: detailedMetricsLoading } = useQuery<DetailedMetrics>({
    queryKey: ["/api/metrics/dashboard"],
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders/recent"],
  });

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
      className="flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-6 py-4 shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 min-w-[180px] focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile: px-4 py-4, Desktop: container mx-auto p-6 */}
      <div className="px-4 py-4 sm:container sm:mx-auto sm:p-6">
        <div className="grid grid-cols-1 gap-8">
          {/* Summary Cards - F/Z Pattern: Most critical metric at top-left */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-4" role="region" aria-label="Key performance indicators">
            <SummaryCard
              title="Total Revenue"
              value={detailedMetrics?.revenue ? formatCurrencyUtil(detailedMetrics.revenue.today) : formatCurrency(metrics?.totalRevenue || "0")}
              icon={DollarSign}
              isLoading={detailedMetricsLoading}
              iconColor="bg-green-600"
            />
            <SummaryCard
              title="Orders Today"
              value={detailedMetrics?.orders ? detailedMetrics.orders.today.toString() : (metrics?.totalOrders || 0).toString()}
              icon={ShoppingCart}
              isLoading={detailedMetricsLoading}
              iconColor="bg-blue-600"
            />
            <SummaryCard
              title="Inventory Items"
              value={detailedMetrics?.inventory ? detailedMetrics.inventory.totalItems.toString() : (metrics?.totalProducts || 0).toString()}
              icon={Package}
              isLoading={detailedMetricsLoading}
              iconColor="bg-purple-600"
            />
            <SummaryCard
              title="Active Customers"
              value={detailedMetrics?.customers ? detailedMetrics.customers.active.toString() : (metrics?.activeCustomersCount || 0).toString()}
              icon={Users}
              isLoading={detailedMetricsLoading}
              iconColor="bg-orange-600"
            />
          </section>

          {/* Quick Actions */}
          <section className="flex flex-wrap gap-4" role="region" aria-label="Quick actions">
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
                          <TableHead className="text-gray-700 dark:text-gray-200 font-medium">Order ID</TableHead>
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
                              #ORD-{order.id.toString().padStart(3, '0')}
                            </TableCell>
                            <TableCell className="text-neutral-700 dark:text-neutral-300">{order.customerName}</TableCell>
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
                          <span className="font-medium text-neutral-900 dark:text-neutral-100">
                            #ORD-{order.id.toString().padStart(3, '0')}
                          </span>
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full text-xs font-medium">
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-1">{order.customerName}</p>
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