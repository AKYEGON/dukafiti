#!/usr/bin/env node

/**
 * Debug Product Persistence Issue
 * This script helps identify why products disappear after creation
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugProductPersistence() {
  try {
    console.log('🔍 Debugging product persistence issue...');
    
    // 1. Authenticate as demo user
    console.log('\n1. Authenticating...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'demo@dukafiti.com',
      password: 'DukaFiti2025!'
    });
    
    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      return;
    }
    
    const userId = authData.user.id;
    console.log('✅ Authenticated as:', userId);
    
    // 2. Check current products
    console.log('\n2. Checking existing products...');
    const { data: existingProducts, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', userId)
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('❌ Fetch error:', fetchError);
    } else {
      console.log('✅ Current products count:', existingProducts.length);
      existingProducts.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name} (ID: ${p.id}, SKU: ${p.sku})`);
      });
    }
    
    // 3. Create a test product
    console.log('\n3. Creating test product...');
    const testProduct = {
      name: `Test Product ${Date.now()}`,
      sku: `TEST-${Date.now()}`,
      description: 'Test product for debugging',
      price: 100.00,
      cost_price: 60.00,
      stock: 10,
      category: 'Test',
      low_stock_threshold: 5,
      sales_count: 0,
      store_id: userId
    };
    
    const { data: newProduct, error: createError } = await supabase
      .from('products')
      .insert([testProduct])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Product creation failed:', createError);
      console.error('Details:', createError.details);
      console.error('Hint:', createError.hint);
      console.error('Code:', createError.code);
    } else {
      console.log('✅ Product created successfully:', newProduct.id);
      console.log('Product data:', {
        id: newProduct.id,
        name: newProduct.name,
        sku: newProduct.sku,
        store_id: newProduct.store_id
      });
    }
    
    // 4. Immediately check if product exists
    console.log('\n4. Verifying product persistence...');
    const { data: verifyProducts, error: verifyError } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', userId)
      .order('created_at', { ascending: false });
    
    if (verifyError) {
      console.error('❌ Verification error:', verifyError);
    } else {
      console.log('✅ Products after creation:', verifyProducts.length);
      const justCreated = verifyProducts.find(p => p.name === testProduct.name);
      if (justCreated) {
        console.log('✅ Test product found:', justCreated.name);
      } else {
        console.log('❌ Test product NOT found');
      }
    }
    
    // 5. Check RLS policies
    console.log('\n5. Checking RLS policy access...');
    
    // Try without store_id filter (should fail with RLS)
    const { data: allProducts, error: allError } = await supabase
      .from('products')
      .select('*');
    
    if (allError) {
      console.log('✅ RLS is working - cannot access all products:', allError.message);
    } else {
      console.log('⚠️ RLS might not be working - can see all products:', allProducts.length);
    }
    
    // 6. Test with different user context
    console.log('\n6. Testing query patterns...');
    
    // Pattern 1: Direct query with store_id
    const { data: pattern1, error: p1Error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', userId);
    
    console.log('Pattern 1 (eq store_id):', pattern1?.length || 0, p1Error?.message || 'OK');
    
    // Pattern 2: Query without store_id (relies on RLS)
    const { data: pattern2, error: p2Error } = await supabase
      .from('products')
      .select('*');
    
    console.log('Pattern 2 (RLS only):', pattern2?.length || 0, p2Error?.message || 'OK');
    
    // 7. Check real-time subscriptions
    console.log('\n7. Testing real-time subscription...');
    
    let realtimeCount = 0;
    const channel = supabase
      .channel(`products:store_id=eq.${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `store_id=eq.${userId}`
        },
        (payload) => {
          realtimeCount++;
          console.log(`📡 Real-time event ${realtimeCount}:`, payload.eventType, payload.new?.name || payload.old?.name);
        }
      )
      .subscribe();
    
    // Wait a moment for subscription to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create another test product to trigger real-time
    console.log('\n8. Creating product to test real-time...');
    const realtimeTest = {
      name: `Realtime Test ${Date.now()}`,
      sku: `RT-${Date.now()}`,
      price: 50.00,
      store_id: userId
    };
    
    const { data: rtProduct, error: rtError } = await supabase
      .from('products')
      .insert([realtimeTest])
      .select()
      .single();
    
    if (rtError) {
      console.error('❌ Realtime test product failed:', rtError.message);
    } else {
      console.log('✅ Realtime test product created:', rtProduct.id);
    }
    
    // Wait for real-time event
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(`📊 Real-time events received: ${realtimeCount}`);
    
    // Cleanup
    supabase.removeChannel(channel);
    await supabase.auth.signOut();
    
    console.log('\n✅ Debug completed! Check the logs above for issues.');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugProductPersistence().catch(console.error);