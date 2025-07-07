import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kwdzbssuovwemthmiuht.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDEyMDYsImV4cCI6MjA2NzExNzIwNn0.7AGomhrpXHBnSgJ15DxFMi80E479S9w9mIeqMnsvNrA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDatabase() {
  console.log('🌱 Seeding Supabase database with sample data...\n');
  
  try {
    // 1. Create demo user first
    console.log('👤 Creating demo user...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'demo@dukafiti.app',
      password: 'DukaFiti2025!',
      options: {
        data: {
          full_name: 'Demo User',
          store_name: 'Demo Store'
        }
      }
    });
    
    if (authError && !authError.message.includes('already registered')) {
      console.error('❌ Auth error:', authError);
      return;
    }
    
    // Try to sign in to get user ID
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'demo@dukafiti.app',
      password: 'DukaFiti2025!'
    });
    
    let demoUserId;
    if (signInData?.user) {
      demoUserId = signInData.user.id;
      console.log('✅ Demo user authenticated:', demoUserId);
    } else {
      // Use a fixed UUID for demo user if auth doesn't work
      demoUserId = '550e8400-e29b-41d4-a716-446655440000';
      console.log('⚠️ Using fixed demo user ID:', demoUserId);
    }
    
    // 2. Create sample products
    console.log('\n📦 Creating sample products...');
    const sampleProducts = [
      {
        name: 'Sukuma Wiki',
        sku: 'VEG001',
        description: 'Fresh collard greens',
        price: 30,
        cost_price: 18,
        stock: 50,
        category: 'Vegetables',
        low_stock_threshold: 10,
        sales_count: 12,
        store_id: demoUserId
      },
      {
        name: 'Maize Flour (2kg)',
        sku: 'FLR001',
        description: 'Premium white maize flour',
        price: 180,
        cost_price: 120,
        stock: 25,
        category: 'Flour & Grains',
        low_stock_threshold: 5,
        sales_count: 8,
        store_id: demoUserId
      },
      {
        name: 'Cooking Oil (500ml)',
        sku: 'OIL001',
        description: 'Sunflower cooking oil',
        price: 160,
        cost_price: 110,
        stock: 15,
        category: 'Cooking Essentials',
        low_stock_threshold: 8,
        sales_count: 15,
        store_id: demoUserId
      },
      {
        name: 'Rice (1kg)',
        sku: 'RIC001',
        description: 'Premium long grain rice',
        price: 140,
        cost_price: 95,
        stock: 30,
        category: 'Rice & Grains',
        low_stock_threshold: 10,
        sales_count: 20,
        store_id: demoUserId
      },
      {
        name: 'Sugar (1kg)',
        sku: 'SUG001',
        description: 'White crystal sugar',
        price: 120,
        cost_price: 80,
        stock: 40,
        category: 'Baking & Sugar',
        low_stock_threshold: 12,
        sales_count: 25,
        store_id: demoUserId
      },
      {
        name: 'Tea Leaves (250g)',
        sku: 'TEA001',
        description: 'Premium black tea leaves',
        price: 85,
        cost_price: 55,
        stock: 8,
        category: 'Beverages',
        low_stock_threshold: 10,
        sales_count: 18,
        store_id: demoUserId
      }
    ];
    
    const { data: products, error: productError } = await supabase
      .from('products')
      .insert(sampleProducts)
      .select();
    
    if (productError) {
      console.error('❌ Product error:', productError);
    } else {
      console.log(`✅ Created ${products.length} sample products`);
    }
    
    // 3. Create sample customers
    console.log('\n👥 Creating sample customers...');
    const sampleCustomers = [
      {
        name: 'Mary Wanjiku',
        phone: '+254712345678',
        email: 'mary@example.com',
        balance: 450,
        store_id: demoUserId
      },
      {
        name: 'John Kamau',
        phone: '+254798765432',
        email: 'john@example.com',
        balance: 0,
        store_id: demoUserId
      },
      {
        name: 'Grace Akinyi',
        phone: '+254756123789',
        email: 'grace@example.com',
        balance: 280,
        store_id: demoUserId
      },
      {
        name: 'Peter Ochieng',
        phone: '+254721987654',
        email: 'peter@example.com',
        balance: 150,
        store_id: demoUserId
      }
    ];
    
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .insert(sampleCustomers)
      .select();
    
    if (customerError) {
      console.error('❌ Customer error:', customerError);
    } else {
      console.log(`✅ Created ${customers.length} sample customers`);
    }
    
    // 4. Create sample orders
    if (products && customers && products.length > 0 && customers.length > 0) {
      console.log('\n🛒 Creating sample orders...');
      const sampleOrders = [
        {
          customer_id: customers[0].id,
          customer_name: customers[0].name,
          total: 340,
          payment_method: 'cash',
          status: 'completed',
          store_id: demoUserId
        },
        {
          customer_id: customers[1].id,
          customer_name: customers[1].name,
          total: 280,
          payment_method: 'credit',
          status: 'completed',
          store_id: demoUserId
        }
      ];
      
      const { data: orders, error: orderError } = await supabase
        .from('orders')
        .insert(sampleOrders)
        .select();
      
      if (orderError) {
        console.error('❌ Order error:', orderError);
      } else {
        console.log(`✅ Created ${orders.length} sample orders`);
        
        // Create order items
        if (orders) {
          const orderItems = [
            {
              order_id: orders[0].id,
              product_id: products[0].id,
              product_name: products[0].name,
              quantity: 2,
              price: products[0].price,
              store_id: demoUserId
            },
            {
              order_id: orders[0].id,
              product_id: products[2].id,
              product_name: products[2].name,
              quantity: 1,
              price: products[2].price,
              store_id: demoUserId
            },
            {
              order_id: orders[1].id,
              product_id: products[1].id,
              product_name: products[1].name,
              quantity: 1,
              price: products[1].price,
              store_id: demoUserId
            }
          ];
          
          const { data: items, error: itemError } = await supabase
            .from('order_items')
            .insert(orderItems)
            .select();
          
          if (itemError) {
            console.error('❌ Order items error:', itemError);
          } else {
            console.log(`✅ Created ${items.length} order items`);
          }
        }
      }
    }
    
    // 5. Create sample notifications
    console.log('\n🔔 Creating sample notifications...');
    const sampleNotifications = [
      {
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: 'Tea Leaves is running low (8 remaining)',
        user_id: demoUserId,
        is_read: false
      },
      {
        type: 'credit_reminder',
        title: 'Credit Payment Reminder',
        message: 'Mary Wanjiku has an outstanding balance of KES 450',
        user_id: demoUserId,
        is_read: false
      }
    ];
    
    const { data: notifications, error: notificationError } = await supabase
      .from('notifications')
      .insert(sampleNotifications)
      .select();
    
    if (notificationError) {
      console.error('❌ Notification error:', notificationError);
    } else {
      console.log(`✅ Created ${notifications.length} sample notifications`);
    }
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Demo User Credentials:');
    console.log('Email: demo@dukafiti.app');
    console.log('Password: DukaFiti2025!');
    console.log('\n✅ Your DukaFiti application is now ready to use!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
}

seedDatabase();