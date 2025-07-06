-- Fix Supabase RLS policies for DukaFiti application
-- Run this in Supabase SQL Editor

-- Disable RLS for development or create proper policies
-- Option 1: Disable RLS completely (for development)
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Option 2: Create permissive policies (alternative)
/*
-- Enable RLS but allow all operations for authenticated users
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy for orders - allow all operations for authenticated users
CREATE POLICY "orders_all_operations" ON orders
FOR ALL 
USING (true)
WITH CHECK (true);

-- Policy for order_items - allow all operations
CREATE POLICY "order_items_all_operations" ON order_items
FOR ALL 
USING (true)
WITH CHECK (true);

-- Policy for products - allow all operations
CREATE POLICY "products_all_operations" ON products
FOR ALL 
USING (true)
WITH CHECK (true);

-- Policy for customers - allow all operations
CREATE POLICY "customers_all_operations" ON customers
FOR ALL 
USING (true)
WITH CHECK (true);

-- Policy for notifications - allow all operations
CREATE POLICY "notifications_all_operations" ON notifications
FOR ALL 
USING (true)
WITH CHECK (true);
*/