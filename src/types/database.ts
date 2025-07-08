export interface Product {
  id: string;
  name: string;
  sku?: string;
  price: number;
  cost_price?: number;
  stock_quantity: number;
  category?: string;
  description?: string;
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

export interface Sale {
  id: string;
  customer_id?: string;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'cancelled';
  store_id: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  is_read: boolean;
  store_id: string;
  created_at: string;
  updated_at: string;
}

export interface Setting {
  id: string;
  key: string;
  value: any;
  store_id: string;
  created_at: string;
  updated_at: string;
}