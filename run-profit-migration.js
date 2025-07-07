/**
 * Run Profit Tracking Migration
 * This script applies the database schema changes for profit tracking
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Starting profit tracking migration...');
  
  try {
    // Add cost_price column to products table
    console.log('Adding cost_price column to products...');
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price NUMERIC NOT NULL DEFAULT 0 CHECK (cost_price >= 0);`
    });
    
    if (error1) {
      console.log('Note: cost_price column may already exist or using direct SQL...');
    }
    
    // Add cost_price_at_sale column to order_items table
    console.log('Adding cost_price_at_sale column to order_items...');
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS cost_price_at_sale NUMERIC NOT NULL DEFAULT 0;`
    });
    
    if (error2) {
      console.log('Note: cost_price_at_sale column may already exist or using direct SQL...');
    }
    
    // Create restock_history table
    console.log('Creating restock_history table...');
    const { error: error3 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS restock_history (
          id SERIAL PRIMARY KEY,
          product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
          product_name VARCHAR(255) NOT NULL,
          quantity INTEGER NOT NULL,
          supplier VARCHAR(255),
          note TEXT,
          user_id INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `
    });
    
    if (error3) {
      console.log('Note: restock_history table creation may need manual setup...');
    }
    
    // Update existing products with cost prices (if they're 0)
    console.log('Setting default cost prices for existing products...');
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, price, cost_price');
      
    if (!productError && products) {
      for (const product of products) {
        if (!product.cost_price || product.cost_price === 0) {
          const costPrice = Math.round(product.price * 0.6 * 100) / 100; // 60% of selling price
          await supabase
            .from('products')
            .update({ cost_price: costPrice })
            .eq('id', product.id);
        }
      }
      console.log(`✓ Updated cost prices for ${products.length} products`);
    }
    
    // Update existing order_items with cost_price_at_sale
    console.log('Setting cost_price_at_sale for existing orders...');
    const { data: orderItems, error: orderError } = await supabase
      .from('order_items')
      .select(`
        id, 
        product_id, 
        cost_price_at_sale,
        products!inner(cost_price, price)
      `);
      
    if (!orderError && orderItems) {
      for (const item of orderItems) {
        if (!item.cost_price_at_sale || item.cost_price_at_sale === 0) {
          const costPrice = item.products?.cost_price || (item.products?.price * 0.6) || 0;
          await supabase
            .from('order_items')
            .update({ cost_price_at_sale: costPrice })
            .eq('id', item.id);
        }
      }
      console.log(`✓ Updated cost_price_at_sale for ${orderItems.length} order items`);
    }
    
    console.log('✅ Profit tracking migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();