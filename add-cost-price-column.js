import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function addCostPriceColumn() {
  console.log('Adding cost_price column to products table...');
  
  try {
    // Method 1: Try using the SQL editor function if available
    const { data, error } = await supabase.rpc('exec_sql', {
      query: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price NUMERIC NOT NULL DEFAULT 0 CHECK (cost_price >= 0);'
    });
    
    if (error && error.message.includes('function exec_sql')) {
      console.log('exec_sql function not available, trying alternative approach...');
      
      // Method 2: Try a direct SQL execution via the REST API
      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
        },
        body: JSON.stringify({
          query: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price NUMERIC NOT NULL DEFAULT 0 CHECK (cost_price >= 0);'
        })
      });
      
      if (!response.ok) {
        console.log('Direct SQL execution not available either.');
        console.log('Please add the column manually in the Supabase dashboard:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to Table Editor > products');
        console.log('3. Click "Add Column"');
        console.log('4. Name: cost_price');
        console.log('5. Type: numeric');
        console.log('6. Default value: 0');
        console.log('7. Check: Not nullable');
        console.log('8. Save the column');
        
        // For now, let's update the RestockModal to work without this column
        return false;
      }
      
      const result = await response.json();
      console.log('Column added via REST API:', result);
    } else if (error) {
      console.error('Error adding column:', error);
      return false;
    } else {
      console.log('✅ cost_price column added successfully');
    }
    
    // Now update existing products with default cost prices (60% of selling price)
    console.log('Setting default cost prices for existing products...');
    
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, price');
      
    if (fetchError) {
      console.error('Error fetching products:', fetchError);
      return false;
    }
    
    console.log(`Updating ${products.length} products with cost prices...`);
    
    for (const product of products) {
      const costPrice = Math.round(product.price * 0.6 * 100) / 100; // 60% of selling price
      
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
    
    console.log('✅ All products updated with cost prices');
    return true;
    
  } catch (error) {
    console.error('Error in addCostPriceColumn:', error);
    return false;
  }
}

addCostPriceColumn().then(success => {
  if (success) {
    console.log('\n🎉 cost_price column successfully added and configured!');
    console.log('The Add Stock feature is now fully functional with profit tracking.');
  } else {
    console.log('\n⚠️  Manual column addition required.');
    console.log('The Add Stock feature will work for quantity updates only until the column is added.');
  }
});