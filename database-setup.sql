-- DukaFiti Database Setup with Multi-Tenant RLS
-- Run this in your Supabase SQL editor

-- 1. Create tables
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  name text NOT NULL,
  sku text,
  price numeric(10,2) NOT NULL,
  cost_price numeric(10,2),
  stock_quantity integer,
  category text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  name text NOT NULL,
  phone text,
  email text,
  address text,
  balance numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  customer_id uuid,
  customer_name text,
  total_amount numeric(10,2) NOT NULL,
  payment_method text CHECK (payment_method IN ('cash', 'credit', 'mobileMoney')),
  status text CHECK (status IN ('completed', 'pending')) DEFAULT 'completed',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id uuid NOT NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  user_id uuid NOT NULL,
  type text CHECK (type IN ('credit_reminder', 'low_stock_alert')),
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL UNIQUE,
  store_name text,
  owner_name text,
  phone text,
  address text,
  currency text DEFAULT 'KES',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for multi-tenant isolation
-- Replace YOUR_ADMIN_USER_ID with your actual admin user ID if needed

-- Products policies
CREATE POLICY "users can CRUD own products" ON products
  FOR ALL
  USING (store_id = auth.uid())
  WITH CHECK (store_id = auth.uid());

-- Customers policies
CREATE POLICY "users can CRUD own customers" ON customers
  FOR ALL
  USING (store_id = auth.uid())
  WITH CHECK (store_id = auth.uid());

-- Sales policies
CREATE POLICY "users can CRUD own sales" ON sales
  FOR ALL
  USING (store_id = auth.uid())
  WITH CHECK (store_id = auth.uid());

-- Sale items policies (via sales table)
CREATE POLICY "users can CRUD own sale items" ON sale_items
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM sales WHERE sales.id = sale_items.sale_id AND sales.store_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM sales WHERE sales.id = sale_items.sale_id AND sales.store_id = auth.uid()
  ));

-- Notifications policies
CREATE POLICY "users can CRUD own notifications" ON notifications
  FOR ALL
  USING (store_id = auth.uid())
  WITH CHECK (store_id = auth.uid());

-- Settings policies
CREATE POLICY "users can CRUD own settings" ON settings
  FOR ALL
  USING (store_id = auth.uid())
  WITH CHECK (store_id = auth.uid());

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_customers_store_id ON customers(store_id);
CREATE INDEX IF NOT EXISTS idx_sales_store_id ON sales(store_id);
CREATE INDEX IF NOT EXISTS idx_notifications_store_id ON notifications(store_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);

-- 5. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Create triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Insert sample data (optional - for testing)
-- This data will be isolated per user due to RLS policies
-- Run these after authenticating as a user

-- Example for demo purposes (replace with actual user ID)
-- INSERT INTO products (store_id, name, price, stock_quantity, category) VALUES 
--   (auth.uid(), 'Rice 1kg', 120.00, 50, 'Food'),
--   (auth.uid(), 'Beans 500g', 80.00, 30, 'Food'),
--   (auth.uid(), 'Cooking Oil 500ml', 200.00, 15, 'Food');

-- INSERT INTO customers (store_id, name, phone, balance) VALUES
--   (auth.uid(), 'John Doe', '+254700000001', 0),
--   (auth.uid(), 'Jane Smith', '+254700000002', 150.00);

NOTIFY pgrst, 'reload schema';