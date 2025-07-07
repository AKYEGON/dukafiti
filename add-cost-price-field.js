import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function addCostPriceField() {
  console.log('Adding cost_price field to products table...');
  
  try {
    // Use service role key to run admin operations
    const { data, error } = await supabase.rpc('exec', {
      sql: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price NUMERIC NOT NULL DEFAULT 0'
    });
    
    if (error) {
      console.log('RPC method not available, trying direct approach...');
      
      // Alternative approach: Update schema directly via Supabase dashboard
      // For now, let's manually update existing products
      console.log('Updating existing products with cost_price...');
      
      const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('id, price');
        
      if (fetchError) {
        console.error('Error fetching products:', fetchError);
        return;
      }
      
      console.log(`Found ${products.length} products to update`);
      
      // Update each product individually to add cost_price as 60% of selling price
      for (const product of products) {
        const costPrice = Math.round(product.price * 0.6 * 100) / 100;
        
        const { error: updateError } = await supabase
          .from('products')
          .update({ cost_price: costPrice })
          .eq('id', product.id);
          
        if (updateError) {
          console.log(`Could not update product ${product.id}:`, updateError.message);
        } else {
          console.log(`✓ Updated product ${product.id} with cost_price: ${costPrice}`);
        }
      }
    } else {
      console.log('✅ cost_price field added successfully');
    }
    
  } catch (error) {
    console.error('Error adding cost_price field:', error);
  }
}

addCostPriceField();