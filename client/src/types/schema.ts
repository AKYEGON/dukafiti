export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost_price?: number;
  stock: number;
  category?: string;
  sku?: string;
  store_id: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  credit_balance: number;
  store_id: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  customer_id?: string;
  total_amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  payment_method?: string;
  notes?: string;
  store_id: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
}

export interface Settings {
  id: string;
  store_name: string;
  owner_name: string;
  address: string;
  phone?: string;
  email?: string;
  currency: string;
  store_id: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  store_id: string;
  created_at: string;
}

// Insert types for forms
export type InsertProduct = Omit<Product, 'id' | 'created_at' | 'updated_at' | 'store_id'>;
export type InsertCustomer = Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'store_id'>;
export type InsertOrder = Omit<Order, 'id' | 'created_at' | 'updated_at' | 'store_id'>;
export type InsertOrderItem = Omit<OrderItem, 'id' | 'created_at'>;
export type InsertSettings = Omit<Settings, 'id' | 'created_at' | 'updated_at' | 'store_id'>;
export type InsertNotification = Omit<Notification, 'id' | 'created_at' | 'store_id'>;