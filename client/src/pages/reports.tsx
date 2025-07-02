import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Share2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { MobilePageWrapper } from '@/components/layout/mobile-page-wrapper';

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
  const [ordersSearchQuery, setOrdersSearchQuery] = useState('');
  const [ordersPage, setOrdersPage] = useState(1);
  const [debouncedOrdersQuery, setDebouncedOrdersQuery] = useState('');
  
  const [exportingCSV, setExportingCSV] = useState<string | null>(null);
  const { toast } = useToast();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedOrdersQuery(ordersSearchQuery);
      setOrdersPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [ordersSearchQuery]);

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

  // Fetch orders data
  const { data: ordersData, isLoading: ordersLoading, error: ordersError } = useQuery<OrdersResponse>({
    queryKey: ['/api/reports/orders', ordersPeriod, debouncedOrdersQuery, ordersPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        period: ordersPeriod,
        page: ordersPage.toString(),
        limit: '20'
      });
      
      if (debouncedOrdersQuery) {
        params.set('q', debouncedOrdersQuery);
      }
      
      const response = await fetch(`/api/reports/orders?${params}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    }
  });

  // Upload CSV to server and get shareable URL
  const uploadCSVToServer = async (csvContent: string, filename: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, content: csvContent })
      });
      
      if (!response.ok) throw new Error('Failed to upload CSV');
      
      const { url } = await response.json();
      return window.location.origin + url;
    } catch (error) {
      console.error('CSV upload error:', error);
      return null;
    }
  };

  // Share via WhatsApp
  const shareViaWhatsApp = (csvUrl: string, type: string) => {
    const message = `Check out this ${type} report from DukaSmart: ${csvUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Share via Email
  const shareViaEmail = (csvUrl: string, type: string) => {
    const subject = `DukaSmart ${type} Report`;
    const body = `Hi,\n\nPlease find attached the ${type} report from DukaSmart.\n\nReport Link: ${csvUrl}\n\nBest regards`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl);
  };

  // Enhanced CSV Export Functions
  const exportAndShareCSV = async (type: 'summary' | 'top-items' | 'inventory' | 'orders', data: any[], headers: string[], filename: string): Promise<string | null> => {
    setExportingCSV(type);
    try {
      const csv = convertToCSV(data, headers);
      
      // Download locally
      downloadCSV(csv, filename);
      
      // Upload for sharing
      const csvUrl = await uploadCSVToServer(csv, filename);
      
      if (csvUrl) {
        toast({
          title: "Export Successful",
          description: "CSV downloaded and ready for sharing",
        });
        return csvUrl;
      }
      return null;
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export CSV",
        variant: "destructive"
      });
      return null;
    } finally {
      setExportingCSV(null);
    }
  };

  const exportSummaryCSV = async (): Promise<string | null> => {
    if (!summaryData) return null;
    
    const data = [{
      metric: 'Total Sales',
      amount: summaryData.totalSales
    }, {
      metric: 'Cash Sales',
      amount: summaryData.cashSales
    }, {
      metric: 'Mobile Money Sales',
      amount: summaryData.mobileMoneySales
    }, {
      metric: 'Credit Sales',
      amount: summaryData.creditSales
    }];
    
    return await exportAndShareCSV('summary', data, ['Metric', 'Amount'], 'summary.csv');
  };

  const exportTopItemsCSV = async (): Promise<string | null> => {
    if (!topItemsData) return null;
    return await exportAndShareCSV('top-items', topItemsData, ['Name', 'Units Sold', 'Revenue'], 'top-items.csv');
  };

  const exportInventoryCSV = async (): Promise<string | null> => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch inventory');
      const products = await response.json();
      
      return await exportAndShareCSV('inventory', products, ['Name', 'SKU', 'Price', 'Stock', 'Category'], 'inventory.csv');
    } catch (error) {
      console.error('Failed to export inventory:', error);
      toast({
        title: "Export Failed",
        description: "Failed to fetch inventory data",
        variant: "destructive"
      });
      return null;
    }
  };

  const exportOrdersCSV = async (): Promise<string | null> => {
    if (!ordersData) return null;
    
    setExportingCSV('orders');
    try {
      const data = ordersData.orders.map(order => ({
        orderId: order.orderId,
        date: order.date,
        customerName: order.customerName,
        totalAmount: order.totalAmount,
        status: order.status,
        items: order.items.map(item => `${item.productName} x${item.qty}`).join('; ')
      }));
      
      const csv = convertToCSV(data, ['Order ID', 'Date', 'Customer Name', 'Total Amount', 'Status', 'Items']);
      
      // Download locally
      downloadCSV(csv, 'orders.csv');
      
      // Upload for sharing
      const csvUrl = await uploadCSVToServer(csv, 'orders.csv');
      
      if (csvUrl) {
        toast({
          title: "Export Successful",
          description: "CSV downloaded and ready for sharing",
        });
        return csvUrl;
      }
      return null;
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export orders CSV",
        variant: "destructive"
      });
      return null;
    } finally {
      setExportingCSV(null);
    }
  };

  // Share button component
  const ShareButtons = ({ onExport, type, disabled }: { onExport: () => Promise<string | null>, type: string, disabled?: boolean }) => {
    const [csvUrl, setCsvUrl] = useState<string | null>(null);
    const isExporting = exportingCSV === type;

    const handleExport = async () => {
      const url = await onExport();
      setCsvUrl(url);
    };

    return (
      <div className="flex items-center gap-2">
        <Button
          onClick={handleExport}
          disabled={disabled || isExporting}
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isExporting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Download className="h-4 w-4" />
          )}
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </Button>
        
        {csvUrl && (
          <div className="flex gap-1">
            <Button
              onClick={() => shareViaWhatsApp(csvUrl, type)}
              size="sm"
              variant="outline"
              className="text-green-600 border-green-600 hover:bg-green-50"
            >
              WhatsApp
            </Button>
            <Button
              onClick={() => shareViaEmail(csvUrl, type)}
              size="sm"
              variant="outline"
              className="text-green-600 border-green-600 hover:bg-green-50"
            >
              Email
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <MobilePageWrapper title="Reports">
      <div className="space-y-6">
        {/* Sticky Header with Timeframe Selector */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 z-10 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Summary Timeframe:
                </label>
                <Select value={summaryPeriod} onValueChange={(value: 'today' | 'weekly' | 'monthly') => setSummaryPeriod(value)}>
                  <SelectTrigger className="w-32 border-green-600 focus:ring-green-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="weekly">This Week</SelectItem>
                    <SelectItem value="monthly">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Graph View:
                </label>
                <Select value={trendPeriod} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setTrendPeriod(value)}>
                  <SelectTrigger className="w-28 border-green-600 focus:ring-green-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <ShareButtons onExport={exportSummaryCSV} type="summary" disabled={!summaryData} />
          </div>
        </div>

        {/* Unified Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-black border-gray-700 hover:scale-105 transition-transform">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-1">Total Sales</p>
                {summaryLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                ) : summaryError ? (
                  <p className="text-red-400 text-xs">Error loading</p>
                ) : (
                  <p className="text-2xl font-bold text-green-600">
                    KES {summaryData?.totalSales || '0.00'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black border-gray-700 hover:scale-105 transition-transform">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-1">Cash Sales</p>
                {summaryLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                ) : summaryError ? (
                  <p className="text-red-400 text-xs">Error loading</p>
                ) : (
                  <p className="text-2xl font-bold text-green-600">
                    KES {summaryData?.cashSales || '0.00'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black border-gray-700 hover:scale-105 transition-transform">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-1">Mobile Money</p>
                {summaryLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                ) : summaryError ? (
                  <p className="text-red-400 text-xs">Error loading</p>
                ) : (
                  <p className="text-2xl font-bold text-green-600">
                    KES {summaryData?.mobileMoneySales || '0.00'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black border-gray-700 hover:scale-105 transition-transform">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-1">Credit Sales</p>
                {summaryLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                ) : summaryError ? (
                  <p className="text-red-400 text-xs">Error loading</p>
                ) : (
                  <p className="text-2xl font-bold text-green-600">
                    KES {summaryData?.creditSales || '0.00'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales Trend Chart */}
        <Card className="bg-black border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {trendLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : trendError ? (
              <div className="text-center py-8">
                <p className="text-red-400 mb-4">No data for this period.</p>
              </div>
            ) : !trendData || trendData.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No data for this period.</p>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="label" 
                      stroke="#9CA3AF"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '6px',
                        color: '#F3F4F6'
                      }}
                      formatter={(value) => [`KES ${value}`, 'Sales']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#00AA00" 
                      strokeWidth={2}
                      dot={{ fill: '#00AA00', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#00AA00', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Selling Items */}
        <Card className="bg-black border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Top Selling Items</CardTitle>
            <ShareButtons onExport={exportTopItemsCSV} type="top-items" disabled={!topItemsData?.length} />
          </CardHeader>
          <CardContent>
            {topItemsLoading ? (
              <div className="h-32 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : !topItemsData || topItemsData.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No sales data available.</p>
            ) : (
              <div className="space-y-3">
                {topItemsData.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-white font-medium">{item.name}</p>
                        <p className="text-gray-400 text-sm">{item.unitsSold} units sold</p>
                      </div>
                    </div>
                    <p className="text-green-400 font-bold">KES {item.revenue}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Credits */}
        <Card className="bg-black border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Customer Credits</CardTitle>
          </CardHeader>
          <CardContent>
            {customerCreditsLoading ? (
              <div className="h-32 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : !customerCreditsData || customerCreditsData.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No customer credits.</p>
            ) : (
              <div className="space-y-3">
                {customerCreditsData.slice(0, 5).map((customer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{customer.name}</p>
                      <p className="text-gray-400 text-sm">{customer.phone}</p>
                    </div>
                    <p className="text-orange-400 font-bold">KES {customer.balance}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orders Record */}
        <Card className="bg-black border-gray-700">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-white">Orders Record</CardTitle>
              
              {/* Filters and Search Toolbar */}
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {/* Period Filter Pills */}
                <div className="flex bg-gray-800 rounded-lg p-1">
                  {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => {
                        setOrdersPeriod(period);
                        setOrdersPage(1);
                      }}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        ordersPeriod === period
                          ? 'bg-green-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </button>
                  ))}
                </div>
                
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={ordersSearchQuery}
                    onChange={(e) => setOrdersSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent bg-gray-800 text-gray-100 text-sm min-w-[200px]"
                  />
                </div>

                {/* Export Button */}
                <ShareButtons onExport={exportOrdersCSV} type="orders" disabled={!ordersData?.orders?.length} />
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {ordersLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : ordersError ? (
              <div className="text-center py-8">
                <p className="text-red-400 mb-4">Couldn't load orders. Retry.</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                  size="sm"
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  Retry
                </Button>
              </div>
            ) : !ordersData?.orders?.length ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No orders found for this period.</p>
              </div>
            ) : (
              <>
                {/* Orders List */}
                <div className="space-y-3 mb-6">
                  {ordersData.orders.map((order) => (
                    <div key={order.orderId} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-white">Order #{order.orderId}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              order.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : order.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-gray-400">Customer: <span className="text-white">{order.customerName}</span></p>
                              <p className="text-gray-400">Date: <span className="text-white">{order.date}</span></p>
                            </div>
                            <div>
                              <p className="text-gray-400">Total: <span className="text-green-400 font-bold">KES {order.totalAmount}</span></p>
                              {order.reference && (
                                <p className="text-gray-400">Ref: <span className="text-white">{order.reference}</span></p>
                              )}
                            </div>
                          </div>
                          
                          {/* Order Items */}
                          <div className="mt-3 pt-3 border-t border-gray-700">
                            <p className="text-gray-400 text-sm mb-2">Items:</p>
                            <div className="flex flex-wrap gap-2">
                              {order.items.map((item, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300"
                                >
                                  {item.productName} x{item.qty} @ KES {item.price}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {ordersData.totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">
                      Showing page {ordersData.page} of {ordersData.totalPages} ({ordersData.total} total orders)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setOrdersPage(prev => Math.max(1, prev - 1))}
                        disabled={ordersData.page <= 1}
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        onClick={() => setOrdersPage(prev => Math.min(ordersData.totalPages, prev + 1))}
                        disabled={ordersData.page >= ordersData.totalPages}
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </MobilePageWrapper>
  );
}