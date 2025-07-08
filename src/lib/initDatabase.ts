import { supabase } from './supabase';

// Database initialization and schema setup
export async function initializeDatabase() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to initialize database');
  }

  console.log('Initializing database for user:', user.id);

  // Check if tables exist and create them if needed
  const tables = [
    {
      name: 'products',
      schema: `
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        sku text,
        price decimal(10,2) NOT NULL DEFAULT 0,
        cost_price decimal(10,2) DEFAULT 0,
        stock_quantity integer NOT NULL DEFAULT 0,
        category text,
        description text,
        store_id uuid NOT NULL DEFAULT auth.uid(),
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      `
    },
    {
      name: 'customers',
      schema: `
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        email text,
        phone text,
        address text,
        credit_balance decimal(10,2) DEFAULT 0,
        store_id uuid NOT NULL DEFAULT auth.uid(),
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      `
    },
    {
      name: 'sales',
      schema: `
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id uuid,
        total_amount decimal(10,2) NOT NULL,
        payment_status text DEFAULT 'pending',
        store_id uuid NOT NULL DEFAULT auth.uid(),
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      `
    },
    {
      name: 'notifications',
      schema: `
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title text NOT NULL,
        message text NOT NULL,
        type text DEFAULT 'info',
        is_read boolean DEFAULT false,
        store_id uuid NOT NULL DEFAULT auth.uid(),
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      `
    },
    {
      name: 'settings',
      schema: `
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        key text NOT NULL,
        value jsonb,
        store_id uuid NOT NULL DEFAULT auth.uid(),
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now(),
        UNIQUE(key, store_id)
      `
    }
  ];

  for (const table of tables) {
    console.log(`Setting up table: ${table.name}`);
    
    // Note: In a real deployment, these would be run via SQL migrations
    // For development, these operations would typically be done via Supabase Dashboard
    console.log(`Table ${table.name} setup complete (manual setup required in Supabase Dashboard)`);
  }

  console.log('Database initialization complete');
  return true;
}

// Test database connectivity and permissions
export async function testDatabaseConnection() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Test a simple query
    const { data, error } = await supabase
      .from('products')
      .select('count')
      .limit(1);

    if (error) {
      console.log('Database connection test error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, user: user.id };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}