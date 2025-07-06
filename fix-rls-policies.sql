-- Fix RLS policies to allow service role access
-- This script will update RLS policies to allow the service role to bypass restrictions

-- Disable RLS for key tables to allow service role access
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- Alternative approach: Create permissive policies for authenticated users
-- Uncomment these if you want to keep RLS enabled but allow authenticated access

-- DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON orders;
-- CREATE POLICY "Enable all operations for authenticated users" ON orders
--   FOR ALL USING (true);

-- DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON order_items;
-- CREATE POLICY "Enable all operations for authenticated users" ON order_items
--   FOR ALL USING (true);

-- DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON products;
-- CREATE POLICY "Enable all operations for authenticated users" ON products
--   FOR ALL USING (true);

-- DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON customers;
-- CREATE POLICY "Enable all operations for authenticated users" ON customers
--   FOR ALL USING (true);

-- DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON notifications;
-- CREATE POLICY "Enable all operations for authenticated users" ON notifications
--   FOR ALL USING (true);

-- DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON user_settings;
-- CREATE POLICY "Enable all operations for authenticated users" ON user_settings
--   FOR ALL USING (true);

-- DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON payments;
-- CREATE POLICY "Enable all operations for authenticated users" ON payments
--   FOR ALL USING (true);

-- Grant necessary permissions to authenticated role
GRANT ALL ON orders TO authenticated;
GRANT ALL ON order_items TO authenticated;
GRANT ALL ON products TO authenticated;
GRANT ALL ON customers TO authenticated;
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON user_settings TO authenticated;
GRANT ALL ON payments TO authenticated;

-- Grant permissions to anon role for read operations
GRANT SELECT ON orders TO anon;
GRANT SELECT ON order_items TO anon;
GRANT SELECT ON products TO anon;
GRANT SELECT ON customers TO anon;
GRANT SELECT ON notifications TO anon;
GRANT SELECT ON user_settings TO anon;
GRANT SELECT ON payments TO anon;