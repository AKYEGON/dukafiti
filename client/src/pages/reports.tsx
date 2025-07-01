import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, DollarSign, CreditCard, AlertTriangle, TrendingUp, Users, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface SummaryData {
  totalSalesToday: string;
  totalSalesWeek: string;
  totalSalesMonth: string;
  paymentBreakdown: {
    cash: string;
    mpesa: string;
    credit: string;
  };
  pendingMpesa: number;
  lowStockItems: number;
}

interface HourlyData {
  hour: string;
  sales: number;
}

interface TopItem {
  name: string;
  unitsSold: number;
  revenue: string;
}

interface CustomerCredit {
  name: string;
  phone: string;
  balance: string;
}

// CSV Export Utilities
const convertToCSV = (data: any[], headers: string[]): string => {
  const csvRows = [];
  csvRows.push(headers.join(','));
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header.toLowerCase().replace(/\s+/g, '_')] || row[header] || '';
      return `"${value}"`;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
};

const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  // Fetch summary data
  const { data: summaryData, isLoading: summaryLoading } = useQuery<SummaryData>({
    queryKey: ['/api/reports/summary'],
    queryFn: async () => {
      const response = await fetch('/api/reports/summary');
      if (!response.ok) throw new Error('Failed to fetch summary data');
      return response.json();
    }
  });

  // Fetch hourly data
  const { data: hourlyData, isLoading: hourlyLoading } = useQuery<HourlyData[]>({
    queryKey: ['/api/reports/hourly'],
    queryFn: async () => {
      const response = await fetch('/api/reports/hourly');
      if (!response.ok) throw new Error('Failed to fetch hourly data');
      return response.json();
    }
  });

  // Fetch top items
  const { data: topItems, isLoading: topItemsLoading } = useQuery<TopItem[]>({
    queryKey: ['/api/reports/top-items', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/reports/top-items?period=${selectedPeriod}`);
      if (!response.ok) throw new Error('Failed to fetch top items');
      return response.json();
    }
  });

  // Fetch customer credits
  const { data: customerCredits, isLoading: creditsLoading } = useQuery<CustomerCredit[]>({
    queryKey: ['/api/reports/credits'],
    queryFn: async () => {
      const response = await fetch('/api/reports/credits');
      if (!response.ok) throw new Error('Failed to fetch customer credits');
      return response.json();
    }
  });

  // CSV Export Functions
  const exportSummaryCSV = () => {
    if (!summaryData) return;
    
    const data = [
      { metric: 'Total Sales Today', value: summaryData.totalSalesToday },
      { metric: 'Total Sales This Week', value: summaryData.totalSalesWeek },
      { metric: 'Total Sales This Month', value: summaryData.totalSalesMonth },
      { metric: 'Cash Sales', value: summaryData.paymentBreakdown.cash },
      { metric: 'M-Pesa Sales', value: summaryData.paymentBreakdown.mpesa },
      { metric: 'Credit Sales', value: summaryData.paymentBreakdown.credit },
      { metric: 'Pending M-Pesa Payments', value: summaryData.pendingMpesa.toString() },
      { metric: 'Low Stock Items', value: summaryData.lowStockItems.toString() }
    ];
    
    const csv = convertToCSV(data, ['Metric', 'Value']);
    downloadCSV(csv, 'summary.csv');
  };

  const exportTopItemsCSV = () => {
    if (!topItems) return;
    
    const csv = convertToCSV(topItems, ['Name', 'Units Sold', 'Revenue']);
    downloadCSV(csv, 'top_items.csv');
  };

  const exportInventoryCSV = async () => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch inventory');
      const products = await response.json();
      
      const csv = convertToCSV(products, ['Name', 'SKU', 'Price', 'Stock', 'Category']);
      downloadCSV(csv, 'inventory.csv');
    } catch (error) {
      console.error('Failed to export inventory:', error);
    }
  };

  if (summaryLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportSummaryCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Summary CSV
          </Button>
          <Button onClick={exportInventoryCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Inventory CSV
          </Button>
        </div>
      </div>

      {/* Summary Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Sales Today</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(summaryData?.totalSalesToday || "0")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Sales This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(summaryData?.totalSalesWeek || "0")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Sales This Month</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(summaryData?.totalSalesMonth || "0")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Cash Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(summaryData?.paymentBreakdown.cash || "0")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Credit Sales</CardTitle>
            <CreditCard className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(summaryData?.paymentBreakdown.credit || "0")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {summaryData?.lowStockItems || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-green-600">Hourly Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {hourlyLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={hourlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(value as string), 'Sales']} />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#00AA00" 
                    strokeWidth={2}
                    dot={{ fill: '#00AA00' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Customer Credit Ranking */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-green-600">Customer Credit Ranking</CardTitle>
          </CardHeader>
          <CardContent>
            {creditsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {customerCredits?.slice(0, 10).map((customer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        <p className="text-sm text-gray-500">{customer.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(customer.balance)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Selling Items */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-lg font-semibold text-green-600">Top Selling Items</CardTitle>
          <div className="flex gap-2">
            <Select value={selectedPeriod} onValueChange={(value: 'today' | 'week' | 'month') => setSelectedPeriod(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportTopItemsCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {topItemsLoading ? (
            <div className="h-32 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {topItems?.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold text-green-600">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.unitsSold} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(item.revenue)}</p>
                  </div>
                </div>
              ))}
              {(!topItems || topItems.length === 0) && (
                <p className="text-center text-gray-500 py-8">No sales data available for this period</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}