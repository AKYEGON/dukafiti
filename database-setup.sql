-- DukaFiti Database Setup Script
-- This script creates all necessary tables for the DukaFiti business management application
-- Compatible with PostgreSQL (including Supabase)

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER,
    category VARCHAR(100),
    low_stock_threshold INTEGER DEFAULT 10,
    sales_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    balance DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    customer_name VARCHAR(255) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'completed',
    reference VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    store_name VARCHAR(255),
    store_address TEXT,
    store_phone VARCHAR(20),
    store_email VARCHAR(255),
    owner_name VARCHAR(255),
    store_type VARCHAR(50) DEFAULT 'retail',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data for testing
INSERT INTO users (email, password_hash) VALUES
('test@example.com', '$2a$10$rOzJQQUJhTNZDvwXRjYUGOrELXMZnGZZVKzEGqHGzIXTyUQZvNXTq')
ON CONFLICT (email) DO NOTHING;

INSERT INTO products (name, sku, description, price, stock, category, low_stock_threshold, sales_count) VALUES
('Rice 2kg', 'RICE-2KG', 'Premium quality rice', 150.00, 50, 'Grains', 10, 0),
('Milk 1L', 'MILK-1L', 'Fresh milk', 60.00, 30, 'Dairy', 5, 0),
('Bread', 'BREAD-1', 'White bread loaf', 50.00, 25, 'Bakery', 5, 0),
('Sugar 1kg', 'SUGAR-1KG', 'White sugar', 90.00, 40, 'Pantry', 10, 0),
('Cooking Oil 1L', 'OIL-1L', 'Vegetable cooking oil', 120.00, 20, 'Pantry', 5, 0),
('beans', '50', 'Fresh beans', 60.00, 15, 'Vegetables', 3, 0),
('Test Product', 'TEST-001', 'Test product description', 25.00, NULL, 'Test', 0, 0)
ON CONFLICT (sku) DO NOTHING;

INSERT INTO customers (name, email, phone, balance) VALUES
('John Doe', 'john@example.com', '+254701234567', 0.00),
('Jane Smith', 'jane@example.com', '+254700123456', 250.00),
('Test Customer', 'test@customer.com', '+254712345678', 0.00),
('ko', NULL, '0', 0.00)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);