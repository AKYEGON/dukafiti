export interface Product {
  id: string;
  store_id: string;
  name: string;
  sku?: string;
  price: number;
  cost_price?: number;
  stock_quantity?: number;
  category?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  store_id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  store_id: string;
  customer_id?: string;
  customer_name?: string;
  total_amount: number;
  payment_method: 'cash' | 'credit' | 'mobileMoney';
  status: 'completed' | 'pending';
  items: SaleItem[];
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Notification {
  id: string;
  store_id: string;
  user_id: string;
  type: 'credit_reminder' | 'low_stock_alert';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface StoreSettings {
  id: string;
  store_id: string;
  store_name: string;
  owner_name: string;
  phone?: string;
  address?: string;
  currency: string;
  created_at: string;
  updated_at: string;
}
