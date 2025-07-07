-- DukaFiti Profit Tracking Migration
-- Add cost price tracking and profit calculation capabilities

-- 1. Add cost_price column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS cost_price numeric NOT NULL DEFAULT 0 CHECK (cost_price >= 0);

-- 2. Add cost_price_at_sale to order_items table (our equivalent of sale_items)
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS cost_price_at_sale numeric NOT NULL DEFAULT 0;

-- 3. Create restock_history table for tracking inventory restocks
CREATE TABLE IF NOT EXISTS restock_history (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  supplier TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id)
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_restock_history_product_id ON restock_history(product_id);
CREATE INDEX IF NOT EXISTS idx_restock_history_created_at ON restock_history(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_created_at ON order_items(id); -- Assuming we track order creation date via orders table

-- 5. Update existing order_items to have cost_price_at_sale (backfill)
-- This will set cost_price_at_sale to current product cost_price for existing records
UPDATE order_items 
SET cost_price_at_sale = (
  SELECT COALESCE(p.cost_price, 0) 
  FROM products p 
  WHERE p.id = order_items.product_id
)
WHERE cost_price_at_sale = 0;

-- 6. Create a view for profit calculations
CREATE OR REPLACE VIEW profit_view AS
SELECT 
  oi.id as order_item_id,
  oi.order_id,
  oi.product_id,
  p.name as product_name,
  p.category,
  oi.quantity,
  oi.price as selling_price,
  oi.cost_price_at_sale,
  (oi.price - oi.cost_price_at_sale) * oi.quantity as profit,
  CASE 
    WHEN oi.price > 0 THEN ((oi.price - oi.cost_price_at_sale) / oi.price) * 100 
    ELSE 0 
  END as margin_percent,
  o.created_at as sale_date,
  o.customer_name
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN orders o ON oi.order_id = o.id;

-- 7. Sample data updates (set some cost prices for existing products)
UPDATE products SET cost_price = price * 0.7 WHERE cost_price = 0; -- Assume 30% markup as default

COMMENT ON TABLE restock_history IS 'Tracks inventory restocking operations';
COMMENT ON COLUMN products.cost_price IS 'Cost price for profit calculations';
COMMENT ON COLUMN order_items.cost_price_at_sale IS 'Cost price at time of sale for accurate profit tracking';