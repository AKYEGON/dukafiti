-- DukaFiti Complete Database Setup Script
-- Run this in your Supabase SQL Editor to set up the full schema with RLS

-- =============================================================================
-- 1. DROP EXISTING TABLES (if they exist)
-- =============================================================================
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- =============================================================================
-- 2. CREATE TABLES WITH PROPER SCHEMA
-- =============================================================================

-- Products table
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sku text,
  price decimal(10,2) NOT NULL DEFAULT 0,
  cost_price decimal(10,2) DEFAULT 0,
  stock_quantity integer NOT NULL DEFAULT 0,
  category text,
  description text,
  store_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Customers table
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  address text,
  credit_balance decimal(10,2) DEFAULT 0,
  store_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sales table
CREATE TABLE sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  total_amount decimal(10,2) NOT NULL,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
  store_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sale items table (for detailed sale records)
CREATE TABLE sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  unit_price decimal(10,2) NOT NULL,
  total_price decimal(10,2) NOT NULL,
  store_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
  is_read boolean DEFAULT false,
  store_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Settings table
CREATE TABLE settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  value jsonb,
  store_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(key, store_id)
);

-- =============================================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_sku ON products(sku);

CREATE INDEX idx_customers_store_id ON customers(store_id);
CREATE INDEX idx_customers_email ON customers(email);

CREATE INDEX idx_sales_store_id ON sales(store_id);
CREATE INDEX idx_sales_customer_id ON sales(customer_id);
CREATE INDEX idx_sales_created_at ON sales(created_at);

CREATE INDEX idx_sale_items_store_id ON sale_items(store_id);
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);

CREATE INDEX idx_notifications_store_id ON notifications(store_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

CREATE INDEX idx_settings_store_id ON settings(store_id);
CREATE INDEX idx_settings_key ON settings(key);

-- =============================================================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- =============================================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 5. CREATE RLS POLICIES FOR MULTI-TENANT ISOLATION
-- =============================================================================

-- Products policies
CREATE POLICY "Users can manage their own products" ON products
  FOR ALL USING (auth.uid() = store_id)
  WITH CHECK (auth.uid() = store_id);

-- Customers policies
CREATE POLICY "Users can manage their own customers" ON customers
  FOR ALL USING (auth.uid() = store_id)
  WITH CHECK (auth.uid() = store_id);

-- Sales policies
CREATE POLICY "Users can manage their own sales" ON sales
  FOR ALL USING (auth.uid() = store_id)
  WITH CHECK (auth.uid() = store_id);

-- Sale items policies
CREATE POLICY "Users can manage their own sale items" ON sale_items
  FOR ALL USING (auth.uid() = store_id)
  WITH CHECK (auth.uid() = store_id);

-- Notifications policies
CREATE POLICY "Users can manage their own notifications" ON notifications
  FOR ALL USING (auth.uid() = store_id)
  WITH CHECK (auth.uid() = store_id);

-- Settings policies
CREATE POLICY "Users can manage their own settings" ON settings
  FOR ALL USING (auth.uid() = store_id)
  WITH CHECK (auth.uid() = store_id);

-- =============================================================================
-- 6. CREATE FUNCTIONS FOR AUTOMATIC TRIGGERS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================================================
-- 7. CREATE TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- =============================================================================
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =============================================================================
-- 8. INSERT SAMPLE DATA FOR TESTING (OPTIONAL)
-- =============================================================================

-- Note: This sample data will be automatically associated with the authenticated user
-- due to the DEFAULT auth.uid() on store_id columns

-- Sample products
INSERT INTO products (name, sku, price, cost_price, stock_quantity, category, description) VALUES
('Sample Product 1', 'SKU-001', 29.99, 15.00, 100, 'Electronics', 'A sample electronic product'),
('Sample Product 2', 'SKU-002', 49.99, 25.00, 50, 'Clothing', 'A sample clothing item'),
('Sample Product 3', 'SKU-003', 19.99, 10.00, 200, 'Books', 'A sample book product');

-- Sample customers
INSERT INTO customers (name, email, phone, address, credit_balance) VALUES
('John Doe', 'john@example.com', '+1-555-0123', '123 Main St, City', 0.00),
('Jane Smith', 'jane@example.com', '+1-555-0124', '456 Oak Ave, Town', 50.00),
('Bob Johnson', 'bob@example.com', '+1-555-0125', '789 Pine Rd, Village', 0.00);

-- Sample notifications
INSERT INTO notifications (title, message, type, is_read) VALUES
('Welcome to DukaFiti!', 'Your store is now set up and ready to use.', 'success', false),
('Low Stock Alert', 'Some products are running low on stock.', 'warning', false),
('New Customer', 'A new customer has been added to your store.', 'info', false);

-- Sample settings
INSERT INTO settings (key, value) VALUES
('store_name', '"My DukaFiti Store"'),
('currency', '"USD"'),
('tax_rate', '0.08'),
('store_address', '"123 Business St, Commerce City"');

-- =============================================================================
-- SETUP COMPLETE
-- =============================================================================

-- Verify the setup
SELECT 'Database setup complete!' as status;
SELECT 'Tables created: ' || count(*) as tables_count FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('products', 'customers', 'sales', 'sale_items', 'notifications', 'settings');