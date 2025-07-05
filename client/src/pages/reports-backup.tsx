import { useState, Suspense, lazy } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Download, FileSpreadsheet } from 'lucide-react'
import download from 'downloadjs'
// Lazy load recharts to reduce bundle size
const LineChart = lazy(() => import('recharts').then(module => ({ default: module.LineChart })))
const Line = lazy(() => import('recharts').then(module => ({ default: module.Line })))
const XAxis = lazy(() => import('recharts').then(module => ({ default: module.XAxis })))
const YAxis = lazy(() => import('recharts').then(module => ({ default: module.YAxis })))
const CartesianGrid = lazy(() => import('recharts').then(module => ({ default: module.CartesianGrid })))
const Tooltip = lazy(() => import('recharts').then(module => ({ default: module.Tooltip })))
const ResponsiveContainer = lazy(() => import('recharts').then(module => ({ default: module.ResponsiveContainer })))

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

interface OrdersResponse {
  orders: Array<{
    orderId: number
    customerName: string
    total: string
    paymentMethod: string
    date: string
    products?: Array<{
      name: string
      quantity: number
    }>
  }>
  total: number
  page: number
  totalPages: number
}

// Utility functions
const formatCurrency = (amount: string | number): string => {
  const num = typeof amount  ===  'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(num)
}

const convertToCSV = (data: any[], headers: string[]): string => {
  const csvHeaders = headers.join(',')
  const csvRows = data.map(row =>
    headers.map(header => `"${row[header] || ''}"`).join(',')
  )
  return [csvHeaders, ...csvRows].join('\n')
}

