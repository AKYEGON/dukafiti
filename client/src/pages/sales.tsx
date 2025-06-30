import { useQuery } from "@tanstack/react-query";
import { type Order, type DashboardMetrics } from "@shared/schema";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, ShoppingCart, BarChart3, Download } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function Sales() {
  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  // Calculate sales metrics
  const completedOrders = orders?.filter(order => order.status === 'completed') || [];
  const totalSales = completedOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
  const averageOrderValue = completedOrders.length > 0 ? totalSales / completedOrders.length : 0;

  if (metricsLoading || ordersLoading) {
    return (
      <div className="space-y-6">
        <Header title="Sales Overview" subtitle="Monitor sales performance and analytics" />
        <div className="p-4 lg:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header title="Sales Overview" subtitle="Monitor sales performance and analytics" />
      
      <div className="p-4 lg:p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <CardTitle>Sales Analytics</CardTitle>
              <div className="flex space-x-3">
                <Select defaultValue="7days">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Last 7 days</SelectItem>
                    <SelectItem value="30days">Last 30 days</SelectItem>
                    <SelectItem value="3months">Last 3 months</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="primary-green-hover">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Sales Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 font-medium text-sm">Total Sales</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrency(totalSales)}
                    </p>
                  </div>
                  <BarChart3 className="text-green-600" size={32} />
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 font-medium text-sm">Orders</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {orders?.length || 0}
                    </p>
                  </div>
                  <ShoppingCart className="text-blue-600" size={32} />
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 font-medium text-sm">Avg. Order</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrency(averageOrderValue)}
                    </p>
                  </div>
                  <DollarSign className="text-purple-600" size={32} />
                </div>
              </div>
            </div>
            
            {/* Chart Placeholder */}
            <div className="bg-gray-50 rounded-lg h-64 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600 font-medium">Sales Chart Visualization</p>
                <p className="text-gray-500 text-sm">Chart implementation would go here</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Sales Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Electronics</span>
                  <span className="text-sm text-gray-600">{formatCurrency(8540)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Accessories</span>
                  <span className="text-sm text-gray-600">{formatCurrency(3935)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '35%' }}></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Wireless Headphones</p>
                    <p className="text-xs text-gray-500">15 units sold</p>
                  </div>
                  <span className="text-sm font-medium">{formatCurrency(1949.85)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Smartphone Case</p>
                    <p className="text-xs text-gray-500">32 units sold</p>
                  </div>
                  <span className="text-sm font-medium">{formatCurrency(799.68)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Bluetooth Speaker</p>
                    <p className="text-xs text-gray-500">8 units sold</p>
                  </div>
                  <span className="text-sm font-medium">{formatCurrency(639.92)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
