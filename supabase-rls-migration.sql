-- Complete Store Isolation Migration for DukaFiti
-- Run this script in Supabase SQL Editor to enable Row-Level Security

-- Step 1: Add store_id columns to all tables
ALTER TABLE products ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES auth.users(id);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES auth.users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES auth.users(id);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES auth.users(id);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES auth.users(id);

-- Step 2: Enable Row Level Security on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies if they exist
DROP POLICY IF EXISTS "Users manage their own products" ON products;
DROP POLICY IF EXISTS "Users manage their own customers" ON customers;
DROP POLICY IF EXISTS "Users manage their own orders" ON orders;
DROP POLICY IF EXISTS "Users manage their own order_items" ON order_items;
DROP POLICY IF EXISTS "Users manage their own notifications" ON notifications;

-- Step 4: Create RLS policies for store isolation
CREATE POLICY "Users manage their own products" ON products
  FOR ALL USING (auth.uid() = store_id);

CREATE POLICY "Users manage their own customers" ON customers
  FOR ALL USING (auth.uid() = store_id);

CREATE POLICY "Users manage their own orders" ON orders
  FOR ALL USING (auth.uid() = store_id);

CREATE POLICY "Users manage their own order_items" ON order_items
  FOR ALL USING (auth.uid() = store_id);

CREATE POLICY "Users manage their own notifications" ON notifications
  FOR ALL USING (auth.uid() = store_id);

-- Step 5: Create function to automatically set store_id for new records
CREATE OR REPLACE FUNCTION set_store_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.store_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create triggers to automatically set store_id on insert
DROP TRIGGER IF EXISTS set_store_id_products ON products;
CREATE TRIGGER set_store_id_products
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION set_store_id();

DROP TRIGGER IF EXISTS set_store_id_customers ON customers;
CREATE TRIGGER set_store_id_customers
  BEFORE INSERT ON customers
  FOR EACH ROW
  EXECUTE FUNCTION set_store_id();

DROP TRIGGER IF EXISTS set_store_id_orders ON orders;
CREATE TRIGGER set_store_id_orders
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_store_id();

DROP TRIGGER IF EXISTS set_store_id_order_items ON order_items;
CREATE TRIGGER set_store_id_order_items
  BEFORE INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION set_store_id();

DROP TRIGGER IF EXISTS set_store_id_notifications ON notifications;
CREATE TRIGGER set_store_id_notifications
  BEFORE INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION set_store_id();