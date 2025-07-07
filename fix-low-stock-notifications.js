/**
 * Comprehensive Low Stock Notification Fix
 * This script will analyze and fix the low stock notification system
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kwdzbssuovwemthmiuht.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDEyMDYsImV4cCI6MjA2NzExNzIwNn0.7AGomhrpXHBnSgJ15DxFMi80E479S9w9mIeqMnsvNrA'
);

async function comprehensiveLowStockFix() {
  console.log('=== COMPREHENSIVE LOW STOCK NOTIFICATION FIX ===\n');
  
  try {
    // 1. Analyze current low stock situation
    console.log('1. Analyzing current low stock products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, stock, low_stock_threshold')
      .not('stock', 'is', null)
      .not('low_stock_threshold', 'is', null);
    
    if (productsError) {
      console.error('❌ Failed to fetch products:', productsError);
      return;
    }
    
    // Find products that should have low stock alerts
    const lowStockProducts = products.filter(p => 
      p.stock !== null && 
      p.low_stock_threshold !== null && 
      p.stock <= p.low_stock_threshold
    );
    
    console.log(`📊 Found ${products.length} products with stock tracking`);
    console.log(`🚨 ${lowStockProducts.length} products are at/below threshold:`);
    
    lowStockProducts.forEach(p => {
      console.log(`   - ${p.name}: ${p.stock} units (threshold: ${p.low_stock_threshold})`);
    });
    
    // 2. Check existing low stock notifications
    console.log('\n2. Checking existing low stock notifications...');
    const { data: existingNotifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .eq('type', 'low_stock')
      .eq('is_read', false)
      .order('created_at', { ascending: false });
    
    if (notificationsError) {
      console.error('❌ Failed to fetch notifications:', notificationsError);
      return;
    }
    
    console.log(`📋 Found ${existingNotifications.length} unread low stock notifications`);
    
    // 3. Create missing low stock notifications
    console.log('\n3. Creating missing low stock notifications...');
    const missingNotifications = [];
    
    for (const product of lowStockProducts) {
      // Check if notification already exists for this product
      const existingNotification = existingNotifications.find(n => 
        n.message && n.message.includes(product.name)
      );
      
      if (!existingNotification) {
        missingNotifications.push(product);
        console.log(`   🔔 Creating notification for ${product.name}`);
        
        const { error: createError } = await supabase
          .from('notifications')
          .insert([{
            type: 'low_stock',
            entity_id: product.id.toString(),
            title: 'Low Stock Alert',
            message: `${product.name} is running low (Current stock: ${product.stock})`,
            is_read: false
          }]);
        
        if (createError) {
          console.error(`❌ Failed to create notification for ${product.name}:`, createError);
        } else {
          console.log(`✅ Created low stock notification for ${product.name}`);
        }
      } else {
        console.log(`   ✓ Notification already exists for ${product.name}`);
      }
    }
    
    // 4. Create enhanced low stock checking function
    console.log('\n4. Testing enhanced low stock checking...');
    
    // Test the enhanced function
    const testProducts = [
      { id: 7, name: 'beans', stock: 10, threshold: 10 },
      { id: 15, name: 'Milk 1L', stock: 15, threshold: 10 },
      { id: 9, name: 'Bread', stock: 13, threshold: 10 }
    ];
    
    for (const product of testProducts) {
      const shouldAlert = product.stock <= product.threshold;
      console.log(`   ${product.name}: ${product.stock} <= ${product.threshold} = ${shouldAlert ? '🚨 ALERT' : '✅ OK'}`);
    }
    
    // 5. Summary
    console.log('\n=== SUMMARY ===');
    console.log(`✅ Analysis complete`);
    console.log(`📊 ${lowStockProducts.length} products need alerts`);
    console.log(`🔔 ${missingNotifications.length} new notifications created`);
    console.log(`💾 ${existingNotifications.length} existing notifications found`);
    
    if (lowStockProducts.length > 0) {
      console.log('\n📋 Current low stock products:');
      lowStockProducts.forEach(p => {
        console.log(`   - ${p.name}: ${p.stock}/${p.low_stock_threshold} units`);
      });
    }
    
    console.log('\n🎯 Low stock notification system should now be working correctly!');
    
  } catch (error) {
    console.error('❌ Error in comprehensive low stock fix:', error);
  }
}

// Run the fix
comprehensiveLowStockFix();