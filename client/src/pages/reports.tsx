import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, FileSpreadsheet } from 'lucide-react';
import download from 'downloadjs';
import { 
  getReportsSummary, 
  getReportsTrend, 
  getTopCustomers, 
  getTopProducts, 
  getOrdersData, 
  getCustomerCredits 
} from '@/lib/supabase-data';

// Import recharts components directly
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

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

interface OrdersResponse {
  orders: Array<{
    orderId: number;
    customerName: string;
    total: string;
    paymentMethod: string;
    date: string;
    products?: Array<{
      name: string;
      quantity: number;
    }>;
  }>;
  total: number;
  page: number;
  totalPages: number;
}

// Utility functions
const formatCurrency = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};

const convertToCSV = (data: any[], headers: string[], title?: string): string => {
  let csvContent = '';
  
  // Add title and metadata
  if (title) {
    csvContent += `"${title}"\n`;
    csvContent += `"Generated on: ${new Date().toLocaleDateString('en-KE', { 
      year: 'numeric', month: 'long', day: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    })}"\n`;
    csvContent += `"Total Records: ${data.length}"\n`;
    csvContent += '\n'; // Empty line
  }
  
  // Add headers
  const csvHeaders = headers.map(h => `"${h}"`).join(',');
  csvContent += csvHeaders + '\n';
  
  // Add data rows
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header] || '';
      // Format currency values properly
      if (typeof value === 'string' && value.includes('KES')) {
        return `"${value}"`;
      }
      // Handle numbers
      if (typeof value === 'number') {
        return value.toString();
      }
      // Handle dates
      if (value instanceof Date) {
        return `"${value.toLocaleDateString('en-KE')}"`;
      }
      return `"${value}"`;
    }).join(',')
  );
  
  csvContent += csvRows.join('\n');
  
  return csvContent;
};

