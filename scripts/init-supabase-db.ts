import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create a Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function initializeSupabaseDatabase() {
  try {
    console.log('Initializing Supabase database...');
    
    // Create tables using SQL
    const createTablesSQL = `
      -- Create users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        phone TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      -- Create products table
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        sku TEXT NOT NULL UNIQUE,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        stock INTEGER,
        category TEXT NOT NULL,
        low_stock_threshold INTEGER NOT NULL DEFAULT 10,
        sales_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      -- Create customers table
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      -- Create orders table
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id),
        customer_name TEXT NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        payment_method TEXT NOT NULL DEFAULT 'cash',
        status TEXT NOT NULL DEFAULT 'pending',
        reference TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      -- Create order_items table
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id),
        product_id INTEGER NOT NULL REFERENCES products(id),
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL
      );

      -- Create business_profiles table
      CREATE TABLE IF NOT EXISTS business_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        business_name TEXT NOT NULL,
        business_type TEXT NOT NULL,
        location TEXT,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      -- Create payments table
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        amount DECIMAL(10, 2) NOT NULL,
        method TEXT NOT NULL,
        reference TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      -- Create store_profiles table
      CREATE TABLE IF NOT EXISTS store_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        store_name TEXT NOT NULL,
        owner_name TEXT,
        store_type TEXT NOT NULL,
        location TEXT,
        description TEXT,
        paybill_till_number TEXT,
        consumer_key TEXT,
        consumer_secret TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      -- Create user_settings table
      CREATE TABLE IF NOT EXISTS user_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        theme TEXT NOT NULL DEFAULT 'light',
        currency TEXT NOT NULL DEFAULT 'KES',
        language TEXT NOT NULL DEFAULT 'en',
        notifications BOOLEAN NOT NULL DEFAULT true,
        mpesa_enabled BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      -- Create notifications table
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'info',
        is_read BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `;

    const { error: tablesError } = await supabase.rpc('exec_sql', { 
      sql: createTablesSQL 
    });

    if (tablesError) {
      console.error('Error creating tables:', tablesError);
      
      // Try individual table creation
      const tables = createTablesSQL.split(';').filter(sql => sql.trim());
      for (const tableSQL of tables) {
        if (tableSQL.trim()) {
          const { error } = await supabase.rpc('exec_sql', { sql: tableSQL });
          if (error) {
            console.error('Error creating table:', error);
          }
        }
      }
    } else {
      console.log('Database tables created successfully!');
    }

    // Check if we need to seed data
    const { data: existingUsers } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (!existingUsers || existingUsers.length === 0) {
      console.log('Seeding initial data...');
      
      // Create default user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const { data: defaultUser, error: userError } = await supabase
        .from('users')
        .insert({
          username: 'admin',
          email: 'admin@dukafiti.com',
          password_hash: hashedPassword,
          phone: '+254700000000'
        })
        .select()
        .single();

      if (userError) {
        console.error('Error creating default user:', userError);
      } else {
        console.log('Created default user');
      }

      // Create sample products
      const sampleProducts = [
        {
          name: 'Rice 2kg',
          sku: 'RICE-2KG',
          description: 'Premium quality rice',
          price: 150.00,
          stock: 50,
          category: 'Grains',
          low_stock_threshold: 10
        },
        {
          name: 'Cooking Oil 1L',
          sku: 'OIL-1L',
          description: 'Pure vegetable cooking oil',
          price: 120.00,
          stock: 30,
          category: 'Cooking',
          low_stock_threshold: 5
        },
        {
          name: 'Sugar 1kg',
          sku: 'SUGAR-1KG',
          description: 'White refined sugar',
          price: 80.00,
          stock: 25,
          category: 'Baking',
          low_stock_threshold: 8
        },
        {
          name: 'Milk 1L',
          sku: 'MILK-1L',
          description: 'Fresh whole milk',
          price: 60.00,
          stock: 20,
          category: 'Dairy',
          low_stock_threshold: 5
        },
        {
          name: 'Bread',
          sku: 'BREAD-WHITE',
          description: 'White bread loaf',
          price: 45.00,
          stock: 15,
          category: 'Bakery',
          low_stock_threshold: 3
        }
      ];

      const { error: productsError } = await supabase
        .from('products')
        .insert(sampleProducts);

      if (productsError) {
        console.error('Error creating sample products:', productsError);
      } else {
        console.log('Created sample products');
      }

      // Create sample customers
      const sampleCustomers = [
        {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+254700123456',
          address: '123 Main St, Nairobi',
          balance: 0.00
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+254700654321',
          address: '456 Oak Ave, Mombasa',
          balance: 150.00
        },
        {
          name: 'Mary Wanjiku',
          email: 'mary@example.com',
          phone: '+254700111222',
          address: '789 Kenyatta Ave, Nakuru',
          balance: 75.50
        }
      ];

      const { error: customersError } = await supabase
        .from('customers')
        .insert(sampleCustomers);

      if (customersError) {
        console.error('Error creating sample customers:', customersError);
      } else {
        console.log('Created sample customers');
      }

      if (defaultUser) {
        // Create user settings
        const { error: settingsError } = await supabase
          .from('user_settings')
          .insert({
            user_id: defaultUser.id,
            theme: 'light',
            currency: 'KES',
            language: 'en',
            notifications: true
          });

        if (settingsError) {
          console.error('Error creating user settings:', settingsError);
        } else {
          console.log('Created user settings');
        }

        // Create sample notifications
        const sampleNotifications = [
          {
            user_id: defaultUser.id,
            title: 'Welcome to DukaFiti!',
            message: 'Your business management platform is ready to use.',
            type: 'success'
          },
          {
            user_id: defaultUser.id,
            title: 'Low Stock Alert',
            message: 'Some items are running low. Check your inventory.',
            type: 'warning'
          }
        ];

        const { error: notificationsError } = await supabase
          .from('notifications')
          .insert(sampleNotifications);

        if (notificationsError) {
          console.error('Error creating sample notifications:', notificationsError);
        } else {
          console.log('Created sample notifications');
        }
      }
    }

    console.log('Supabase database initialization completed!');
    
  } catch (error) {
    console.error('Supabase database initialization error:', error);
    throw error;
  }
}

// Run the initialization
initializeSupabaseDatabase()
  .then(() => {
    console.log('Database initialization successful');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database initialization failed:', error);
    process.exit(1);
  });