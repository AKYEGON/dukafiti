-- DukaFiti Profit Tracking Migration
-- Adds cost tracking and profit calculation capabilities

-- Add cost_price column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS cost_price NUMERIC NOT NULL DEFAULT 0 
CHECK (cost_price >= 0);

-- Add cost_price_at_sale column to order_items table  
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS cost_price_at_sale NUMERIC NOT NULL DEFAULT 0;

-- Create restock_history table for tracking inventory restocking
CREATE TABLE IF NOT EXISTS restock_history (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    supplier VARCHAR(255),
    note TEXT,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster profit queries
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_restock_history_product_id ON restock_history(product_id);
CREATE INDEX IF NOT EXISTS idx_restock_history_created_at ON restock_history(created_at);

-- Update existing products with sample cost prices (60% of selling price as default)
UPDATE products 
SET cost_price = ROUND(price * 0.6, 2) 
WHERE cost_price = 0;

-- Update existing order_items with cost_price_at_sale based on product cost_price
UPDATE order_items 
SET cost_price_at_sale = (
    SELECT COALESCE(p.cost_price, p.price * 0.6) 
    FROM products p 
    WHERE p.id = order_items.product_id
)
WHERE cost_price_at_sale = 0;