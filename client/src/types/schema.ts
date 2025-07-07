// Local schema types for DukaFiti - Supabase frontend architecture
export interface DashboardMetrics {
  totalRevenue: string;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  revenueGrowth: string;
  ordersGrowth: string;
  lowStockCount: number;
  activeCustomersCount: number;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  description?: string;
  price: string;
  cost_price?: string;
  stock?: number;
  category: string;
  low_stock_threshold?: number;
  sales_count: number;
  created_at: string;
}

export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  balance: string;
  created_at: string;
}

export interface Order {
  id: number;
  customer_id?: number;
  customer_name: string;
  total: string;
  payment_method: string;
  status: string;
  reference?: string;
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  phone?: string;
  created_at: string;
}

export interface Payment {
  id: number;
  customer_id: number;
  amount: string;
  method: string;
  reference?: string;
  status: string;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface SearchResult {
  id: number;
  type: 'product' | 'customer' | 'order';
  name: string;
  subtitle?: string;
  price?: string;
  url?: string;
}

// Insert types for forms
export interface InsertProduct {
  name: string;
  sku: string;
  description?: string;
  price: number;
  cost_price?: number;
  stock?: number;
  category: string;
  low_stock_threshold?: number;
  unknownQuantity?: boolean;
}

export interface InsertCustomer {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  balance?: string;
}

export interface InsertOrder {
  customer_id?: number;
  customer_name: string;
  total: number;
  payment_method: string;
  status: string;
  reference?: string;
}

export interface InsertOrderItem {
  order_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
}