const downloadCSV = (csvContent: string, filename: string): void => {
  // Add BOM for proper Excel UTF-8 handling
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function Reports() {
  // State for timeframe selectors
  const [summaryPeriod, setSummaryPeriod] = useState<'today' | 'weekly' | 'monthly'>('today');
  const [trendPeriod, setTrendPeriod] = useState<'hourly' | 'daily' | 'monthly'>('daily');
  
  // Orders Record state
  const [ordersPeriod, setOrdersPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [ordersPage, setOrdersPage] = useState(1);
  
  const [exportingCSV, setExportingCSV] = useState<string | null>(null);

  // Fetch summary data
  const { data: summaryData, isLoading: summaryLoading, error: summaryError } = useQuery<SummaryData>({
    queryKey: ['reports-summary', summaryPeriod],
    queryFn: () => getReportsSummary(summaryPeriod)
  });

  // Fetch trend data
  const { data: trendData, isLoading: trendLoading, error: trendError } = useQuery<TrendData[]>({
    queryKey: ['reports-trend', trendPeriod],
    queryFn: () => getReportsTrend(trendPeriod),
    staleTime: 0, // Always refetch
    refetchOnMount: 'always'
  });

  // Debug trend data
  console.log('Trend Data Debug:', {
    trendData,
    isLoading: trendLoading,
    error: trendError,
    period: trendPeriod,
    dataLength: trendData?.length,
    sampleData: trendData?.[0],
    isArray: Array.isArray(trendData),
    hasData: trendData && Array.isArray(trendData) && trendData.length > 0
  });
  


  // Fetch customer credits data
  const { data: customerCreditsData, isLoading: customerCreditsLoading } = useQuery<CustomerCredit[]>({
    queryKey: ['customer-credits'],
    queryFn: () => getCustomerCredits()
  });

  // Fetch top customers data
  const { data: topCustomersData, isLoading: topCustomersLoading } = useQuery<TopCustomer[]>({
    queryKey: ['top-customers', summaryPeriod],
    queryFn: () => getTopCustomers(summaryPeriod)
  });

  // Fetch top products data
  const { data: topProductsData, isLoading: topProductsLoading } = useQuery<TopProduct[]>({
    queryKey: ['top-products', summaryPeriod],
    queryFn: () => getTopProducts(summaryPeriod)
  });

  // Fetch orders data
  const { data: ordersData, isLoading: ordersLoading, error: ordersError } = useQuery<OrdersResponse>({
    queryKey: ['orders-data', ordersPeriod, ordersPage],
    queryFn: () => getOrdersData(ordersPeriod, ordersPage, 10)
  });

  // Enhanced CSV Export Functions
  const exportSummaryCSV = async () => {
    if (!summaryData) return;
    
    setExportingCSV('summary');
    try {
      const reportTitle = `DukaFiti Business Summary Report - ${summaryPeriod.charAt(0).toUpperCase() + summaryPeriod.slice(1)}`;
      
      const csvData = [
        { 
          'Sales Type': 'Total Sales', 
          'Amount (KES)': summaryData.totalSales,
          'Percentage': '100%',
          'Period': summaryPeriod.charAt(0).toUpperCase() + summaryPeriod.slice(1),
          'Generated Date': new Date().toLocaleDateString('en-KE')
        },
        { 
          'Sales Type': 'Cash Sales', 
          'Amount (KES)': summaryData.cashSales,
          'Percentage': `${Math.round((parseFloat(summaryData.cashSales) / parseFloat(summaryData.totalSales)) * 100)}%`,
          'Period': summaryPeriod.charAt(0).toUpperCase() + summaryPeriod.slice(1),
          'Generated Date': new Date().toLocaleDateString('en-KE')
        },
        { 
          'Sales Type': 'Mobile Money Sales', 
          'Amount (KES)': summaryData.mobileMoneySales,
          'Percentage': `${Math.round((parseFloat(summaryData.mobileMoneySales) / parseFloat(summaryData.totalSales)) * 100)}%`,
          'Period': summaryPeriod.charAt(0).toUpperCase() + summaryPeriod.slice(1),
          'Generated Date': new Date().toLocaleDateString('en-KE')
        },
        { 
          'Sales Type': 'Credit Sales', 
          'Amount (KES)': summaryData.creditSales,
          'Percentage': `${Math.round((parseFloat(summaryData.creditSales) / parseFloat(summaryData.totalSales)) * 100)}%`,
          'Period': summaryPeriod.charAt(0).toUpperCase() + summaryPeriod.slice(1),
          'Generated Date': new Date().toLocaleDateString('en-KE')
        }
      ];
      
      const csv = convertToCSV(
        csvData, 
        ['Sales Type', 'Amount (KES)', 'Percentage', 'Period', 'Generated Date'],
        reportTitle
      );
      downloadCSV(csv, `DukaFiti-Sales-Summary-${summaryPeriod}-${new Date().toISOString().split('T')[0]}.csv`);
    } finally {
      setExportingCSV(null);
    }
  };

  // Comprehensive Business Report Export
  const exportDetailedCSV = async () => {
    setExportingCSV('detailed');
    try {
      const reportTitle = `DukaFiti Comprehensive Business Report - ${summaryPeriod.charAt(0).toUpperCase() + summaryPeriod.slice(1)}`;
      
      // Create comprehensive business report with multiple sections
      let csvContent = '';
      
      // Add business report header
      csvContent += `"${reportTitle}"\n`;
      csvContent += `"Generated on: ${new Date().toLocaleString('en-KE')}"\n`;
      csvContent += `"Report Period: ${summaryPeriod.charAt(0).toUpperCase() + summaryPeriod.slice(1)}"\n`;
      csvContent += `"Business: DukaFiti POS System"\n`;
      csvContent += '\n';
      
      // Section 1: Sales Summary
      csvContent += '"=== SALES SUMMARY ==="\n';
      if (summaryData) {
        csvContent += '"Sales Type","Amount (KES)","Percentage"\n';
        const total = parseFloat(summaryData.totalSales);
        csvContent += `"Total Sales","${summaryData.totalSales}","100%"\n`;
        csvContent += `"Cash Sales","${summaryData.cashSales}","${Math.round((parseFloat(summaryData.cashSales) / total) * 100)}%"\n`;
        csvContent += `"Mobile Money Sales","${summaryData.mobileMoneySales}","${Math.round((parseFloat(summaryData.mobileMoneySales) / total) * 100)}%"\n`;
        csvContent += `"Credit Sales","${summaryData.creditSales}","${Math.round((parseFloat(summaryData.creditSales) / total) * 100)}%"\n`;
      }
      csvContent += '\n';
      
      // Section 2: Top Products
      csvContent += '"=== TOP-SELLING PRODUCTS ==="\n';
      if (topProductsData && topProductsData.length > 0) {
        csvContent += '"Product Name","Units Sold","Total Revenue (KES)"\n';
        topProductsData.forEach(product => {
          csvContent += `"${product.productName}","${product.unitsSold}","${product.totalRevenue}"\n`;
        });
      } else {
        csvContent += '"No product sales data available for this period"\n';
      }
      csvContent += '\n';
      
      // Section 3: Top Customers (Credit)
      csvContent += '"=== TOP CUSTOMERS WITH CREDIT ==="\n';
      if (topCustomersData && topCustomersData.length > 0) {
        csvContent += '"Customer Name","Total Owed (KES)","Outstanding Orders"\n';
        topCustomersData.forEach(customer => {
          csvContent += `"${customer.customerName}","${customer.totalOwed}","${customer.outstandingOrders}"\n`;
        });
      } else {
        csvContent += '"No customers with outstanding credit for this period"\n';
      }
      csvContent += '\n';
      
      // Section 4: Recent Orders
      csvContent += '"=== RECENT ORDERS ==="\n';
      if (ordersData && ordersData.orders && ordersData.orders.length > 0) {
        csvContent += '"Order ID","Customer","Amount (KES)","Payment Method","Status","Date"\n';
        ordersData.orders.forEach(order => {
          csvContent += `"#ORD-${order.orderId.toString().padStart(3, '0')}","${order.customerName || 'N/A'}","${order.total}","${order.paymentMethod}","Completed","${order.date}"\n`;
        });
      } else {
        csvContent += '"No recent orders data available"\n';
      }
      csvContent += '\n';
      
      // Section 5: Sales Trend Data
      csvContent += '"=== SALES TREND DATA ==="\n';
      if (trendData && Array.isArray(trendData) && trendData.length > 0) {
        csvContent += '"Period","Sales Amount (KES)"\n';
        trendData.forEach(trend => {
          csvContent += `"${trend.label}","${trend.value}"\n`;
        });
      } else {
        csvContent += '"No trend data available for this period"\n';
      }
      
      // Download the comprehensive report
      downloadCSV(csvContent, `DukaFiti-Comprehensive-Report-${summaryPeriod}-${new Date().toISOString().split('T')[0]}.csv`);
      
    } catch (error) {
      
    } finally {
      setExportingCSV(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 py-6 lg:py-12">
        <div className="space-y-6 sm:space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">Reports</h1>
            <p className="text-neutral-600 dark:text-neutral-400">View your business analytics and performance</p>
          </div>

          {/* Responsive Layout */}
          <div className="space-y-6 sm:space-y-8">
            
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
            <div className="bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
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
            <div className="bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
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
            <div className="bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
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
            <div className="bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
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
          <div className="bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Sales Trend</h3>
              <Select value={trendPeriod} onValueChange={(value: 'hourly' | 'daily' | 'monthly') => setTrendPeriod(value)}>
                <SelectTrigger className="w-32 bg-gray-50 dark:bg-gray-800 border rounded px-3 py-2 focus:ring-2 focus:ring-emerald-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {trendLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : trendError ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <p>Error loading trend data: {trendError.message}</p>
                </div>
              </div>
            ) : trendData && Array.isArray(trendData) && trendData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
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
                      tickFormatter={(value) => `${value.toLocaleString()}`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                      formatter={(value: number) => [`KES ${value.toLocaleString()}`, 'Sales']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#00AA00" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 8, fill: '#00AA00', strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <p>No data available for this period.</p>
                  <p className="text-xs mt-2">Debug: {JSON.stringify(trendData).substring(0, 100)}</p>
                  <p className="text-xs">Period: {trendPeriod} | Loading: {trendLoading.toString()}</p>
                </div>
              </div>
            )}
          </div>

          {/* Top Customers Card */}
          <div className="bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
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

          {/* Top-Selling Products Card */}
          <div className="bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
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

          {/* Orders Record */}
          <div className="bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Orders Record</h3>
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
                        <th className="px-3 py-2 text-left">Products</th>
                        <th className="px-3 py-2 text-right">Amount</th>
                        <th className="px-3 py-2 text-left">Payment</th>
                        <th className="px-3 py-2 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordersData.orders.map((order) => (
                        <tr key={order.orderId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                          <td className="px-3 py-3 font-medium text-gray-900 dark:text-gray-100">#{order.orderId}</td>
                          <td className="px-3 py-3 text-gray-700 dark:text-gray-300">{order.customerName}</td>
                          <td className="px-3 py-3 text-gray-700 dark:text-gray-300">
                            {order.products && order.products.length > 0 
                              ? order.products.map(p => `${p.name} x${p.quantity}`).join(', ')
                              : 'No products'
                            }
                          </td>
                          <td className="px-3 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(order.total)}
                          </td>
                          <td className="px-3 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              order.paymentMethod === 'cash'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : order.paymentMethod === 'mobileMoney'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                            }`}>
                              {order.paymentMethod === 'cash' ? 'Cash' :
                               order.paymentMethod === 'mobileMoney' ? 'Mobile Money' : 'Credit'}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-gray-500 dark:text-gray-400 text-sm">{order.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {ordersData.orders.map((order) => (
                    <div key={order.orderId} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Order #{order.orderId}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{order.customerName}</p>
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(order.total)}</p>
                      </div>
                      <div className="mb-2">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Products: </span>
                          {order.products && order.products.length > 0 
                            ? order.products.map(p => `${p.name} x${p.quantity}`).join(', ')
                            : 'No products'
                          }
                        </p>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          order.paymentMethod === 'cash'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : order.paymentMethod === 'mobileMoney'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                        }`}>
                          {order.paymentMethod === 'cash' ? 'Cash' :
                           order.paymentMethod === 'mobileMoney' ? 'Mobile Money' : 'Credit'}
                        </span>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{order.date}</p>
                      </div>
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

          {/* Export CSV Buttons */}
          <div className="space-y-3">
            <Button
              onClick={exportSummaryCSV}
              disabled={exportingCSV === 'summary'}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-2 focus:ring-emerald-500"
            >
              <Download className="h-4 w-4 mr-2" />
              {exportingCSV === 'summary' ? 'Exporting...' : 'Export Summary CSV'}
            </Button>
            
            <Button
              onClick={exportDetailedCSV}
              disabled={exportingCSV === 'detailed'}
              className="w-full bg-accent hover:bg-purple-700 text-white focus:ring-2 focus:ring-accent-500"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              {exportingCSV === 'detailed' ? 'Exporting...' : 'Export Detailed CSV'}
            </Button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}