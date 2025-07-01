-- DukaSmart PostgreSQL Database Schema
-- Run this script on your PostgreSQL database to create all required tables

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    category TEXT NOT NULL,
    low_stock_threshold INTEGER NOT NULL DEFAULT 10,
    sales_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    customer_name TEXT NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    status TEXT NOT NULL DEFAULT 'pending',
    reference TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL
);

-- Create business_profiles table
CREATE TABLE IF NOT EXISTS business_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    business_name TEXT NOT NULL,
    business_type TEXT NOT NULL,
    location TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    amount DECIMAL(10,2) NOT NULL,
    method TEXT NOT NULL,
    reference TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create store_profiles table
CREATE TABLE IF NOT EXISTS store_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    store_name TEXT NOT NULL,
    store_type TEXT NOT NULL,
    location TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    theme TEXT NOT NULL DEFAULT 'light',
    currency TEXT NOT NULL DEFAULT 'KES',
    language TEXT NOT NULL DEFAULT 'en',
    notifications BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Insert sample data (optional)
-- Default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, phone) 
VALUES ('admin', 'admin@dukasmart.com', '$2b$10$gSrf/g.rKR9VWM.C/tDjQObO6QASq6hTNvADSbaTJ6gTcjU4/UCza', '+254700000000')
ON CONFLICT (email) DO NOTHING;

-- Sample products
INSERT INTO products (name, sku, description, price, stock, category, low_stock_threshold) VALUES
('Rice 2kg', 'RICE-2KG', 'Premium quality rice', 150.00, 50, 'Grains', 10),
('Cooking Oil 1L', 'OIL-1L', 'Pure vegetable cooking oil', 120.00, 30, 'Cooking', 5),
('Sugar 1kg', 'SUGAR-1KG', 'White refined sugar', 80.00, 25, 'Baking', 8)
ON CONFLICT (sku) DO NOTHING;

-- Sample customers
INSERT INTO customers (name, email, phone, address, balance) VALUES
('John Doe', 'john@example.com', '+254700123456', '123 Main St, Nairobi', 0.00),
('Jane Smith', 'jane@example.com', '+254700654321', '456 Oak Ave, Mombasa', 50.00)
ON CONFLICT DO NOTHING;

-- User settings for admin user
INSERT INTO user_settings (user_id, theme, currency, language, notifications)
SELECT 1, 'light', 'KES', 'en', true
WHERE NOT EXISTS (SELECT 1 FROM user_settings WHERE user_id = 1);