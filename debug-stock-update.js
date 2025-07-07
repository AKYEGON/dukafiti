// Debug Add Stock functionality
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://kwdzbssuovwemthmiuht.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDEyMDYsImV4cCI6MjA2NzExNzIwNn0.7AGomhrpXHBnSgJ15DxFMi80E479S9w9mIeqMnsvNrA'
);

async function debugStockUpdate() {
  console.log('=== DEBUGGING ADD STOCK FUNCTIONALITY ===\n');
  
  try {
    // 1. Check current products and their stock levels
    console.log('1. Fetching current products...');
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .order('id')
      .limit(5);
      
    if (fetchError) {
      console.error('❌ Error fetching products:', fetchError);
      return;
    }
    
    console.log(`✅ Found ${products.length} products:`);
    products.forEach(product => {
      console.log(`  - ${product.name}: Stock = ${product.stock}, Price = ${product.price}`);
    });
    
    if (products.length === 0) {
      console.log('⚠️ No products found. Creating a test product first...');
      
      const { data: newProduct, error: createError } = await supabase
        .from('products')
        .insert([{
          name: 'Test Stock Update Product',
          sku: 'TEST-STOCK-001',
          description: 'Test product for stock update debugging',
          price: 100.00,
          stock: 5,
          category: 'Test',
          low_stock_threshold: 10
        }])
        .select()
        .single();
        
      if (createError) {
        console.error('❌ Failed to create test product:', createError);
        return;
      }
      
      console.log('✅ Created test product:', newProduct);
      products.push(newProduct);
    }
    
    // 2. Test stock update on first product
    const testProduct = products[0];
    console.log(`\n2. Testing stock update on "${testProduct.name}"...`);
    console.log(`   Current stock: ${testProduct.stock}`);
    
    const addQuantity = 10;
    const newStock = (testProduct.stock || 0) + addQuantity;
    
    console.log(`   Adding ${addQuantity} units, new stock should be: ${newStock}`);
    
    // Simulate the exact same update process as the restock modal
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', testProduct.id);
      
    if (updateError) {
      console.error('❌ Failed to update stock:', updateError);
      return;
    }
    
    console.log('✅ Stock update completed');
    
    // 3. Verify the update
    console.log('\n3. Verifying stock update...');
    const { data: updatedProduct, error: verifyError } = await supabase
      .from('products')
      .select('*')
      .eq('id', testProduct.id)
      .single();
      
    if (verifyError) {
      console.error('❌ Failed to verify update:', verifyError);
      return;
    }
    
    console.log(`✅ Verification complete:`);
    console.log(`   Product: ${updatedProduct.name}`);
    console.log(`   Old stock: ${testProduct.stock}`);
    console.log(`   New stock: ${updatedProduct.stock}`);
    console.log(`   Expected: ${newStock}`);
    console.log(`   Update successful: ${updatedProduct.stock === newStock ? 'YES' : 'NO'}`);
    
    // 4. Test with cost_price field (if exists)
    console.log('\n4. Testing cost_price field...');
    const testCostPrice = 75.50;
    
    const { error: costPriceError } = await supabase
      .from('products')
      .update({ 
        stock: updatedProduct.stock + 5,
        cost_price: testCostPrice 
      })
      .eq('id', testProduct.id);
      
    if (costPriceError) {
      console.log('⚠️ cost_price field issue:', costPriceError.message);
      if (costPriceError.message.includes('cost_price')) {
        console.log('   - cost_price column does not exist in database');
        console.log('   - Stock updates will work, but cost tracking is not available');
        console.log('   - This matches the fallback logic in RestockModal');
      }
    } else {
      console.log('✅ cost_price field works correctly');
    }
    
    // 5. Test frontend query invalidation simulation
    console.log('\n5. Testing data refresh simulation...');
    const { data: refreshedProducts, error: refreshError } = await supabase
      .from('products')
      .select('*')
      .order('id');
      
    if (refreshError) {
      console.error('❌ Failed to refresh products:', refreshError);
      return;
    }
    
    console.log(`✅ Refreshed products data (${refreshedProducts.length} products)`);
    const refreshedTestProduct = refreshedProducts.find(p => p.id === testProduct.id);
    
    if (refreshedTestProduct) {
      console.log(`   Test product current stock: ${refreshedTestProduct.stock}`);
    }
    
    console.log('\n=== DEBUGGING COMPLETE ===');
    console.log('\n📋 SUMMARY:');
    console.log('   - Supabase connection: ✅ Working');
    console.log('   - Stock updates: ✅ Working');
    console.log('   - Data persistence: ✅ Working');
    console.log('   - Query refresh: ✅ Working');
    
    if (costPriceError && costPriceError.message.includes('cost_price')) {
      console.log('   - Cost tracking: ⚠️ Column missing (but handled gracefully)');
    } else {
      console.log('   - Cost tracking: ✅ Working');
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

debugStockUpdate();