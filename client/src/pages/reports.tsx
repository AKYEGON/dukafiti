import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, DollarSign, CreditCard, AlertTriangle, TrendingUp, Users, Download, MessageCircle, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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
  const [exportingCSV, setExportingCSV] = useState<string | null>(null);
  const { toast } = useToast();

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

  // Upload CSV to server and get shareable URL
  const uploadCSVToServer = async (content: string, filename: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, content })
      });
      
      if (!response.ok) throw new Error('Failed to upload CSV');
      const { url } = await response.json();
      return `${window.location.origin}${url}`;
    } catch (error) {
      console.error('Failed to upload CSV:', error);
      toast({
        title: "Export Error",
        description: "Failed to upload CSV for sharing",
        variant: "destructive"
      });
      return null;
    }
  };

  // Share via WhatsApp
  const shareViaWhatsApp = (reportType: string, csvUrl: string) => {
    const message = `DukaSmart ${reportType} Report - ${new Date().toLocaleDateString()}\n\nDownload: ${csvUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Share via Email
  const shareViaEmail = (reportType: string, csvUrl: string) => {
    const subject = `Your DukaSmart ${reportType} Report`;
    const body = `Hi,\n\nPlease find your DukaSmart ${reportType} report for ${new Date().toLocaleDateString()}.\n\nDownload link: ${csvUrl}\n\nNote: This link will expire in 1 hour for security purposes.\n\nBest regards,\nDukaSmart Team`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl);
  };

  // Enhanced CSV Export Functions with sharing
  const exportAndShareCSV = async (type: 'summary' | 'top-items' | 'inventory', data: any[], headers: string[], filename: string): Promise<string | null> => {
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
    
    return await exportAndShareCSV('summary', data, ['Metric', 'Value'], 'summary.csv');
  };

  const exportTopItemsCSV = async (): Promise<string | null> => {
    if (!topItems) return null;
    return await exportAndShareCSV('top-items', topItems, ['Name', 'Units Sold', 'Revenue'], 'top_items.csv');
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

  // Share button component
  const ShareButtons = ({ onExport, type, disabled }: { onExport: () => Promise<string | null>, type: string, disabled?: boolean }) => {
    const [csvUrl, setCsvUrl] = useState<string | null>(null);
    const isExporting = exportingCSV === type;

    const handleExport = async () => {
      const url = await onExport();
      setCsvUrl(url);
    };

    const handleWhatsAppShare = () => {
      if (csvUrl) shareViaWhatsApp(type, csvUrl);
    };

    const handleEmailShare = () => {
      if (csvUrl) shareViaEmail(type, csvUrl);
    };

    return (
      <div className="flex items-center gap-2">
        <Button 
          onClick={handleExport} 
          variant="outline" 
          size="sm" 
          disabled={disabled || isExporting}
          className="bg-muted border-border text-foreground hover:bg-gray-700"
        >
          {isExporting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500 mr-2"></div>
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export {type}
        </Button>
        {csvUrl && (
          <>
            <Button 
              onClick={handleWhatsAppShare} 
              size="sm" 
              variant="ghost"
              className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
            <Button 
              onClick={handleEmailShare} 
              size="sm" 
              variant="ghost"
              className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
            >
              <Mail className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    );
  };

  if (summaryLoading) {
    return (
      <div className="p-6 bg-background text-foreground min-h-screen">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-background text-foreground min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-foreground">Reports</h1>
        <div className="flex flex-wrap gap-2">
          <ShareButtons onExport={exportSummaryCSV} type="Summary" disabled={!summaryData} />
          <ShareButtons onExport={exportInventoryCSV} type="Inventory" />
        </div>
      </div>

      {/* Summary Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Sales Today</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(summaryData?.totalSalesToday || "0")}
            </div>
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Sales This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(summaryData?.totalSalesWeek || "0")}
            </div>
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Sales This Month</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(summaryData?.totalSalesMonth || "0")}
            </div>
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Cash Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(summaryData?.paymentBreakdown.cash || "0")}
            </div>
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Credit Sales</CardTitle>
            <CreditCard className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(summaryData?.paymentBreakdown.credit || "0")}
            </div>
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {summaryData?.lowStockItems || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Sales Trend */}
        <Card className="">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-green-500">Hourly Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {hourlyLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={hourlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="hour" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value as string), 'Sales']} 
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '6px' }}
                    labelStyle={{ color: '#9CA3AF' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ fill: '#10B981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Customer Credit Ranking */}
        <Card className="">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-green-500">Customer Credit Ranking</CardTitle>
          </CardHeader>
          <CardContent>
            {creditsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {customerCredits?.slice(0, 10).map((customer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{customer.name}</p>
                        <p className="text-sm text-gray-400">{customer.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{formatCurrency(customer.balance)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Selling Items */}
      <Card className="">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-lg font-semibold text-green-500">Top Selling Items</CardTitle>
          <div className="flex gap-2">
            <Select value={selectedPeriod} onValueChange={(value: 'today' | 'week' | 'month') => setSelectedPeriod(value)}>
              <SelectTrigger className="w-32 bg-muted border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border">
                <SelectItem value="today" className="text-foreground hover:bg-gray-700">Today</SelectItem>
                <SelectItem value="week" className="text-foreground hover:bg-gray-700">This Week</SelectItem>
                <SelectItem value="month" className="text-foreground hover:bg-gray-700">This Month</SelectItem>
              </SelectContent>
            </Select>
            <ShareButtons onExport={exportTopItemsCSV} type="Top Items" disabled={!topItems || topItems.length === 0} />
          </div>
        </CardHeader>
        <CardContent>
          {topItemsLoading ? (
            <div className="h-32 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {topItems?.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-sm font-bold text-green-500">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-sm text-gray-400">{item.unitsSold} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{formatCurrency(item.revenue)}</p>
                  </div>
                </div>
              ))}
              {(!topItems || topItems.length === 0) && (
                <p className="text-center text-gray-400 py-8">No sales data available for this period</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}