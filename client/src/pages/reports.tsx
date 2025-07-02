import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';

// Types
interface SummaryData {
  totalSales: string;
  cashSales: string;
  mobileMoneySales: string;
  creditSales: string;
}

interface TrendData {
  label: string;
  value: number;
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

interface TopCustomer {
  customerName: string;
  totalOwed: string;
  outstandingOrders: number;
}

interface TopProduct {
  productName: string;
  unitsSold: number;
  totalRevenue: string;
}

interface OrderItem {
  productName: string;
  qty: number;
  price: string;
}

interface Order {
  orderId: number;
  date: string;
  customerName: string;
  totalAmount: string;
  status: string;
  reference?: string;
  items: OrderItem[];
}

interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
}

// CSV utility functions
const convertToCSV = (data: any[], headers: string[]): string => {
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header] || row[header.toLowerCase().replace(' ', '')] || '';
      return `"${value.toString().replace(/"/g, '""')}"`;
    }).join(',')
  );
  return [csvHeaders, ...csvRows].join('\n');
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
  // State for timeframe selectors
  const [summaryPeriod, setSummaryPeriod] = useState<'today' | 'weekly' | 'monthly'>('today');
  const [trendPeriod, setTrendPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  // Orders Record state
  const [ordersPeriod, setOrdersPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [ordersPage, setOrdersPage] = useState(1);
  
  const [exportingCSV, setExportingCSV] = useState<string | null>(null);

  // Fetch summary data
  const { data: summaryData, isLoading: summaryLoading, error: summaryError } = useQuery<SummaryData>({
    queryKey: ['/api/reports/summary', summaryPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/reports/summary?period=${summaryPeriod}`);
      if (!response.ok) throw new Error('Failed to fetch summary');
      return response.json();
    }
  });

  // Fetch trend data
  const { data: trendData, isLoading: trendLoading, error: trendError } = useQuery<TrendData[]>({
    queryKey: ['/api/reports/trend', trendPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/reports/trend?period=${trendPeriod}`);
      if (!response.ok) throw new Error('Failed to fetch trend');
      return response.json();
    }
  });

  // Fetch top items data
  const { data: topItemsData, isLoading: topItemsLoading } = useQuery<TopItem[]>({
    queryKey: ['/api/reports/top-items'],
    queryFn: async () => {
      const response = await fetch('/api/reports/top-items');
      if (!response.ok) throw new Error('Failed to fetch top items');
      return response.json();
    }
  });

  // Fetch customer credits data
  const { data: customerCreditsData, isLoading: customerCreditsLoading } = useQuery<CustomerCredit[]>({
    queryKey: ['/api/reports/credits'],
    queryFn: async () => {
      const response = await fetch('/api/reports/credits');
      if (!response.ok) throw new Error('Failed to fetch customer credits');
      return response.json();
    }
  });

  // Fetch top customers data
  const { data: topCustomersData, isLoading: topCustomersLoading } = useQuery<TopCustomer[]>({
    queryKey: ['/api/reports/top-customers', summaryPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/reports/top-customers?period=${summaryPeriod}`);
      if (!response.ok) throw new Error('Failed to fetch top customers');
      return response.json();
    }
  });

  // Fetch top products data
  const { data: topProductsData, isLoading: topProductsLoading } = useQuery<TopProduct[]>({
    queryKey: ['/api/reports/top-products', summaryPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/reports/top-products?period=${summaryPeriod}`);
      if (!response.ok) throw new Error('Failed to fetch top products');
      return response.json();
    }
  });

  // Fetch orders data
  const { data: ordersData, isLoading: ordersLoading, error: ordersError } = useQuery<OrdersResponse>({
    queryKey: ['/api/reports/orders', ordersPeriod, ordersPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        period: ordersPeriod,
        page: ordersPage.toString(),
        limit: '10'
      });
      const response = await fetch(`/api/reports/orders?${params}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    }
  });

  // CSV Export Functions
  const exportSummaryCSV = async () => {
    if (!summaryData) return;
    
    setExportingCSV('summary');
    try {
      const csvData = [
        { type: 'Total Sales', amount: summaryData.totalSales },
        { type: 'Cash Sales', amount: summaryData.cashSales },
        { type: 'Mobile Money Sales', amount: summaryData.mobileMoneySales },
        { type: 'Credit Sales', amount: summaryData.creditSales }
      ];
      
      const csv = convertToCSV(csvData, ['type', 'amount']);
      downloadCSV(csv, `sales-summary-${summaryPeriod}-${new Date().toISOString().split('T')[0]}.csv`);
    } finally {
      setExportingCSV(null);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">Reports</h1>
          <p className="text-neutral-600 dark:text-neutral-400">View your business analytics and performance</p>
        </div>

        {/* Desktop: Two Column Layout / Mobile: Single Column */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Summary & Trend */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Timeframe Selector */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Timeframe:</label>
              <Select value={summaryPeriod} onValueChange={(value: 'today' | 'weekly' | 'monthly') => setSummaryPeriod(value)}>
                <SelectTrigger className="w-40 bg-gray-50 dark:bg-gray-800 border rounded px-3 py-2 focus:ring-2 focus:ring-emerald-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="weekly">Week</SelectItem>
                  <SelectItem value="monthly">Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Total Sales Card */}
              <div className="bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Sales</p>
                {summaryLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                    {formatCurrency(summaryData?.totalSales || '0')}
                  </p>
                )}
              </div>

              {/* Cash Sales Card */}
              <div className="bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Cash</p>
                {summaryLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                    {formatCurrency(summaryData?.cashSales || '0')}
                  </p>
                )}
              </div>

              {/* Mobile Money Card */}
              <div className="bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Mobile Money</p>
                {summaryLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                    {formatCurrency(summaryData?.mobileMoneySales || '0')}
                  </p>
                )}
              </div>

              {/* Credit Sales Card */}
              <div className="bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Credit</p>
                {summaryLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                    {formatCurrency(summaryData?.creditSales || '0')}
                  </p>
                )}
              </div>
            </div>

            {/* Trend Chart */}
            <div className="bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Sales Trend</h3>
                <Select value={trendPeriod} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setTrendPeriod(value)}>
                  <SelectTrigger className="w-32 bg-gray-50 dark:bg-gray-800 border rounded px-3 py-2 focus:ring-2 focus:ring-emerald-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {trendLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : trendData && trendData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-[#374151]" />
                      <XAxis 
                        dataKey="label" 
                        stroke="#6B7280" 
                        fontSize={12}
                        className="dark:stroke-[#9CA3AF]"
                      />
                      <YAxis 
                        stroke="#6B7280" 
                        fontSize={12}
                        className="dark:stroke-[#9CA3AF]"
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#00AA00" 
                        strokeWidth={3}
                        dot={{ fill: '#00AA00', strokeWidth: 2 }}
                        className="dark:stroke-[#6B46C1]"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  No data available for this period.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Top Performance Cards & Orders Record */}
          <div className="space-y-6">
            {/* Top Customers Card - Full Width */}
            <div className="bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Top Customers (Credit)</h3>
              {topCustomersLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : topCustomersData && topCustomersData.length > 0 ? (
                <div className="space-y-3">
                  {topCustomersData.map((customer, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{customer.customerName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{customer.outstandingOrders} outstanding orders</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(customer.totalOwed)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No customers with outstanding credit for this period.
                </div>
              )}
            </div>

            {/* Top-Selling Products Card - Full Width */}
            <div className="bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Top-Selling Products</h3>
              {topProductsLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : topProductsData && topProductsData.length > 0 ? (
                <div className="space-y-3">
                  {topProductsData.map((product, index) => (
                    <div key={index} className="py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{product.productName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{product.unitsSold} units sold</p>
                        </div>
                        <p className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(product.totalRevenue)}</p>
                      </div>
                      {/* Progress bar showing relative sales volume */}
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                          style={{ 
                            width: `${Math.min(100, (product.unitsSold / (topProductsData[0]?.unitsSold || 1)) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No product sales data for this period.
                </div>
              )}
            </div>

            {/* Orders Record - Full Width */}
            <div className="bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Orders Record</h3>
                <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 focus:ring-2 focus:ring-emerald-500">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View All
                </Button>
              </div>

              {ordersLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : ordersData && ordersData.orders.length > 0 ? (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block">
                    <table className="table-auto w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                          <th className="px-3 py-2 text-left">Order ID</th>
                          <th className="px-3 py-2 text-left">Customer</th>
                          <th className="px-3 py-2 text-right">Amount</th>
                          <th className="px-3 py-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ordersData.orders.map((order, index) => (
                          <tr key={order.orderId} className={index % 2 === 0 ? 'bg-white dark:bg-[#1F1F1F]' : 'bg-gray-50 dark:bg-[#2A2A2A]'}>
                            <td className="px-3 py-3 font-medium">#{order.orderId}</td>
                            <td className="px-3 py-3">{order.customerName}</td>
                            <td className="px-3 py-3 text-right font-semibold">{formatCurrency(order.totalAmount)}</td>
                            <td className="px-3 py-3">
                              <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-4">
                    {ordersData.orders.map((order) => (
                      <div key={order.orderId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-none">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium">#{order.orderId}</span>
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{order.customerName}</p>
                        <p className="text-lg font-semibold">{formatCurrency(order.totalAmount)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          {order.items.map(item => `${item.productName} (${item.qty})`).join(', ')}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No data available for this period.
                </div>
              )}
            </div>

            {/* Export Button */}
            <Button 
              onClick={exportSummaryCSV} 
              disabled={exportingCSV === 'summary'}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-2 focus:ring-emerald-500"
            >
              <Download className="h-4 w-4 mr-2" />
              {exportingCSV === 'summary' ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}