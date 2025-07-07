import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkProductSchema() {
  console.log('Checking products table schema...');
  
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  if (products && products.length > 0) {
    console.log('Products table structure:');
    console.log(Object.keys(products[0]));
    console.log('\nSample product:');
    console.log(products[0]);
    
    // Check if cost_price exists
    const hasCostPrice = 'cost_price' in products[0];
    console.log('\nCost price field exists:', hasCostPrice);
    
    if (!hasCostPrice) {
      console.log('\n❌ cost_price field missing - need to run migration');
    } else {
      console.log('\n✅ cost_price field exists - ready for Add Stock feature');
    }
  } else {
    console.log('No products found in table');
  }
}

checkProductSchema();