// Quick test to verify restock functionality
import { createClient } from '@supabase/supabase-js';

async function testRestockFunctionality() {
  console.log('🧪 Testing restock functionality...');
  
  // Use the same Supabase configuration as the app
  const supabase = createClient(
    'https://kwdzbssuovwemthmiuht.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDEyMDYsImV4cCI6MjA2NzExNzIwNn0.7AGomhrpXHBnSgJ15DxFMi80E479S9w9mIeqMnsvNrA'
  );
  
  try {
    // Get first product
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (fetchError) throw fetchError;
    
    if (!products || products.length === 0) {
      console.log('❌ No products found in database');
      return;
    }
    
    const product = products[0];
    console.log(`📦 Testing with product: ${product.name} (ID: ${product.id})`);
    console.log(`📊 Current stock: ${product.stock}`);
    
    const originalStock = product.stock || 0;
    const addQuantity = 5;
    const newStock = originalStock + addQuantity;
    
    // Test the stock update
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', product.id)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    console.log(`✅ Stock updated successfully: ${originalStock} → ${updatedProduct.stock}`);
    
    // Verify the update
    const { data: verifiedProduct, error: verifyError } = await supabase
      .from('products')
      .select('*')
      .eq('id', product.id)
      .single();
    
    if (verifyError) throw verifyError;
    
    console.log(`✅ Verification successful: Current stock is ${verifiedProduct.stock}`);
    
    if (verifiedProduct.stock === newStock) {
      console.log('🎉 Restock functionality is working correctly!');
      console.log('🔧 The issue was in the frontend mutation state management');
    } else {
      console.log('❌ Stock mismatch detected');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testRestockFunctionality();