const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset = utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export default function Reports() {
  // State for timeframe selectors
  const [summaryPeriod, setSummaryPeriod]  =  useState<'today' | 'weekly' | 'monthly'>('today')
  const [trendPeriod, setTrendPeriod]  =  useState<'daily' | 'weekly' | 'monthly'>('daily')
  // Orders Record state
  const [ordersPeriod, setOrdersPeriod]  =  useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [ordersPage, setOrdersPage]  =  useState(1)

  const [exportingCSV, setExportingCSV]  =  useState<string | null>(null)
  // Fetch summary data
  const { data: rawSummaryData, isLoading: summaryLoading, error: summaryError }  =  useQuery({
    queryKey: ['/api/reports/summary', summaryPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/reports/summary?period = ${summaryPeriod}`)
      if (!response.ok) throw new Error('Failed to fetch summary')
      return response.json()
    }
  })
  // Transform backend data format to frontend format
  const summaryData: SummaryData | undefined = rawSummaryData ? {
    totalSales: rawSummaryData.totalRevenue || '0',
    cashSales: rawSummaryData.paymentBreakdown?.cash || '0',
    mobileMoneySales: rawSummaryData.paymentBreakdown?.mobileMoney || '0',
    creditSales: rawSummaryData.paymentBreakdown?.credit || '0'
  } : undefined

  // Fetch trend data
  const { data: rawTrendData, isLoading: trendLoading, error: trendError }  =  useQuery({
    queryKey: ['/api/reports/trend', trendPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/reports/trend?period = ${trendPeriod}`)
      if (!response.ok) throw new Error('Failed to fetch trend')
      return response.json()
    }
  })
  // Transform trend data format
  const trendData: TrendData[] | undefined = rawTrendData?.map((item: any) => ({
    label: item.date || item.label,
    value: item.value || 0
  }))
  // Fetch top products data (was top-items)
  const { data: topProductsData, isLoading: topItemsLoading }  =  useQuery<TopProduct[]>({
    queryKey: ['/api/reports/top-products'],
    queryFn: async () => {
      const response = await fetch('/api/reports/top-products')
      if (!response.ok) throw new Error('Failed to fetch top products')
      return response.json()
    }
  })
  // Transform top products to top items format
  const topItemsData: TopItem[] | undefined = topProductsData?.map(product => ({
    name: product.productName,
    unitsSold: product.unitsSold,
    revenue: product.totalRevenue
  }))
  // Fetch customer credits data (using top-customers endpoint)
  const { data: topCustomersData, isLoading: customerCreditsLoading }  =  useQuery<TopCustomer[]>({
    queryKey: ['/api/reports/top-customers'],
    queryFn: async () => {
      const response = await fetch('/api/reports/top-customers')
      if (!response.ok) throw new Error('Failed to fetch top customers')
      return response.json()
    }
  })
  // Transform top customers to customer credits format
  const customerCreditsData: CustomerCredit[] | undefined = topCustomersData?.map(customer => ({
    name: customer.customerName,
    phone: '', // Not available in current data
    balance: customer.totalOwed
  }))
  // Fetch orders data
  const { data: rawOrdersData, isLoading: ordersLoading, error: ordersError }  =  useQuery({
    queryKey: ['/api/reports/orders', ordersPeriod, ordersPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        period: ordersPeriod,
        page: ordersPage.toString(),
        limit: '10'
      })
      const response = await fetch(`/api/reports/orders?${params}`)
      if (!response.ok) throw new Error('Failed to fetch orders')
      return response.json()
    }
  })
  // Transform orders data to handle date formatting
  const ordersData: OrdersResponse | undefined = rawOrdersData ? {
    orders: rawOrdersData.orders?.map((order: any) => ({
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

  // CSV Export Functions
  const exportSummaryCSV = async () => {
    if (!summaryData) return
    setExportingCSV('summary')
    try {
      const csvData = [
        { type: 'Total Sales', amount: summaryData.totalSales },
        { type: 'Cash Sales', amount: summaryData.cashSales },
        { type: 'Mobile Money Sales', amount: summaryData.mobileMoneySales },
        { type: 'Credit Sales', amount: summaryData.creditSales }
      ]

      const csv = convertToCSV(csvData, ['type', 'amount'])
      downloadCSV(csv, `sales-summary-${summaryPeriod}-${new Date().toISOString().split('T')[0]}.csv`)
    } finally {
      setExportingCSV(null)
    }
  }
  // Detailed CSV Export with full order and line item data
  const exportDetailedCSV = async () => {
    setExportingCSV('detailed')
    try {
      const response = await fetch(`/api/reports/export-orders?period = ${summaryPeriod}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/csv'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to export detailed CSV')
      }

      // Get the blob data
      const blob = await response.blob()
      const filename = `orders_detailed_${summaryPeriod}_${new Date().toISOString().split('T')[0]}.csv`
      // Use downloadjs to prompt download
      download(blob, filename, 'text/csv')

    } catch (error) {
      console.error('Failed to export detailed CSV:', error)
      // Could add toast notification here
    } finally {
      setExportingCSV(null)
    }
  }

  return (
    <div className = "min-h-screen bg-background">
      <div className = "container mx-auto px-4 sm:px-6 md:px-8 py-6 lg:py-12">
        <div className = "space-y-6 sm:space-y-8">
          {/* Header */}
          <div>
            <h1 className = "text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">Reports</h1>
            <p className = "text-neutral-600 dark:text-neutral-400">View your business analytics and performance</p>
          </div>

          {/* Responsive Layout */}
          <div className = "space-y-6 sm:space-y-8">

            {/* Timeframe Selector */}
          <div className = "flex items-center gap-4">
            <label className = "text-sm font-medium text-neutral-900 dark:text-neutral-100">Timeframe:</label>
            <Select value = {summaryPeriod} onValueChange = {(value: 'today' | 'weekly' | 'monthly') => setSummaryPeriod(value)}>
              <SelectTrigger className = "w-40 bg-gray-50 dark:bg-gray-800 border rounded px-3 py-2 focus:ring-2 focus:ring-emerald-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value = "today">Today</SelectItem>
                <SelectItem value = "weekly">Week</SelectItem>
                <SelectItem value = "monthly">Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Summary Cards */}
          <div className = "grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Total Sales Card */}
            <div className = "bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
              <p className = "text-sm text-gray-500 dark:text-gray-400 mb-1">Total Sales</p>
              {summaryLoading ? (
                <Skeleton className = "h-6 w-24" />
              ) : (
                <p className = "text-xl font-bold text-neutral-900 dark:text-neutral-100">
                  {formatCurrency(summaryData?.totalSales || '0')}
                </p>
              )}
            </div>

            {/* Cash Sales Card */}
            <div className = "bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
              <p className = "text-sm text-gray-500 dark:text-gray-400 mb-1">Cash</p>
              {summaryLoading ? (
                <Skeleton className = "h-6 w-24" />
              ) : (
                <p className = "text-xl font-bold text-neutral-900 dark:text-neutral-100">
                  {formatCurrency(summaryData?.cashSales || '0')}
                </p>
              )}
            </div>

            {/* Mobile Money Card */}
            <div className = "bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
              <p className = "text-sm text-gray-500 dark:text-gray-400 mb-1">Mobile Money</p>
              {summaryLoading ? (
                <Skeleton className = "h-6 w-24" />
              ) : (
                <p className = "text-xl font-bold text-neutral-900 dark:text-neutral-100">
                  {formatCurrency(summaryData?.mobileMoneySales || '0')}
                </p>
              )}
            </div>

            {/* Credit Sales Card */}
            <div className = "bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
              <p className = "text-sm text-gray-500 dark:text-gray-400 mb-1">Credit</p>
              {summaryLoading ? (
                <Skeleton className = "h-6 w-24" />
              ) : (
                <p className = "text-xl font-bold text-neutral-900 dark:text-neutral-100">
                  {formatCurrency(summaryData?.creditSales || '0')}
                </p>
              )}
            </div>
          </div>

          {/* Trend Chart */}
          <div className = "bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <div className = "flex items-center justify-between mb-4">
              <h3 className = "text-lg font-semibold text-neutral-900 dark:text-neutral-100">Sales Trend</h3>
              <Select value = {trendPeriod} onValueChange = {(value: 'daily' | 'weekly' | 'monthly') => setTrendPeriod(value)}>
                <SelectTrigger className = "w-32 bg-gray-50 dark:bg-gray-800 border rounded px-3 py-2 focus:ring-2 focus:ring-emerald-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value = "daily">Daily</SelectItem>
                  <SelectItem value = "weekly">Weekly</SelectItem>
                  <SelectItem value = "monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {trendLoading ? (
              <div className = "h-64 flex items-center justify-center">
                <Skeleton className = "h-full w-full" />
              </div>
            ) : trendData && trendData.length > 0 ? (
              <div className = "h-64">
                <Suspense fallback = {<Skeleton className = "h-full w-full" />}>
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
                </Suspense>
              </div>
            ) : (
              <div className = "h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                No data available for this period.
              </div>
            )}
          </div>

          {/* Top Customers Card */}
          <div className = "bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <h3 className = "text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Top Customers (Credit)</h3>
            {customerCreditsLoading ? (
              <div className = "space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key = {i} className = "flex justify-between items-center">
                    <div className = "space-y-1">
                      <Skeleton className = "h-4 w-24" />
                      <Skeleton className = "h-3 w-16" />
                    </div>
                    <Skeleton className = "h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : topCustomersData && topCustomersData.length > 0 ? (
              <div className = "space-y-3">
                {topCustomersData.map((customer, index) => (
                  <div key = {index} className = "flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                    <div>
                      <p className = "font-medium text-gray-900 dark:text-gray-100">{customer.customerName}</p>
                      <p className = "text-sm text-gray-500 dark:text-gray-400">{customer.outstandingOrders} outstanding orders</p>
                    </div>
                    <div className = "text-right">
                      <p className = "font-semibold text-red-600 dark:text-red-400">{formatCurrency(customer.totalOwed)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className = "text-center py-8 text-gray-500 dark:text-gray-400">
                No customers with outstanding credit for this period.
              </div>
            )}
          </div>

          {/* Top-Selling Products Card */}
          <div className = "bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <h3 className = "text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Top-Selling Products</h3>
            {topProductsLoading ? (
              <div className = "space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key = {i} className = "flex justify-between items-center">
                    <div className = "space-y-1">
                      <Skeleton className = "h-4 w-24" />
                      <Skeleton className = "h-3 w-16" />
                    </div>
                    <Skeleton className = "h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : topProductsData && topProductsData.length > 0 ? (
              <div className = "space-y-3">
                {topProductsData.map((product, index) => (
                  <div key = {index} className = "py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                    <div className = "flex justify-between items-start mb-2">
                      <div>
                        <p className = "font-medium text-gray-900 dark:text-gray-100">{product.productName}</p>
                        <p className = "text-sm text-gray-500 dark:text-gray-400">{product.unitsSold} units sold</p>
                      </div>
                      <p className = "font-semibold text-green-600 dark:text-green-400">{formatCurrency(product.totalRevenue)}</p>
                    </div>
                    {/* Progress bar showing relative sales volume */}
                    <div className = "w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className = "bg-green-500 h-2 rounded-full transition-all duration-300"
                        style = {{
                          width: `${Math.min(100, (product.unitsSold / (topProductsData[0]?.unitsSold || 1)) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className = "text-center py-8 text-gray-500 dark:text-gray-400">
                No product sales data for this period.
              </div>
            )}
          </div>

          {/* Orders Record */}
          <div className = "bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <div className = "mb-4">
              <h3 className = "text-lg font-semibold text-neutral-900 dark:text-neutral-100">Orders Record</h3>
            </div>

            {ordersLoading ? (
              <div className = "space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key = {i} className = "h-16 w-full" />
                ))}
              </div>
            ) : ordersData && ordersData.orders.length > 0 ? (
              <>
                {/* Desktop Table */}
                <div className = "hidden md:block">
                  <table className = "table-auto w-full text-sm">
                    <thead>
                      <tr className = "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                        <th className = "px-3 py-2 text-left">Order ID</th>
                        <th className = "px-3 py-2 text-left">Customer</th>
                        <th className = "px-3 py-2 text-left">Products</th>
                        <th className = "px-3 py-2 text-right">Amount</th>
                        <th className = "px-3 py-2 text-left">Payment</th>
                        <th className = "px-3 py-2 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordersData.orders.map((order) => (
                        <tr key = {order.orderId} className = "hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                          <td className = "px-3 py-3 font-medium text-gray-900 dark:text-gray-100">#{order.orderId}</td>
                          <td className = "px-3 py-3 text-gray-700 dark:text-gray-300">{order.customerName}</td>
                          <td className = "px-3 py-3 text-gray-700 dark:text-gray-300">
                            {order.products && order.products.length > 0
                              ? order.products.map(p => `${p.name} x${p.quantity}`).join(', ')
                              : 'No products'
                            }
                          </td>
                          <td className = "px-3 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(order.total)}
                          </td>
                          <td className = "px-3 py-3">
                            <span className = {`px-2 py-1 rounded text-xs font-medium ${
                              order.paymentMethod  ===  'cash'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : order.paymentMethod  ===  'mobileMoney'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                            }`}>
                              {order.paymentMethod  ===  'cash' ? 'Cash' :
                               order.paymentMethod  ===  'mobileMoney' ? 'Mobile Money' : 'Credit'}
                            </span>
                          </td>
                          <td className = "px-3 py-3 text-gray-500 dark:text-gray-400 text-sm">{order.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className = "md:hidden space-y-3">
                  {ordersData.orders.map((order) => (
                    <div key = {order.orderId} className = "bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className = "flex justify-between items-start mb-2">
                        <div>
                          <p className = "font-medium text-gray-900 dark:text-gray-100">Order #{order.orderId}</p>
                          <p className = "text-sm text-gray-500 dark:text-gray-400">{order.customerName}</p>
                        </div>
                        <p className = "font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(order.total)}</p>
                      </div>
                      <div className = "mb-2">
                        <p className = "text-sm text-gray-700 dark:text-gray-300">
                          <span className = "font-medium">Products: </span>
                          {order.products && order.products.length > 0
                            ? order.products.map(p => `${p.name} x${p.quantity}`).join(', ')
                            : 'No products'
                          }
                        </p>
                      </div>
                      <div className = "flex justify-between items-center">
                        <span className = {`px-2 py-1 rounded text-xs font-medium ${
                          order.paymentMethod  ===  'cash'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : order.paymentMethod  ===  'mobileMoney'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                        }`}>
                          {order.paymentMethod  ===  'cash' ? 'Cash' :
                           order.paymentMethod  ===  'mobileMoney' ? 'Mobile Money' : 'Credit'}
                        </span>
                        <p className = "text-sm text-gray-500 dark:text-gray-400">{order.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className = "text-center py-8 text-gray-500 dark:text-gray-400">
                No data available for this period.
              </div>
            )}
          </div>

          {/* Export CSV Buttons */}
          <div className = "space-y-3">
            <Button
              onClick = {exportSummaryCSV}
              disabled = {exportingCSV  ===  'summary'}
              className = "w-full bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-2 focus:ring-emerald-500"
            >
              <Download className = "h-4 w-4 mr-2" />
              {exportingCSV  ===  'summary' ? 'Exporting...' : 'Export Summary CSV'}
            </Button>

            <Button
              onClick = {exportDetailedCSV}
              disabled = {exportingCSV  ===  'detailed'}
              className = "w-full bg-purple-600 hover:bg-purple-700 text-white focus:ring-2 focus:ring-purple-500"
            >
              <FileSpreadsheet className = "h-4 w-4 mr-2" />
              {exportingCSV  ===  'detailed' ? 'Exporting...' : 'Export Detailed CSV'}
            </Button>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}