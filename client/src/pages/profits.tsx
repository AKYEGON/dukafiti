import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Download, BarChart3, PieChart, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { getProfitData, getDailyProfitTrend, ProductProfit } from '@/lib/profit-data';
import { MobilePageWrapper } from '@/components/layout/mobile-page-wrapper';
import { toast } from '@/hooks/use-toast';

type ProfitPeriod = 'daily' | 'weekly' | 'monthly';

export default function Profits() {
  const [selectedPeriod, setSelectedPeriod] = useState<ProfitPeriod>('daily');

  // Fetch profit data
  const { data: profitData, isLoading: profitLoading, error: profitError } = useQuery({
    queryKey: ['profit-data', selectedPeriod],
    queryFn: () => getProfitData(selectedPeriod),
    staleTime: 30000, // 30 seconds
    refetchOnMount: 'always'
  });

  // Fetch trend data for chart
  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['profit-trend', selectedPeriod],
    queryFn: () => getDailyProfitTrend(selectedPeriod === 'daily' ? 7 : selectedPeriod === 'weekly' ? 14 : 30),
    staleTime: 30000
  });

  const handleExportCSV = () => {
    if (!profitData) return;

    const csvContent = [
      ['Profit Report', `Period: ${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}`, `Generated: ${new Date().toLocaleString()}`],
      [],
      ['Summary'],
      ['Total Profit (KES)', profitData.totalProfit.toFixed(2)],
      ['Margin %', profitData.marginPercent.toFixed(1)],
      [],
      ['Product Performance'],
      ['Product Name', 'Quantity Sold', 'Total Profit (KES)', 'Margin %', 'Avg Selling Price', 'Avg Cost Price'],
      ...profitData.byProduct.map(p => [
        p.productName,
        p.quantitySold.toString(),
        p.totalProfit.toFixed(2),
        p.marginPercent.toFixed(1),
        p.averageSellingPrice.toFixed(2),
        p.averageCostPrice.toFixed(2)
      ]),
      [],
      ['Category Performance'],
      ['Category', 'Quantity Sold', 'Total Profit (KES)', 'Margin %'],
      ...profitData.byCategory.map(c => [
        c.category,
        c.quantitySold.toString(),
        c.totalProfit.toFixed(2),
        c.marginPercent.toFixed(1)
      ])
    ];

    const csvString = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `profit-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Report Exported",
      description: `Profit report for ${selectedPeriod} period downloaded successfully.`,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (profitError) {
    return (
      <MobilePageWrapper title="Profits" showBackButton={false}>
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="pt-6">
            <p className="text-red-600 dark:text-red-400">
              Error loading profit data. Please try again.
            </p>
          </CardContent>
        </Card>
      </MobilePageWrapper>
    );
  }

  return (
    <MobilePageWrapper title="Profits" showBackButton={false}>
      <div className="space-y-6">
        {/* Period Selector and Export */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <Select value={selectedPeriod} onValueChange={(value: ProfitPeriod) => setSelectedPeriod(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Today</SelectItem>
                <SelectItem value="weekly">7 Days</SelectItem>
                <SelectItem value="monthly">30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={handleExportCSV} 
            variant="outline" 
            size="sm"
            disabled={!profitData}
            className="w-full sm:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {profitLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(profitData?.totalProfit || 0)}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {selectedPeriod === 'daily' ? 'Today' : 
                 selectedPeriod === 'weekly' ? 'Past 7 days' : 'Past 30 days'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Margin %</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {profitLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-blue-600">
                  {(profitData?.marginPercent || 0).toFixed(1)}%
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Average profit margin
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Categories</CardTitle>
              <PieChart className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              {profitLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-purple-600">
                  {profitData?.byCategory.length || 0}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Profitable categories
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Profit Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Profit Trend</CardTitle>
            <CardDescription>
              Daily profit over the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trendLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `KES ${value.toLocaleString()}`}
                    />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString('en-GB')}
                      formatter={(value: number) => [formatCurrency(value), 'Profit']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="profit" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products Chart */}
        {profitData && profitData.byProduct.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Profitable Products</CardTitle>
              <CardDescription>
                Products generating the highest profit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitData.byProduct.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="productName" 
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `KES ${value.toLocaleString()}`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Profit']}
                    />
                    <Bar dataKey="totalProfit" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Product Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Product Performance</CardTitle>
            <CardDescription>
              Detailed profit breakdown by product
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profitLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : profitData && profitData.byProduct.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Product</th>
                      <th className="text-right p-2 font-medium">Qty Sold</th>
                      <th className="text-right p-2 font-medium">Profit</th>
                      <th className="text-right p-2 font-medium">Margin %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitData.byProduct.map((product) => (
                      <tr key={product.productId} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          <div>
                            <div className="font-medium">{product.productName}</div>
                            <div className="text-sm text-muted-foreground">
                              Avg: {formatCurrency(product.averageSellingPrice)} - {formatCurrency(product.averageCostPrice)}
                            </div>
                          </div>
                        </td>
                        <td className="text-right p-2">{product.quantitySold}</td>
                        <td className="text-right p-2">
                          <span className={product.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(product.totalProfit)}
                          </span>
                        </td>
                        <td className="text-right p-2">
                          <Badge variant={product.marginPercent >= 20 ? 'default' : product.marginPercent >= 10 ? 'secondary' : 'destructive'}>
                            {product.marginPercent.toFixed(1)}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No profit data available for the selected period.</p>
                <p className="text-sm">Make some sales to see profit analytics here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MobilePageWrapper>
  );
}