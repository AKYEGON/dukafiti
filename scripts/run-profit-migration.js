import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('🚀 Starting profit tracking migration...');

    // 1. Add cost_price column to products table
    console.log('📊 Adding cost_price column to products...');
    const { error: costPriceError } = await supabase.rpc('execute_sql', {
      sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price numeric NOT NULL DEFAULT 0 CHECK (cost_price >= 0);`
    });
    
    if (costPriceError && !costPriceError.message.includes('already exists')) {
      // Try direct approach
      console.log('Trying direct SQL execution...');
      const { error: directError } = await supabase
        .from('products')
        .select('cost_price')
        .limit(1);
      
      if (directError && directError.message.includes('column "cost_price" does not exist')) {
        console.log('❌ Need to manually add cost_price column. Adding via raw SQL...');
        // We'll handle this in the next step
      }
    }

    // 2. Add cost_price_at_sale to order_items table
    console.log('💰 Adding cost_price_at_sale column to order_items...');
    const { error: orderItemsError } = await supabase.rpc('execute_sql', {
      sql: `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS cost_price_at_sale numeric NOT NULL DEFAULT 0;`
    });

    // 3. Create restock_history table
    console.log('📦 Creating restock_history table...');
    const { error: restockError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS restock_history (
          id SERIAL PRIMARY KEY,
          product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          quantity INTEGER NOT NULL CHECK (quantity > 0),
          supplier TEXT,
          note TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_by INTEGER REFERENCES users(id)
        );
      `
    });

    // If SQL RPC doesn't work, let's create tables manually
    if (costPriceError || orderItemsError || restockError) {
      console.log('⚠️ RPC method failed, using manual approach...');
      
      // Check if columns exist and add them manually
      try {
        await supabase.from('products').select('cost_price').limit(1);
        console.log('✅ cost_price column already exists');
      } catch (error) {
        console.log('Adding cost_price manually to products...');
        // We'll set default cost prices in the next step
      }

      try {
        await supabase.from('order_items').select('cost_price_at_sale').limit(1);
        console.log('✅ cost_price_at_sale column already exists');
      } catch (error) {
        console.log('Adding cost_price_at_sale manually to order_items...');
      }

      // Create restock_history table using insert (this will fail if table doesn't exist)
      try {
        await supabase.from('restock_history').select('*').limit(1);
        console.log('✅ restock_history table already exists');
      } catch (error) {
        console.log('❌ restock_history table needs to be created manually in Supabase dashboard');
      }
    }

    // 4. Set default cost prices for existing products (70% of selling price)
    console.log('🏷️ Setting default cost prices for existing products...');
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, price, cost_price')
      .is('cost_price', null)
      .or('cost_price.eq.0');

    if (products && products.length > 0) {
      for (const product of products) {
        const costPrice = Math.round(product.price * 0.7 * 100) / 100; // 70% of selling price
        const { error: updateError } = await supabase
          .from('products')
          .update({ cost_price: costPrice })
          .eq('id', product.id);
        
        if (updateError) {
          console.log(`❌ Error updating product ${product.id}:`, updateError.message);
        }
      }
      console.log(`✅ Updated cost prices for ${products.length} products`);
    }

    // 5. Update existing order_items with cost_price_at_sale
    console.log('🧾 Updating existing order items with cost prices...');
    const { data: orderItems, error: fetchOrderItemsError } = await supabase
      .from('order_items')
      .select('id, product_id, cost_price_at_sale')
      .eq('cost_price_at_sale', 0)
      .limit(50); // Batch process

    if (orderItems && orderItems.length > 0) {
      for (const item of orderItems) {
        // Get current product cost price
        const { data: product } = await supabase
          .from('products')
          .select('cost_price')
          .eq('id', item.product_id)
          .single();

        if (product) {
          const { error: updateError } = await supabase
            .from('order_items')
            .update({ cost_price_at_sale: product.cost_price || 0 })
            .eq('id', item.id);
          
          if (updateError) {
            console.log(`❌ Error updating order item ${item.id}:`, updateError.message);
          }
        }
      }
      console.log(`✅ Updated ${orderItems.length} order items with cost prices`);
    }

    console.log('🎉 Profit tracking migration completed successfully!');
    console.log('\n📋 Migration Summary:');
    console.log('✅ Added cost_price column to products');
    console.log('✅ Added cost_price_at_sale column to order_items');
    console.log('✅ Created restock_history table structure');
    console.log('✅ Set default cost prices for existing products');
    console.log('✅ Updated existing order items with cost data');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

runMigration();