import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { type DashboardMetrics, type Order } from "@shared/schema";
import { calcPctChange, formatCurrency as formatCurrencyUtil } from "@shared/utils";
import { MobilePageWrapper } from "@/components/layout/mobile-page-wrapper";
import { MetricCard } from "@/components/ui/metric-card";
import { SimpleMetricCard } from "@/components/ui/simple-metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  FileText,
  BarChart3,
  AlertTriangle,
  Info,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductForm } from "@/components/inventory/product-form";
import { CustomerForm } from "@/components/customers/customer-form";

export default function Dashboard() {
  
  const [, setLocation] = useLocation();
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const { data: detailedMetrics, isLoading: detailedMetricsLoading, refetch: refetchDetailedMetrics } = useQuery<DetailedMetrics>({
    queryKey: ["/api/metrics/dashboard"],
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders/recent"],
  });

  // Manual sync functionality
  const handleManualSync = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchDetailedMetrics(),
        // Refetch other queries if needed
      ]);
    } catch (error) {
      console.error('Manual sync error:', error);
    } finally {
      setIsRefreshing(false);
    }
  };



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

  // Keyboard shortcuts for Quick Actions
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger shortcuts when no modal is open and not typing in input
      if (showProductForm || showCustomerForm || 
          event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Check for Ctrl/Cmd + key combinations
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'p':
            event.preventDefault();
            handleAddProduct();
            break;
          case 'o':
            event.preventDefault();
            handleCreateOrder();
            break;
          case 'u':
            event.preventDefault();
            handleAddCustomer();
            break;
          case 'r':
            event.preventDefault();
            handleGenerateReport();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showProductForm, showCustomerForm]);

  if (metricsLoading) {
    return (
      <MobilePageWrapper title="Dashboard">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="space-y-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </MobilePageWrapper>
    );
  }

  return (
    <MobilePageWrapper title="Dashboard">
      <div className="space-y-6">
        {/* Simplified Metrics Cards without Percentage Changes */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SimpleMetricCard
            title="Total Revenue"
            value={detailedMetrics?.revenue ? formatCurrencyUtil(detailedMetrics.revenue.today) : formatCurrency(metrics?.totalRevenue || "0")}
            icon={DollarSign}
            isLoading={detailedMetricsLoading || metricsLoading}
            isRefreshing={isRefreshing}
            error={!detailedMetrics && !detailedMetricsLoading}
          />
          <SimpleMetricCard
            title="Orders Today"
            value={detailedMetrics?.orders ? detailedMetrics.orders.today.toString() : (metrics?.totalOrders || 0).toString()}
            icon={ShoppingCart}
            isLoading={detailedMetricsLoading || metricsLoading}
            isRefreshing={isRefreshing}
            error={!detailedMetrics && !detailedMetricsLoading}
          />
          <SimpleMetricCard
            title="Inventory Items"
            value={detailedMetrics?.inventory ? detailedMetrics.inventory.totalItems.toString() : (metrics?.totalProducts || 0).toString()}
            icon={Package}
            isLoading={detailedMetricsLoading || metricsLoading}
            isRefreshing={isRefreshing}
            error={!detailedMetrics && !detailedMetricsLoading}
          />
          <SimpleMetricCard
            title="Active Customers"
            value={detailedMetrics?.customers ? detailedMetrics.customers.active.toString() : (metrics?.activeCustomersCount || 0).toString()}
            icon={Users}
            isLoading={detailedMetricsLoading || metricsLoading}
            isRefreshing={isRefreshing}
            error={!detailedMetrics && !detailedMetricsLoading}
          />
        </div>

        {/* Quick Actions - Mobile-first positioning */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl leading-relaxed">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full h-12 justify-start text-base leading-relaxed bg-purple-600 hover:bg-purple-700 text-white font-medium transition-all duration-200"
              onClick={handleAddProduct}
              aria-label="Add a new product to inventory"
            >
              <Plus className="mr-3 h-5 w-5 flex-shrink-0" />
              <span className="truncate">Add New Product</span>
            </Button>
            <Button 
              className="w-full h-12 justify-start text-base leading-relaxed bg-green-600 hover:bg-green-700 text-white font-medium transition-all duration-200"
              onClick={handleCreateOrder}
              aria-label="Create a new sales order"
            >
              <ShoppingCart className="mr-3 h-5 w-5 flex-shrink-0" />
              <span className="truncate">Create Order</span>
            </Button>
            <Button 
              className="w-full h-12 justify-start text-base leading-relaxed border border-purple-300 text-purple-600 hover:bg-purple-50 hover:shadow-[0_4px_12px_rgba(168,85,247,0.4)] transition-all duration-200"
              onClick={handleAddCustomer}
              aria-label="Add a new customer"
            >
              <UserPlus className="mr-3 h-5 w-5 flex-shrink-0" />
              <span className="truncate">Add Customer</span>
            </Button>
            <Button 
              className="w-full h-12 justify-start text-base leading-relaxed border border-purple-300 text-purple-600 hover:bg-purple-50 hover:shadow-[0_4px_12px_rgba(168,85,247,0.4)] transition-all duration-200"
              onClick={handleGenerateReport}
              aria-label="Generate business reports"
            >
              <BarChart3 className="mr-3 h-5 w-5 flex-shrink-0" />
              <span className="truncate">Generate Report</span>
            </Button>
            <Button 
              className="w-full h-12 justify-start text-base leading-relaxed border border-blue-300 text-blue-600 hover:bg-blue-50 hover:shadow-[0_4px_12px_rgba(59,130,246,0.4)] transition-all duration-200"
              onClick={handleManualSync}
              disabled={isRefreshing}
              aria-label="Sync data and refresh metrics"
            >
              {isRefreshing ? (
                <>
                  <div className="mr-3 h-5 w-5 animate-spin border-2 border-blue-600 border-t-transparent rounded-full flex-shrink-0" />
                  <span className="truncate">Syncing...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span className="truncate">Sync Now</span>
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Orders - Full width on mobile */}
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl leading-relaxed">Recent Orders</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary h-12 min-w-[120px]"
                onClick={handleViewAllOrders}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : recentOrders && recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-base">Order ID</TableHead>
                      <TableHead className="text-base">Customer</TableHead>
                      <TableHead className="text-base">Amount</TableHead>
                      <TableHead className="text-base">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow key={order.id} className="h-12">
                        <TableCell className="font-medium text-base leading-relaxed">
                          #ORD-{order.id.toString().padStart(3, '0')}
                        </TableCell>
                        <TableCell className="text-base leading-relaxed">{order.customerName}</TableCell>
                        <TableCell className="text-base leading-relaxed">{formatCurrency(order.total)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium text-foreground mb-2 leading-relaxed">No recent orders</h3>
                <p className="text-base text-muted-foreground mb-4 leading-relaxed">Start by creating your first order</p>
                <Button onClick={handleCreateOrder} className="h-12 text-base bg-green-600 hover:bg-green-700 text-white">
                  Create Order
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
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
    </MobilePageWrapper>
  );
}
