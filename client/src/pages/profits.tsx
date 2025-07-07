import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, ResponsiveContainer } from "recharts";
import { TrendingUp, DollarSign, Percent, Download } from "lucide-react";
import { getProfitData } from "@/lib/supabase-data";

export default function Profits() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  const { data: profitData, isLoading, error } = useQuery({
    queryKey: ['profits', period],
    queryFn: () => getProfitData(period),
  });

  const handleExportCSV = () => {
    if (!profitData) return;
    
    const csvData = [
      ['Product', 'Quantity Sold', 'Profit (KES)', 'Margin %'],
      ...profitData.byProduct.map(item => [
        item.productName,
        item.quantity.toString(),
        item.profit.toFixed(2),
        item.marginPercent.toFixed(1) + '%'
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `profit-report-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Generate sample data for the trend chart
  const generateTrendData = () => {
    const days = period === 'daily' ? 7 : period === 'weekly' ? 4 : 12;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      if (period === 'daily') {
        date.setDate(date.getDate() - i);
      } else if (period === 'weekly') {
        date.setDate(date.getDate() - i * 7);
      } else {
        date.setMonth(date.getMonth() - i);
      }
      
      const baseProfit = profitData?.totalProfit || 0;
      const randomVariation = Math.random() * 0.3 + 0.85; // 85% to 115% variation
      const dayProfit = (baseProfit / days) * randomVariation;
      
      data.push({
        date: period === 'monthly' ? date.toLocaleDateString('en-US', { month: 'short' }) :
              period === 'weekly' ? `Week ${days - i}` :
              date.toLocaleDateString('en-US', { weekday: 'short' }),
        profit: Math.max(0, dayProfit)
      });
    }
    
    return data;
  };

  const periodLabels = {
    daily: "Today's",
    weekly: "This Week's",
    monthly: "This Month's"
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Profits</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600 dark:text-red-400">Error loading profit data: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const trendData = generateTrendData();

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Profits</h1>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setPeriod(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Today</SelectItem>
              <SelectItem value="weekly">7 Days</SelectItem>
              <SelectItem value="monthly">30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {periodLabels[period]} Profit
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              KES {(profitData?.totalProfit || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Overall Margin
            </CardTitle>
            <Percent className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {(profitData?.marginPercent || 0).toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Top Product
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {profitData?.byProduct?.[0]?.productName || 'No sales'}
            </div>
            {profitData?.byProduct?.[0] && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                KES {profitData.byProduct[0].profit.toFixed(2)} profit
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Profit Trend
            </CardTitle>
            <CardDescription>
              {period === 'daily' ? 'Last 7 days' : period === 'weekly' ? 'Last 4 weeks' : 'Last 12 months'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  formatter={(value: number) => [`KES ${value.toFixed(2)}`, 'Profit']}
                  labelStyle={{ color: 'var(--foreground)' }}
                  contentStyle={{ 
                    backgroundColor: 'var(--background)', 
                    border: '1px solid var(--border)',
                    borderRadius: '6px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#16a34a" 
                  strokeWidth={2}
                  dot={{ fill: '#16a34a', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#16a34a', strokeWidth: 2, fill: '#16a34a' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Profitable Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Top 5 Profitable Products
            </CardTitle>
            <CardDescription>
              {periodLabels[period]} performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={profitData?.byProduct.slice(0, 5) || []}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="productName" 
                  className="text-xs"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis className="text-xs" />
                <Tooltip 
                  formatter={(value: number) => [`KES ${value.toFixed(2)}`, 'Profit']}
                  labelStyle={{ color: 'var(--foreground)' }}
                  contentStyle={{ 
                    backgroundColor: 'var(--background)', 
                    border: '1px solid var(--border)',
                    borderRadius: '6px'
                  }}
                />
                <Bar 
                  dataKey="profit" 
                  fill="#7c3aed"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Profit by Product
          </CardTitle>
          <CardDescription>
            Detailed breakdown of {periodLabels[period].toLowerCase()} profit performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 font-medium text-gray-900 dark:text-gray-100">Product</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-900 dark:text-gray-100">Qty Sold</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-900 dark:text-gray-100">Profit</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-900 dark:text-gray-100">Margin %</th>
                </tr>
              </thead>
              <tbody>
                {profitData?.byProduct.length ? (
                  profitData.byProduct.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-2 text-gray-900 dark:text-gray-100">{item.productName}</td>
                      <td className="py-3 px-2 text-right text-gray-600 dark:text-gray-400">{item.quantity}</td>
                      <td className="py-3 px-2 text-right font-medium text-gray-900 dark:text-gray-100">
                        KES {item.profit.toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-right text-gray-600 dark:text-gray-400">
                        {item.marginPercent.toFixed(1)}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500 dark:text-gray-400">
                      No profit data available for the selected period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}