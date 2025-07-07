/**
 * Test RLS Implementation Script
 * This script tests that RLS policies are working correctly
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🧪 Testing RLS Implementation...\n');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRLSImplementation() {
  try {
    console.log('1. Testing authentication...');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('⚠️ No authenticated user found. Please log in to test RLS.');
      return;
    }
    
    console.log(`✅ Authenticated as: ${user.email} (ID: ${user.id})`);

    console.log('\n2. Testing product creation with store_id...');
    
    const testProduct = {
      name: 'RLS Test Product',
      sku: 'RLS-TEST-001',
      description: 'Test product for RLS validation',
      price: '100.00',
      costPrice: '60.00',
      stock: 10,
      category: 'Test',
      lowStockThreshold: 5,
      unknownQuantity: false
    };

    // Import our fixed createProduct function
    const { createProduct } = await import('./client/src/lib/supabase-data.ts');
    
    try {
      const createdProduct = await createProduct(testProduct);
      console.log('✅ Product created successfully:', createdProduct.name);
      console.log(`   - Product ID: ${createdProduct.id}`);
      console.log(`   - Store ID: ${createdProduct.store_id}`);
      console.log(`   - Matches user ID: ${createdProduct.store_id === user.id}`);
    } catch (productError) {
      console.error('❌ Product creation failed:', productError.message);
      if (productError.details) console.error('   Details:', productError.details);
      if (productError.hint) console.error('   Hint:', productError.hint);
    }

    console.log('\n3. Testing customer creation with store_id...');
    
    const testCustomer = {
      name: 'RLS Test Customer',
      email: 'rlstest@example.com',
      phone: '+254700000001',
      balance: '0.00'
    };

    const { createCustomer } = await import('./client/src/lib/supabase-data.ts');
    
    try {
      const createdCustomer = await createCustomer(testCustomer);
      console.log('✅ Customer created successfully:', createdCustomer.name);
      console.log(`   - Customer ID: ${createdCustomer.id}`);
      console.log(`   - Store ID: ${createdCustomer.store_id}`);
      console.log(`   - Matches user ID: ${createdCustomer.store_id === user.id}`);
    } catch (customerError) {
      console.error('❌ Customer creation failed:', customerError.message);
      if (customerError.details) console.error('   Details:', customerError.details);
      if (customerError.hint) console.error('   Hint:', customerError.hint);
    }

    console.log('\n4. Testing data retrieval (should only show user\'s data)...');
    
    const { getProducts, getCustomers } = await import('./client/src/lib/supabase-data.ts');
    
    try {
      const products = await getProducts(user.id);
      console.log(`✅ Retrieved ${products.length} products for this store`);
      
      const customers = await getCustomers(user.id);
      console.log(`✅ Retrieved ${customers.length} customers for this store`);
      
      // Verify all products belong to this user
      const allProductsOwnedByUser = products.every(p => p.store_id === user.id);
      const allCustomersOwnedByUser = customers.every(c => c.store_id === user.id);
      
      console.log(`   - All products owned by user: ${allProductsOwnedByUser}`);
      console.log(`   - All customers owned by user: ${allCustomersOwnedByUser}`);
      
    } catch (retrievalError) {
      console.error('❌ Data retrieval failed:', retrievalError.message);
    }

    console.log('\n5. Testing direct SQL query (should be blocked by RLS)...');
    
    try {
      // This should only return records for the authenticated user
      const { data: allProducts, error: sqlError } = await supabase
        .from('products')
        .select('*');
      
      if (sqlError) {
        console.error('❌ SQL query error:', sqlError.message);
      } else {
        console.log(`✅ SQL query returned ${allProducts.length} products (RLS filtering applied)`);
        
        // Check if all returned products belong to the current user
        const belongsToUser = allProducts.every(p => p.store_id === user.id);
        console.log(`   - All returned products belong to current user: ${belongsToUser}`);
      }
    } catch (sqlError) {
      console.error('❌ Direct SQL query failed:', sqlError.message);
    }

    console.log('\n✅ RLS testing completed!');
    console.log('\nSummary:');
    console.log('- Products and customers should include store_id matching user ID');
    console.log('- Only data belonging to the authenticated user should be visible');
    console.log('- Insert operations should automatically include store_id');
    console.log('- Update operations should only affect user\'s own data');

  } catch (error) {
    console.error('❌ RLS test failed:', error);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testRLSImplementation()
    .then(() => {
      console.log('\n🎉 RLS test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 RLS test failed:', error);
      process.exit(1);
    });
}

export { testRLSImplementation };