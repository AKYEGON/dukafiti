import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();

// Use the PostgreSQL connection string to add the column
const { Client } = pkg;

async function addCostPriceColumn() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Add the cost_price column
    await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS cost_price NUMERIC NOT NULL DEFAULT 0 
      CHECK (cost_price >= 0);
    `);
    console.log('✅ cost_price column added successfully');

    // Update existing products with default cost prices (60% of selling price)
    const result = await client.query(`
      UPDATE products 
      SET cost_price = ROUND(price * 0.6, 2) 
      WHERE cost_price = 0;
    `);
    console.log(`✅ Updated ${result.rowCount} products with default cost prices`);

    console.log('🎉 Database schema update complete! Add Stock feature is now fully functional.');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

addCostPriceColumn();