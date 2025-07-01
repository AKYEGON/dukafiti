import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { type DashboardMetrics, type Order } from "@shared/schema";
import { Header } from "@/components/layout/header";
import { MetricCard } from "@/components/ui/metric-card";
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
      <div className="space-y-6 bg-background text-foreground min-h-screen">
        <Header title="Dashboard" subtitle="Business overview and key metrics" />
        <div className="p-4 lg:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="lg:col-span-2 h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-background text-foreground min-h-screen">
      <Header title="Dashboard" subtitle="Business overview and key metrics" />
      
      <div className="p-4 lg:p-6 space-y-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(metrics?.totalRevenue || "0")}
            change={metrics?.revenueGrowth}
            changeType="positive"
            icon={DollarSign}
            iconColor="text-green-600"
          />
          <MetricCard
            title="Orders Today"
            value={metrics?.totalOrders || 0}
            change={metrics?.ordersGrowth}
            changeType="positive"
            icon={ShoppingCart}
            iconColor="text-blue-600"
          />
          <MetricCard
            title="Inventory Items"
            value={metrics?.totalProducts || 0}
            change={`${metrics?.lowStockCount || 0} low stock`}
            changeType={metrics?.lowStockCount ? "negative" : "neutral"}
            icon={Package}
            iconColor="text-orange-600"
          />
          <MetricCard
            title="Active Customers"
            value={metrics?.activeCustomersCount || 0}
            change="+5.4% this week"
            changeType="positive"
            icon={Users}
            iconColor="text-purple-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Recent Orders */}
          <Card className="lg:col-span-3 order-2 lg:order-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Orders</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-primary"
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          #ORD-{order.id.toString().padStart(3, '0')}
                        </TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell>{formatCurrency(order.total)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No recent orders</h3>
                  <p className="text-sm text-muted-foreground mb-4">Start by creating your first order</p>
                  <Button onClick={handleCreateOrder} className="primary-green">
                    Create Order
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="order-1 lg:order-2">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              <Button 
                className="w-full justify-start text-sm sm:text-base py-2 sm:py-3 primary-green primary-green-hover hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                onClick={handleAddProduct}
                aria-label="Add a new product to inventory"
              >
                <Plus className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">Add New Product</span>
                <kbd className="hidden sm:inline-block ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">Ctrl+P</kbd>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-sm sm:text-base py-2 sm:py-3 hover:bg-primary/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                onClick={handleCreateOrder}
                aria-label="Create a new sales order"
              >
                <ShoppingCart className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">Create Order</span>
                <kbd className="hidden sm:inline-block ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">Ctrl+O</kbd>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-sm sm:text-base py-2 sm:py-3 hover:bg-primary/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                onClick={handleAddCustomer}
                aria-label="Add a new customer"
              >
                <UserPlus className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">Add Customer</span>
                <kbd className="hidden sm:inline-block ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">Ctrl+U</kbd>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-sm sm:text-base py-2 sm:py-3 hover:bg-primary/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                onClick={handleGenerateReport}
                aria-label="Generate business reports"
              >
                <BarChart3 className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">Generate Report</span>
                <kbd className="hidden sm:inline-block ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">Ctrl+R</kbd>
              </Button>
            </CardContent>
          </Card>
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
