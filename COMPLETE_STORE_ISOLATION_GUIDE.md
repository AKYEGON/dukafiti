# Complete Store Isolation Implementation Guide

## Overview
This guide implements complete Row-Level Security (RLS) with store isolation so each user only sees their own data. This fixes all real-time data issues and implements multi-store architecture.

## Step 1: Run SQL Migration in Supabase

Go to your Supabase project's SQL Editor and run this complete migration:

```sql
-- ========================================
-- COMPLETE STORE ISOLATION MIGRATION
-- ========================================

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

-- Step 4: Create comprehensive RLS policies for store isolation
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

-- Step 7: Clean existing data - WARNING: This will delete all existing data
-- Only run this if you want to start fresh, otherwise skip this step
-- DELETE FROM order_items;
-- DELETE FROM orders;
-- DELETE FROM customers;
-- DELETE FROM products;
-- DELETE FROM notifications;

-- Step 8: Verify RLS is working
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('products', 'customers', 'orders', 'order_items', 'notifications');
```

## Step 2: Verify the Migration

After running the SQL migration, verify it worked:

1. Check that RLS is enabled on all tables
2. Check that store_id columns exist
3. Test that triggers are working by creating a test record

## Step 3: Features Implemented

### ✅ Complete Store Isolation
- Each user only sees their own data
- All queries filtered by `store_id = auth.uid()`
- Row-Level Security policies enforce data separation
- Automatic `store_id` assignment via triggers

### ✅ Real-time Data Updates
- Store-isolated real-time subscriptions
- Automatic cache invalidation
- Optimistic UI updates
- Page visibility refresh

### ✅ New Store-Isolated Hooks
- `useDashboardStore()` - Dashboard metrics for current store
- `useInventoryStore()` - Products management with RLS
- `useCustomersStore()` - Customer management with RLS  
- `useSalesStore()` - Orders management with RLS
- `useRealTimeStore()` - Real-time subscriptions with store filtering

### ✅ Enhanced Data Access Layer
- `store-isolated-data.ts` - All functions require `storeId`
- Comprehensive error handling
- Optimistic updates
- Store-aware caching

## Step 4: Testing Store Isolation

1. **Create User Account A**
   - Sign up with email A
   - Add products, customers, orders
   - Note the data visible

2. **Create User Account B**  
   - Sign up with email B
   - Add different products, customers, orders
   - Verify completely separate data

3. **Switch Between Accounts**
   - Log out from A, log into B
   - Verify no data from A is visible in B
   - Try direct database queries - should be blocked by RLS

## Step 5: Real-time Verification

1. **Open Two Browser Tabs**
   - Tab 1: User A logged in
   - Tab 2: User A logged in (same user)
   
2. **Test Real-time Updates**
   - In Tab 1: Add a product
   - In Tab 2: Should see the product appear instantly
   - Verify notifications work

3. **Test Cross-User Isolation**
   - Tab 1: User A
   - Tab 2: User B  
   - Changes in Tab 1 should NOT appear in Tab 2

## ⚠️ Important Notes

1. **Existing Data**: The migration includes a commented section to delete existing data. Only uncomment if you want to start fresh.

2. **Production Safety**: Test thoroughly in development before running on production.

3. **Backup**: Always backup your database before running migrations.

4. **API Keys**: Ensure your Supabase environment variables are correctly configured.

## Troubleshooting

### If RLS Blocks Everything
```sql
-- Temporarily disable RLS to debug (DO NOT USE IN PRODUCTION)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
```

### If Triggers Don't Work
```sql
-- Check if function exists
SELECT routine_name FROM information_schema.routines WHERE routine_name = 'set_store_id';

-- Check if triggers exist
SELECT trigger_name, table_name FROM information_schema.triggers WHERE trigger_name LIKE 'set_store_id%';
```

### If Data Doesn't Update
- Check browser console for errors
- Verify user is authenticated (`auth.uid()` returns value)
- Check that real-time subscriptions are active

## Success Criteria

- ✅ Multiple users see completely separate data
- ✅ Real-time updates work within same store
- ✅ Cross-store queries are blocked by RLS
- ✅ New records automatically get correct store_id
- ✅ All dashboard metrics reflect only current store data