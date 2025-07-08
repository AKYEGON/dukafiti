#!/usr/bin/env node

// Setup Supabase authentication and RLS policies for DukaFiti
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kwdzbssuovwemthmiuht.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTU0MTIwNiwiZXhwIjoyMDY3MTE3MjA2fQ.zSvksJ4fZLhaXKs8Ir_pq-yse-8x1NTKFTCWdiSLweQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupSupabaseAuth() {
  console.log('🚀 Setting up Supabase authentication and RLS policies...');
  
  try {
    // Step 1: Create RLS policies for each table
    console.log('\n🔐 Setting up RLS policies...');
    
    const tables = ['products', 'customers', 'orders', 'order_items', 'notifications'];
    
    for (const table of tables) {
      console.log(`Setting up RLS for ${table}...`);
      
      // Enable RLS
      try {
        const { error: enableError } = await supabase.rpc('enable_rls', { table_name: table });
        if (enableError && !enableError.message.includes('already enabled')) {
          console.error(`❌ Enable RLS for ${table}:`, enableError.message);
        }
      } catch (err) {
        // RLS might already be enabled
        console.log(`RLS already enabled for ${table}`);
      }
      
      // Create policy for authenticated users
      try {
        const policyName = `${table}_policy`;
        const { error: policyError } = await supabase.rpc('create_rls_policy', {
          table_name: table,
          policy_name: policyName,
          policy_sql: `
            CREATE POLICY "${policyName}" ON public.${table}
            FOR ALL USING (
              auth.uid() IS NOT NULL OR 
              store_id IS NULL OR 
              store_id = auth.uid()::text
            )
            WITH CHECK (
              auth.uid() IS NOT NULL OR 
              store_id IS NULL OR 
              store_id = auth.uid()::text
            );
          `
        });
        
        if (policyError && !policyError.message.includes('already exists')) {
          console.error(`❌ Create policy for ${table}:`, policyError.message);
        } else {
          console.log(`✅ RLS policy created for ${table}`);
        }
      } catch (err) {
        console.log(`Policy might already exist for ${table}`);
      }
    }
    
    // Step 2: Create a test user for the application
    console.log('\n👤 Creating test user account...');
    
    const testUser = {
      email: 'demo@dukafiti.com',
      password: 'DukaFiti123!',
      options: {
        data: {
          store_name: 'DukaFiti Demo Store',
          owner_name: 'Demo User'
        }
      }
    };
    
    const { data: userData, error: userError } = await supabase.auth.signUp(testUser);
    
    if (userError) {
      if (userError.message.includes('already registered')) {
        console.log('✅ Demo user already exists');
      } else {
        console.error('❌ User creation failed:', userError.message);
      }
    } else {
      console.log('✅ Demo user created successfully');
    }
    
    // Step 3: Create sample data with proper store_id
    console.log('\n📊 Creating sample data...');
    
    // Sign in as the demo user first
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'demo@dukafiti.com',
      password: 'DukaFiti123!'
    });
    
    if (signInError) {
      console.error('❌ Demo user sign-in failed:', signInError.message);
      return;
    }
    
    const demoUserId = signInData.user.id;
    console.log('✅ Signed in as demo user');
    
    // Create sample products
    const sampleProducts = [
      {
        name: 'Rice 2kg',
        sku: 'RICE-2KG',
        price: 250,
        stock: 50,
        category: 'Grains',
        description: 'Premium quality rice',
        low_stock_threshold: 10,
        sales_count: 0,
        cost_price: 150,
        store_id: demoUserId
      },
      {
        name: 'Cooking Oil 1L',
        sku: 'OIL-1L',
        price: 180,
        stock: 30,
        category: 'Cooking',
        description: 'Pure cooking oil',
        low_stock_threshold: 5,
        sales_count: 0,
        cost_price: 120,
        store_id: demoUserId
      },
      {
        name: 'Milk 1L',
        sku: 'MILK-1L',
        price: 75,
        stock: 25,
        category: 'Dairy',
        description: 'Fresh milk',
        low_stock_threshold: 10,
        sales_count: 0,
        cost_price: 55,
        store_id: demoUserId
      }
    ];
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .insert(sampleProducts)
      .select();
    
    if (productsError) {
      console.error('❌ Sample products creation failed:', productsError.message);
    } else {
      console.log(`✅ Created ${products.length} sample products`);
    }
    
    // Create sample customers
    const sampleCustomers = [
      {
        name: 'John Doe',
        phone: '0700123456',
        email: 'john@example.com',
        address: 'Nairobi, Kenya',
        balance: 150.00,
        store_id: demoUserId
      },
      {
        name: 'Jane Smith',
        phone: '0700789012',
        email: 'jane@example.com',
        address: 'Mombasa, Kenya',
        balance: 0.00,
        store_id: demoUserId
      }
    ];
    
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .insert(sampleCustomers)
      .select();
    
    if (customersError) {
      console.error('❌ Sample customers creation failed:', customersError.message);
    } else {
      console.log(`✅ Created ${customers.length} sample customers`);
    }
    
    // Create sample orders
    if (products && customers) {
      const sampleOrders = [
        {
          customer_id: customers[0].id,
          customer_name: customers[0].name,
          total: 500.00,
          payment_method: 'cash',
          status: 'completed',
          store_id: demoUserId
        },
        {
          customer_id: customers[1].id,
          customer_name: customers[1].name,
          total: 255.00,
          payment_method: 'credit',
          status: 'completed',
          store_id: demoUserId
        }
      ];
      
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .insert(sampleOrders)
        .select();
      
      if (ordersError) {
        console.error('❌ Sample orders creation failed:', ordersError.message);
      } else {
        console.log(`✅ Created ${orders.length} sample orders`);
        
        // Create order items
        if (orders && products) {
          const sampleOrderItems = [
            {
              order_id: orders[0].id,
              product_id: products[0].id,
              product_name: products[0].name,
              quantity: 2,
              price: products[0].price,
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
          
          const { data: orderItems, error: orderItemsError } = await supabase
            .from('order_items')
            .insert(sampleOrderItems)
            .select();
          
          if (orderItemsError) {
            console.error('❌ Sample order items creation failed:', orderItemsError.message);
          } else {
            console.log(`✅ Created ${orderItems.length} sample order items`);
          }
        }
      }
    }
    
    console.log('\n🎉 Supabase authentication and sample data setup completed!');
    console.log('\n📋 Demo User Credentials:');
    console.log('Email: demo@dukafiti.com');
    console.log('Password: DukaFiti123!');
    console.log('\n✅ You can now use the application with proper authentication');
    
  } catch (error) {
    console.error('💥 Setup failed:', error.message);
  }
}

setupSupabaseAuth();