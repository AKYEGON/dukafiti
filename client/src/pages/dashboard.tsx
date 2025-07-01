import { useQuery } from "@tanstack/react-query";
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

export default function Dashboard() {
  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders/recent"],
  });

  if (metricsLoading) {
    return (
      <div className="space-y-6 bg-black text-white min-h-screen">
        <Header title="Dashboard" subtitle="Business overview and key metrics" />
        <div className="p-4 lg:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 bg-gray-800" />
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
    <div className="space-y-6 bg-black text-white min-h-screen">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Orders</CardTitle>
                <Button variant="ghost" size="sm" className="text-primary">
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
              ) : (
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
                    {recentOrders?.map((order) => (
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
              )}
            </CardContent>
          </Card>

          {/* Quick Actions & Alerts */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start primary-green primary-green-hover">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Product
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Create Order
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Customer
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {metrics?.lowStockCount && metrics.lowStockCount > 0 && (
                  <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <AlertTriangle className="text-orange-600 mt-1" size={16} />
                    <div>
                      <p className="text-sm font-medium text-orange-800">Low Stock Alert</p>
                      <p className="text-xs text-orange-600">
                        {metrics.lowStockCount} products are running low
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Info className="text-blue-600 mt-1" size={16} />
                  <div>
                    <p className="text-sm font-medium text-blue-800">System Update</p>
                    <p className="text-xs text-blue-600">New features available</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="text-green-600 mt-1" size={16} />
                  <div>
                    <p className="text-sm font-medium text-green-800">Backup Complete</p>
                    <p className="text-xs text-green-600">Daily backup successful</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
