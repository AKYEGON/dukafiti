import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, FileSpreadsheet } from 'lucide-react';
import download from 'downloadjs';

// Direct import recharts components for better reliability;
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Types
interface SummaryData {
  totalSales: string
  cashSales: string
  mobileMoneySales: string
  creditSales: string
}

interface TrendData {
  label: string
  value: number
}

interface TopCustomer {
  customerName: string
  totalOwed: string
  outstandingOrders: number
}

interface TopProduct {
  productName: string
  unitsSold: number
  totalRevenue: string
}

interface TopItem {
  name: string
  unitsSold: number
  revenue: string
}

interface CustomerCredit {
  name: string
  phone: string
  balance: string
}

interface OrderRecord {
  orderId: number
  customerName: string
  total: string
  paymentMethod: string
  date: string
  products?: Array<{
    name: string
    quantity: number
  }>;
}

interface OrdersResponse {
  orders: OrderRecord[]
  total: number
  page: number
  totalPages: number
}

// Utility functions;
const formatCurrency  =  (amount: string | number): string  = > {;
  const num  =  typeof amount  ===  'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(num);
};
;
const convertToCSV  =  (data: any[], headers: string[]): string  = > {;
  const csvHeaders  =  headers.join(',');
  const csvRows  =  data.map(row  = >
    headers.map(header  = > `"${row[header] || ''}"`).join(',')
  );
  return [csvHeaders, ...csvRows].join('\n');
};
;
const downloadCSV  =  (csvContent: string, filename: string): void  = > {;
  const blob  =  new Blob([csvContent], { type: 'text/csv;charset  =  utf-8;' });
  const link  =  document.createElement('a');
  const url  =  URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility  =  'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
;
export default function Reports() {
  // State for timeframe selectors;
  const [summaryPeriod, setSummaryPeriod]  =  useState<'today' | 'weekly' | 'monthly'>('today');
  const [trendPeriod, setTrendPeriod]  =  useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [ordersPeriod, setOrdersPeriod]  =  useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [ordersPage, setOrdersPage]  =  useState(1);
  const [exportingCSV, setExportingCSV]  =  useState<string | null>(null);

  // Fetch summary data;
  const { data: rawSummaryData, isLoading: summaryLoading, error: summaryError }  =  useQuery({
    queryKey: ['/api/reports/summary', summaryPeriod],
    queryFn: async ()  = > {;
      const response  =  await fetch(`/api/reports/summary?period = ${summaryPeriod}`);
      if (!response.ok) throw new Error('Failed to fetch summary');
      return response.json();
    }
  });

  // Transform backend data format to frontend format;
  const summaryData: SummaryData | undefined  =  rawSummaryData ? {
    totalSales: rawSummaryData.totalRevenue || '0',
    cashSales: rawSummaryData.paymentBreakdown?.cash || '0',
    mobileMoneySales: rawSummaryData.paymentBreakdown?.mobileMoney || '0',
    creditSales: rawSummaryData.paymentBreakdown?.credit || '0'
  } : undefined

  // Fetch trend data;
  const { data: rawTrendData, isLoading: trendLoading, error: trendError }  =  useQuery({
    queryKey: ['/api/reports/trend', trendPeriod],
    queryFn: async ()  = > {;
      const response  =  await fetch(`/api/reports/trend?period = ${trendPeriod}`);
      if (!response.ok) throw new Error('Failed to fetch trend');
      return response.json();
    }
  });

  // Transform trend data format;
  const trendData: TrendData[] | undefined  =  rawTrendData?.map((item: any)  = > ({
    label: item.date || item.label,
    value: item.value || 0
  }));

  // Fetch top products data;
  const { data: topProductsData, isLoading: topProductsLoading }  =  useQuery<TopProduct[]>({
    queryKey: ['/api/reports/top-products'],
    queryFn: async ()  = > {;
      const response  =  await fetch('/api/reports/top-products');
      if (!response.ok) throw new Error('Failed to fetch top products');
      return response.json();
    }
  });

  // Transform top products to top items format;
  const topItemsData: TopItem[] | undefined  =  topProductsData?.map(product  = > ({
    name: product.productName,
    unitsSold: product.unitsSold,
    revenue: product.totalRevenue
  }));

  // Fetch customer credits data;
  const { data: topCustomersData, isLoading: customerCreditsLoading }  =  useQuery<TopCustomer[]>({
    queryKey: ['/api/reports/top-customers'],
    queryFn: async ()  = > {;
      const response  =  await fetch('/api/reports/top-customers');
      if (!response.ok) throw new Error('Failed to fetch top customers');
      return response.json();
    }
  });

  // Transform top customers to customer credits format;
  const customerCreditsData: CustomerCredit[] | undefined  =  topCustomersData?.map(customer  = > ({
    name: customer.customerName,
    phone: '', // Not available in current data
    balance: customer.totalOwed
  }));

  // Fetch orders data;
  const { data: rawOrdersData, isLoading: ordersLoading, error: ordersError }  =  useQuery({
    queryKey: ['/api/reports/orders', ordersPeriod, ordersPage],
    queryFn: async ()  = > {;
      const params  =  new URLSearchParams({
        period: ordersPeriod,
        page: ordersPage.toString(),
        limit: '10'
      });
      const response  =  await fetch(`/api/reports/orders?${params}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    }
  });

  // Transform orders data to handle date formatting;
  const ordersData: OrdersResponse | undefined  =  rawOrdersData ? {
    orders: rawOrdersData.orders?.map((order: any)  = > ({
      orderId: order.id,
      customerName: order.customerName,
      total: order.total?.toString() || '0',
      paymentMethod: order.paymentMethod,
      date: order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) : 'No date',
      products: order.products || []
    })) || [],
    total: rawOrdersData.total || 0,
    page: rawOrdersData.page || 1,
    totalPages: rawOrdersData.totalPages || 1
  } : undefined

  // CSV Export Functions;
  const exportSummaryCSV  =  async ()  = > {;
    if (!summaryData) return;

    setExportingCSV('summary');
    try {;
      const csvData  =  [
        { type: 'Total Sales', amount: summaryData.totalSales },
        { type: 'Cash Sales', amount: summaryData.cashSales },
        { type: 'Mobile Money Sales', amount: summaryData.mobileMoneySales },
        { type: 'Credit Sales', amount: summaryData.creditSales }
      ];
;
      const csv  =  convertToCSV(csvData, ['type', 'amount']);
      downloadCSV(csv, `sales-summary-${summaryPeriod}-${new Date().toISOString().split('T')[0]}.csv`);
    } finally {
      setExportingCSV(null);
    }
  };

  // Detailed CSV Export with full order and line item data;
  const exportDetailedCSV  =  async ()  = > {
    setExportingCSV('detailed');
    try {;
      const response  =  await fetch(`/api/reports/export?period = ${summaryPeriod}`, {
        method: 'GET'
      });
;
      if (!response.ok) {;
        throw new Error('Failed to export detailed CSV');
      };

      const csvContent  =  await response.text();
      const filename  =  `orders-detailed-${summaryPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(csvContent, filename);
    } catch (error) {
      console.error('CSV export failed:', error);
    } finally {
      setExportingCSV(null);
    }
  };
;
  return (
    <div className = "container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className = "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className = "text-2xl font-bold text-neutral-900 dark:text-neutral-100">Sales Reports</h1>

        <div className = "flex flex-col sm:flex-row gap-2">
          <Button
            onClick = {exportSummaryCSV}
            disabled = {!summaryData || exportingCSV  ===  'summary'}
            variant = "outline"
            size = "sm"
            className = "flex items-center gap-2"
          >
            <FileSpreadsheet className = "h-4 w-4" />
            {exportingCSV  ===  'summary' ? 'Exporting...' : 'Export Summary'}
          </Button>

          <Button
            onClick = {exportDetailedCSV}
            disabled = {exportingCSV  ===  'detailed'}
            size = "sm"
            className = "flex items-center gap-2"
          >
            <Download className = "h-4 w-4" />
            {exportingCSV  ===  'detailed' ? 'Exporting...' : 'Export Detailed'}
          </Button>
        </div>
      </div>

      {/* Summary Timeframe Selector */}
      <div className = "flex items-center gap-4">
        <label className = "text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Timeframe:
        </label>
        <Select value = {summaryPeriod} onValueChange = {(value: 'today' | 'weekly' | 'monthly')  = > setSummaryPeriod(value)}>
          <SelectTrigger className = "w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value = "today">Today</SelectItem>
            <SelectItem value = "weekly">This Week</SelectItem>
            <SelectItem value = "monthly">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryLoading ? (
          // Loading skeletons
          [...Array(4)].map((_, i)  = > (
            <div key = {i} className = "bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
              <Skeleton className = "h-4 w-20 mb-2" />
              <Skeleton className = "h-8 w-24" />
            </div>
          ))
        ) : summaryError ? (
          <div className = "col-span-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className = "text-red-700 dark:text-red-400">Failed to load summary data</p>
          </div>
        ) : (
          <>
            {/* Total Sales Card */}
            <div className = "bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
              <h3 className = "text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">Total Sales</h3>
              <p className = "text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {summaryData ? formatCurrency(summaryData.totalSales) : 'Ksh 0'}
              </p>
            </div>

            {/* Cash Sales Card */}
            <div className = "bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
              <h3 className = "text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">Cash</h3>
              <p className = "text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {summaryData ? formatCurrency(summaryData.cashSales) : 'Ksh 0'}
              </p>
            </div>

            {/* Mobile Money Card */}
            <div className = "bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
              <h3 className = "text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">Mobile Money</h3>
              <p className = "text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {summaryData ? formatCurrency(summaryData.mobileMoneySales) : 'Ksh 0'}
              </p>
            </div>

            {/* Credit Sales Card */}
            <div className = "bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
              <h3 className = "text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">Credit</h3>
              <p className = "text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {summaryData ? formatCurrency(summaryData.creditSales) : 'Ksh 0'}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Sales Trend Chart */}
      <div className = "bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
        <div className = "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h3 className = "text-lg font-semibold text-neutral-900 dark:text-neutral-100">Sales Trend</h3>
          <Select value = {trendPeriod} onValueChange = {(value: 'daily' | 'weekly' | 'monthly')  = > setTrendPeriod(value)}>
            <SelectTrigger className = "w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value = "daily">Daily</SelectItem>
              <SelectItem value = "weekly">Weekly</SelectItem>
              <SelectItem value = "monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className = "h-64">
          {trendLoading ? (
            <div className = "h-full flex items-center justify-center">
              <Skeleton className = "h-full w-full" />
            </div>
          ) : trendData && trendData.length > 0 ? (
            <ResponsiveContainer width = "100%" height = "100%">
              <LineChart data = {trendData}>
                <CartesianGrid strokeDasharray = "3 3" stroke = "#E5E7EB" className = "dark:stroke-[#374151]" />
                <XAxis
                  dataKey = "label"
                  stroke = "#6B7280"
                  fontSize = {12}
                  className = "dark:stroke-[#9CA3AF]"
                />
                <YAxis
                  stroke = "#6B7280"
                  fontSize = {12}
                  className = "dark:stroke-[#9CA3AF]"
                />
                <Tooltip
                  contentStyle = {{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line
                  type = "monotone"
                  dataKey = "value"
                  stroke = "#00AA00"
                  strokeWidth = {3}
                  dot = {{ fill: '#00AA00', strokeWidth: 2 }}
                  className = "dark:stroke-[#6B46C1]"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className = "h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              No data available for this period.
            </div>
          )}
        </div>
      </div>

      {/* Two column layout for Top Customers and Top Products */}
      <div className = "space-y-6">
        {/* Top Customers Card */}
        <div className = "bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <h3 className = "text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Top Customers (Credit)</h3>
          {customerCreditsLoading ? (
            <div className = "space-y-3">
              {[...Array(5)].map((_, i)  = > (
                <div key = {i} className = "flex justify-between items-center">
                  <div className = "space-y-1">
                    <Skeleton className = "h-4 w-24" />
                    <Skeleton className = "h-3 w-16" />
                  </div>
                  <Skeleton className = "h-4 w-16" />
                </div>
              ))}
            </div>
          ) : customerCreditsData && customerCreditsData.length > 0 ? (
            <div className = "space-y-3">
              {customerCreditsData.slice(0, 5).map((customer, index)  = > (
                <div key = {index} className = "flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className = "font-medium text-neutral-900 dark:text-neutral-100">{customer.name}</p>
                    {customer.phone && <p className = "text-sm text-neutral-600 dark:text-neutral-400">{customer.phone}</p>}
                  </div>
                  <p className = "font-semibold text-red-600 dark:text-red-400">{formatCurrency(customer.balance)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className = "text-neutral-600 dark:text-neutral-400">No customer credit data available.</p>
          )}
        </div>

        {/* Top Selling Products Card */}
        <div className = "bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <h3 className = "text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Top Selling Products</h3>
          {topProductsLoading ? (
            <div className = "space-y-3">
              {[...Array(5)].map((_, i)  = > (
                <div key = {i} className = "flex justify-between items-center">
                  <div className = "space-y-1">
                    <Skeleton className = "h-4 w-24" />
                    <Skeleton className = "h-3 w-16" />
                  </div>
                  <Skeleton className = "h-4 w-16" />
                </div>
              ))}
            </div>
          ) : topItemsData && topItemsData.length > 0 ? (
            <div className = "space-y-3">
              {topItemsData.slice(0, 5).map((item, index)  = > (
                <div key = {index} className = "flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className = "font-medium text-neutral-900 dark:text-neutral-100">{item.name}</p>
                    <p className = "text-sm text-neutral-600 dark:text-neutral-400">{item.unitsSold} units sold</p>
                  </div>
                  <p className = "font-semibold text-green-600 dark:text-green-400">{formatCurrency(item.revenue)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className = "text-neutral-600 dark:text-neutral-400">No sales data available.</p>
          )}
        </div>
      </div>

      {/* Orders Record */}
      <div className = "bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
        <div className = "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h3 className = "text-lg font-semibold text-neutral-900 dark:text-neutral-100">Orders Record</h3>
          <Select value = {ordersPeriod} onValueChange = {(value: 'daily' | 'weekly' | 'monthly')  = > setOrdersPeriod(value)}>
            <SelectTrigger className = "w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value = "daily">Daily</SelectItem>
              <SelectItem value = "weekly">Weekly</SelectItem>
              <SelectItem value = "monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {ordersLoading ? (
          <div className = "space-y-3">
            {[...Array(5)].map((_, i)  = > (
              <div key = {i} className = "p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className = "flex justify-between items-center">
                  <Skeleton className = "h-4 w-24" />
                  <Skeleton className = "h-4 w-16" />
                </div>
                <Skeleton className = "h-3 w-32 mt-2" />
              </div>
            ))}
          </div>
        ) : ordersError ? (
          <div className = "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className = "text-red-700 dark:text-red-400">Failed to load orders data</p>
          </div>
        ) : ordersData && ordersData.orders.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className = "hidden md:block overflow-x-auto">
              <table className = "w-full">
                <thead>
                  <tr className = "border-b border-gray-200 dark:border-gray-700">
                    <th className = "text-left p-3 text-sm font-medium text-neutral-600 dark:text-neutral-400">Order ID</th>
                    <th className = "text-left p-3 text-sm font-medium text-neutral-600 dark:text-neutral-400">Customer</th>
                    <th className = "text-left p-3 text-sm font-medium text-neutral-600 dark:text-neutral-400">Products</th>
                    <th className = "text-left p-3 text-sm font-medium text-neutral-600 dark:text-neutral-400">Amount</th>
                    <th className = "text-left p-3 text-sm font-medium text-neutral-600 dark:text-neutral-400">Payment</th>
                    <th className = "text-left p-3 text-sm font-medium text-neutral-600 dark:text-neutral-400">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersData.orders.map((order)  = > (
                    <tr key = {order.orderId} className = "border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className = "p-3 text-sm text-neutral-900 dark:text-neutral-100">#{order.orderId}</td>
                      <td className = "p-3 text-sm text-neutral-900 dark:text-neutral-100">{order.customerName}</td>
                      <td className = "p-3 text-sm text-neutral-600 dark:text-neutral-400">
                        {order.products && order.products.length > 0
                          ? order.products.map(p  = > p.name).join(', ')
                          : 'No products'
                        }
                      </td>
                      <td className = "p-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">{formatCurrency(order.total)}</td>
                      <td className = "p-3">
                        <span className = {`px-2 py-1 rounded-full text-xs font-medium ${
                          order.paymentMethod  ===  'cash'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : order.paymentMethod  ===  'credit'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                        }`}>
                          {order.paymentMethod  ===  'mobileMoney' ? 'Mobile Money' :
                           order.paymentMethod  ===  'mobile_money' ? 'Mobile Money' :
                           order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1)}
                        </span>
                      </td>
                      <td className = "p-3 text-sm text-neutral-600 dark:text-neutral-400">{order.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className = "md:hidden space-y-3">
              {ordersData.orders.map((order)  = > (
                <div key = {order.orderId} className = "p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className = "flex justify-between items-start mb-2">
                    <div>
                      <p className = "font-medium text-neutral-900 dark:text-neutral-100">#{order.orderId}</p>
                      <p className = "text-sm text-neutral-600 dark:text-neutral-400">{order.customerName}</p>
                    </div>
                    <p className = "font-semibold text-neutral-900 dark:text-neutral-100">{formatCurrency(order.total)}</p>
                  </div>
                  <div className = "flex justify-between items-center text-sm">
                    <span className = {`px-2 py-1 rounded-full text-xs font-medium ${
                      order.paymentMethod  ===  'cash'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : order.paymentMethod  ===  'credit'
                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                    }`}>
                      {order.paymentMethod  ===  'mobileMoney' ? 'Mobile Money' :
                       order.paymentMethod  ===  'mobile_money' ? 'Mobile Money' :
                       order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1)}
                    </span>
                    <span className = "text-neutral-600 dark:text-neutral-400">{order.date}</span>
                  </div>
                  {order.products && order.products.length > 0 && (
                    <p className = "text-xs text-neutral-500 dark:text-neutral-500 mt-2">
                      {order.products.map(p  = > `${p.name} (${p.quantity})`).join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {ordersData.totalPages > 1 && (
              <div className = "flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className = "text-sm text-neutral-600 dark:text-neutral-400">
                  Page {ordersData.page} of {ordersData.totalPages}
                </p>
                <div className = "flex gap-2">
                  <Button
                    variant = "outline"
                    size = "sm"
                    onClick = {()  = > setOrdersPage(prev  = > Math.max(1, prev - 1))}
                    disabled = {ordersData.page <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant = "outline"
                    size = "sm"
                    onClick = {()  = > setOrdersPage(prev  = > Math.min(ordersData.totalPages, prev + 1))}
                    disabled = {ordersData.page >= ordersData.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className = "text-neutral-600 dark:text-neutral-400">No orders found for this period.</p>
        )}
      </div>
    </div>
  );
}