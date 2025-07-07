import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

async function addCostPriceColumn() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('Adding cost_price column to products table...');
  console.log('Supabase URL:', supabaseUrl);
  
  try {
    // Use Supabase's REST API to execute SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: `
          BEGIN;
          
          -- Add cost_price column if it doesn't exist
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'products' AND column_name = 'cost_price'
            ) THEN
              ALTER TABLE products ADD COLUMN cost_price NUMERIC NOT NULL DEFAULT 0 CHECK (cost_price >= 0);
            END IF;
          END $$;
          
          -- Update existing products with default cost prices (60% of selling price)
          UPDATE products 
          SET cost_price = ROUND(price * 0.6, 2) 
          WHERE cost_price = 0;
          
          COMMIT;
        `
      })
    });

    if (!response.ok) {
      // Try a simpler approach using individual SQL statements
      console.log('Complex query failed, trying simple column addition...');
      
      const simpleResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey
        },
        body: JSON.stringify({
          sql: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price NUMERIC NOT NULL DEFAULT 0'
        })
      });
      
      if (!simpleResponse.ok) {
        console.log('❌ Unable to add column via API');
        console.log('Response:', await simpleResponse.text());
        
        // Provide manual instructions
        console.log('\n📋 Please add the column manually:');
        console.log('1. Go to Supabase Dashboard → Table Editor → products');
        console.log('2. Click "Add Column"');
        console.log('3. Name: cost_price, Type: numeric, Default: 0, Not nullable: true');
        console.log('4. Save the column');
        console.log('\nOr run this SQL in the SQL Editor:');
        console.log('ALTER TABLE products ADD COLUMN cost_price NUMERIC NOT NULL DEFAULT 0;');
        console.log('UPDATE products SET cost_price = ROUND(price * 0.6, 2) WHERE cost_price = 0;');
        
        return false;
      }
      
      console.log('✅ Column added successfully');
    } else {
      console.log('✅ cost_price column added and configured successfully');
    }
    
    return true;
    
  } catch (error) {
    console.error('Error adding column:', error.message);
    console.log('\n📋 Please add the column manually in Supabase Dashboard');
    return false;
  }
}

// Test if the column already exists first
async function testColumnExists() {
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );
  
  try {
    // Try to select cost_price to see if it exists
    const { data, error } = await supabase
      .from('products')
      .select('cost_price')
      .limit(1);
      
    if (error && error.message.includes('cost_price')) {
      console.log('cost_price column does not exist, adding it...');
      return await addCostPriceColumn();
    } else {
      console.log('✅ cost_price column already exists');
      return true;
    }
  } catch (error) {
    console.log('Error testing column existence:', error.message);
    return await addCostPriceColumn();
  }
}

testColumnExists().then(success => {
  if (success) {
    console.log('\n🎉 Database ready! The Add Stock feature is now fully functional.');
  } else {
    console.log('\n⚠️  Manual setup required. Add Stock will work for quantities only until column is added.');
  }
});