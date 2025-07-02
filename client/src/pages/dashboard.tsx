import { useState, useEffect } from "react";
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
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductForm } from "@/components/inventory/product-form";
import { CustomerForm } from "@/components/customers/customer-form";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

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
    setLocation("/sales");
  };

  // Professional Summary Card Component
  const SummaryCard = ({ title, value, icon: Icon, isLoading }: { 
    title: string; 
    value: string; 
    icon: any; 
    isLoading: boolean;
  }) => (
    <div className="bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow hover:shadow-lg transition-shadow duration-200 dark:shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
            {title}
          </p>
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="text-2xl font-extrabold text-foreground">
              {value}
            </p>
          )}
        </div>
        <div className="bg-green-600 p-3 rounded-full">
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  // Professional Action Button Component
  const ActionButton = ({ 
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
      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-xl flex items-center gap-3 shadow-md transition-all duration-200 transform hover:-translate-y-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-green-600"
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium">{label}</span>
    </button>
  );

  if (metricsLoading) {
    return (
      <div className="min-h-screen bg-background p-6 lg:p-12">
        <div className="space-y-8">
          {/* Loading Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <Skeleton className="h-6 w-3/4 mb-3" />
                <Skeleton className="h-8 w-1/2" />
              </div>
            ))}
          </div>
          
          {/* Loading Quick Actions */}
          <div className="flex flex-wrap gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-48 rounded-xl" />
            ))}
          </div>
          
          {/* Loading Recent Orders */}
          <div className="bg-white dark:bg-[#1F1F1F] rounded-xl p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12">
      <div className="space-y-8">
        {/* Row 1: Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard
            title="Total Revenue"
            value={detailedMetrics?.revenue ? formatCurrencyUtil(detailedMetrics.revenue.today) : formatCurrency(metrics?.totalRevenue || "0")}
            icon={DollarSign}
            isLoading={detailedMetricsLoading}
          />
          <SummaryCard
            title="Orders Today"
            value={detailedMetrics?.orders ? detailedMetrics.orders.today.toString() : (metrics?.totalOrders || 0).toString()}
            icon={ShoppingCart}
            isLoading={detailedMetricsLoading}
          />
          <SummaryCard
            title="Inventory Items"
            value={detailedMetrics?.inventory ? detailedMetrics.inventory.totalItems.toString() : (metrics?.totalProducts || 0).toString()}
            icon={Package}
            isLoading={detailedMetricsLoading}
          />
          <SummaryCard
            title="Active Customers"
            value={detailedMetrics?.customers ? detailedMetrics.customers.active.toString() : (metrics?.activeCustomersCount || 0).toString()}
            icon={Users}
            isLoading={detailedMetricsLoading}
          />
        </div>

        {/* Row 2: Quick Actions */}
        <div className="flex flex-wrap gap-4 mt-8">
          <ActionButton
            onClick={handleAddProduct}
            icon={Plus}
            label="Add Product"
            ariaLabel="Add a new product to inventory"
          />
          <ActionButton
            onClick={handleCreateOrder}
            icon={ShoppingCart}
            label="Create Order"
            ariaLabel="Create a new sales order"
          />
          <ActionButton
            onClick={handleAddCustomer}
            icon={UserPlus}
            label="Add Customer"
            ariaLabel="Add a new customer"
          />
          <ActionButton
            onClick={handleGenerateReport}
            icon={BarChart3}
            label="Generate Report"
            ariaLabel="Generate business reports"
          />
        </div>

        {/* Row 3: Recent Orders */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Recent Orders</h2>
            <button
              onClick={handleViewAllOrders}
              className="text-green-600 hover:underline focus:outline-none focus:ring-2 focus:ring-green-600 rounded px-2 py-1"
            >
              View All
            </button>
          </div>

          {ordersLoading ? (
            <div className="bg-white dark:bg-[#1F1F1F] rounded-xl overflow-hidden shadow">
              <div className="p-4 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </div>
          ) : recentOrders && recentOrders.length > 0 ? (
            <div className="hidden md:block">
              <div className="bg-white dark:bg-[#1F1F1F] rounded-xl overflow-hidden shadow">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100 dark:bg-[#2A2A2A]">
                      <TableHead className="text-gray-700 dark:text-gray-300 px-4 py-3">Order ID</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300 px-4 py-3">Customer</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300 px-4 py-3 text-right">Amount</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300 px-4 py-3">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order, index) => (
                      <TableRow 
                        key={order.id} 
                        className={`${
                          index % 2 === 0 
                            ? 'bg-white dark:bg-[#1F1F1F]' 
                            : 'bg-gray-50 dark:bg-[#2A2A2A]'
                        }`}
                      >
                        <TableCell className="px-4 py-3 font-medium">
                          #ORD-{order.id.toString().padStart(3, '0')}
                        </TableCell>
                        <TableCell className="px-4 py-3">{order.customerName}</TableCell>
                        <TableCell className="px-4 py-3 text-right">{formatCurrency(order.total)}</TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                            {order.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1F1F1F] rounded-xl p-12 text-center shadow">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No recent orders</p>
            </div>
          )}

          {/* Mobile Cards Fallback */}
          {recentOrders && recentOrders.length > 0 && (
            <div className="md:hidden space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="bg-white dark:bg-[#1F1F1F] p-4 rounded-xl shadow">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium">#ORD-{order.id.toString().padStart(3, '0')}</span>
                    <Badge className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{order.customerName}</p>
                  <p className="text-lg font-semibold">{formatCurrency(order.total)}</p>
                </div>
              ))}
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
