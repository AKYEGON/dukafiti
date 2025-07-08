// DukaFiti Client-Side Type Definitions
// These replace the @shared/schema imports

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  price: number;
  cost_price?: number;
  stock?: number | null;
  category: string;
  low_stock_threshold?: number | null;
  sales_count: number;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  customer_id?: string;
  customer_name?: string;
  total: number;
  payment_method: 'cash' | 'credit' | 'mobileMoney';
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
  created_at: string;
}

export interface DashboardMetrics {
  totalRevenue: number;
  ordersToday: number;
  inventoryItems: number;
  lowStockItems: number;
  totalCustomers: number;
  creditOutstanding: number;
  revenueChange?: number;
  ordersChange?: number;
  inventoryChange?: number;
  lowStockChange?: number;
}

export interface Notification {
  id: string;
  type: 'credit_reminder' | 'low_stock_alert' | 'sale_completed' | 'payment_received';
  title: string;
  message: string;
  is_read: boolean;
  user_id: string;
  entity_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SalesData {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  id: string;
  name: string;
  sales_count: number;
  revenue: number;
}

export interface TopCustomer {
  id: string;
  name: string;
  total_spent: number;
  order_count: number;
  balance: number;
}

// Form types for creating/updating entities
export interface CreateProductData {
  name: string;
  sku: string;
  description?: string;
  price: number;
  costPrice?: number;
  stock?: number;
  category: string;
  lowStockThreshold?: number;
  unknownQuantity?: boolean;
}

export interface CreateCustomerData {
  name: string;
  email?: string;
  phone?: string;
  balance?: number;
}

export interface CreateOrderData {
  customer_id?: string;
  customer_name?: string;
  total: number;
  payment_method: 'cash' | 'credit' | 'mobileMoney';
  items: Array<{
    product_id: string;
    quantity: number;
    price: number;
  }>;
}

// Sales transaction types
export interface SaleItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock?: number;
}

export interface SaleTransaction {
  items: SaleItem[];
  total: number;
  paymentMethod: 'cash' | 'credit' | 'mobileMoney';
  customer?: string;
}