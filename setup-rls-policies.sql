-- Complete RLS Setup for DukaFiti Store Isolation
-- Run these commands in Supabase SQL Editor

-- =============================================
-- 1. ADD store_id COLUMNS IF NOT EXISTS
-- =============================================

ALTER TABLE customers ADD COLUMN IF NOT EXISTS store_id uuid;
ALTER TABLE products ADD COLUMN IF NOT EXISTS store_id uuid;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS store_id uuid;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS store_id uuid;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS store_id uuid;

-- =============================================
-- 2. ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 3. DROP EXISTING POLICIES (IF ANY)
-- =============================================

-- Customers policies
DROP POLICY IF EXISTS "Select own customers" ON customers;
DROP POLICY IF EXISTS "Insert own customers" ON customers;
DROP POLICY IF EXISTS "Update own customers" ON customers;
DROP POLICY IF EXISTS "Delete own customers" ON customers;

-- Products policies
DROP POLICY IF EXISTS "Select own products" ON products;
DROP POLICY IF EXISTS "Insert own products" ON products;
DROP POLICY IF EXISTS "Update own products" ON products;
DROP POLICY IF EXISTS "Delete own products" ON products;

-- Orders policies
DROP POLICY IF EXISTS "Select own orders" ON orders;
DROP POLICY IF EXISTS "Insert own orders" ON orders;
DROP POLICY IF EXISTS "Update own orders" ON orders;
DROP POLICY IF EXISTS "Delete own orders" ON orders;

-- Order items policies
DROP POLICY IF EXISTS "Select own order_items" ON order_items;
DROP POLICY IF EXISTS "Insert own order_items" ON order_items;
DROP POLICY IF EXISTS "Update own order_items" ON order_items;
DROP POLICY IF EXISTS "Delete own order_items" ON order_items;

-- Notifications policies
DROP POLICY IF EXISTS "Select own notifications" ON notifications;
DROP POLICY IF EXISTS "Insert own notifications" ON notifications;
DROP POLICY IF EXISTS "Update own notifications" ON notifications;
DROP POLICY IF EXISTS "Delete own notifications" ON notifications;

-- =============================================
-- 4. CREATE COMPREHENSIVE RLS POLICIES
-- =============================================

-- CUSTOMERS TABLE POLICIES
CREATE POLICY "Select own customers" ON customers
  FOR SELECT USING (store_id = auth.uid());

CREATE POLICY "Insert own customers" ON customers
  FOR INSERT WITH CHECK (store_id = auth.uid());

CREATE POLICY "Update own customers" ON customers
  FOR UPDATE 
  USING (store_id = auth.uid())
  WITH CHECK (store_id = auth.uid());

CREATE POLICY "Delete own customers" ON customers
  FOR DELETE USING (store_id = auth.uid());

-- PRODUCTS TABLE POLICIES
CREATE POLICY "Select own products" ON products
  FOR SELECT USING (store_id = auth.uid());

CREATE POLICY "Insert own products" ON products
  FOR INSERT WITH CHECK (store_id = auth.uid());

CREATE POLICY "Update own products" ON products
  FOR UPDATE 
  USING (store_id = auth.uid())
  WITH CHECK (store_id = auth.uid());

CREATE POLICY "Delete own products" ON products
  FOR DELETE USING (store_id = auth.uid());

-- ORDERS TABLE POLICIES
CREATE POLICY "Select own orders" ON orders
  FOR SELECT USING (store_id = auth.uid());

CREATE POLICY "Insert own orders" ON orders
  FOR INSERT WITH CHECK (store_id = auth.uid());

CREATE POLICY "Update own orders" ON orders
  FOR UPDATE 
  USING (store_id = auth.uid())
  WITH CHECK (store_id = auth.uid());

CREATE POLICY "Delete own orders" ON orders
  FOR DELETE USING (store_id = auth.uid());

-- ORDER_ITEMS TABLE POLICIES
CREATE POLICY "Select own order_items" ON order_items
  FOR SELECT USING (store_id = auth.uid());

CREATE POLICY "Insert own order_items" ON order_items
  FOR INSERT WITH CHECK (store_id = auth.uid());

CREATE POLICY "Update own order_items" ON order_items
  FOR UPDATE 
  USING (store_id = auth.uid())
  WITH CHECK (store_id = auth.uid());

CREATE POLICY "Delete own order_items" ON order_items
  FOR DELETE USING (store_id = auth.uid());

-- NOTIFICATIONS TABLE POLICIES (supports both user_id and store_id)
CREATE POLICY "Select own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid() OR store_id = auth.uid());

CREATE POLICY "Insert own notifications" ON notifications
  FOR INSERT WITH CHECK (user_id = auth.uid() OR store_id = auth.uid());

CREATE POLICY "Update own notifications" ON notifications
  FOR UPDATE 
  USING (user_id = auth.uid() OR store_id = auth.uid())
  WITH CHECK (user_id = auth.uid() OR store_id = auth.uid());

CREATE POLICY "Delete own notifications" ON notifications
  FOR DELETE USING (user_id = auth.uid() OR store_id = auth.uid());

-- =============================================
-- 5. VERIFICATION QUERIES
-- =============================================

-- Check that RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('customers', 'products', 'orders', 'order_items', 'notifications');

-- Check that policies are created
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- =============================================
-- 6. TEST DATA INSERTION (OPTIONAL)
-- =============================================

-- Test inserting a product (replace 'your-user-id' with actual auth.uid())
/*
INSERT INTO products (name, sku, description, price, cost_price, stock, category, low_stock_threshold, sales_count, store_id)
VALUES ('Test Product', 'TEST001', 'Test product for RLS', '100.00', '60.00', 10, 'Test', 5, 0, auth.uid());
*/

-- Test inserting a customer
/*
INSERT INTO customers (name, email, phone, balance, store_id)
VALUES ('Test Customer', 'test@example.com', '+254700000000', '0.00', auth.uid());
*/

-- =============================================
-- 7. CLEANUP SCRIPT (RUN IF NEEDED)
-- =============================================

-- If you need to disable RLS and start over:
/*
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
*/