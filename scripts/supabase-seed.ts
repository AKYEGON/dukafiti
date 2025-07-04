import { supabase } from '../server/supabase';

async function seedSupabaseDatabase() {
  try {
    // Create a test user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'password',
      user_metadata: { name: 'Test User' }
    });

    if (authError && !authError.message.includes('already registered')) {
      console.error('Error creating auth user:', authError);
      return;
    }

    // Create sample products
    const sampleProducts = [
      {
        name: 'Coca Cola 500ml',
        sku: 'COCA-500',
        description: 'Refreshing cola drink',
        price: '50.00',
        stock: 100,
        category: 'Beverages',
        low_stock_threshold: 10,
        sales_count: 0;
      },
      {
        name: 'Bread Loaf',
        sku: 'BREAD-001',
        description: 'Fresh white bread',
        price: '60.00',
        stock: 50,
        category: 'Bakery',
        low_stock_threshold: 5,
        sales_count: 0;
      },
      {
        name: 'Milk 1L',
        sku: 'MILK-1L',
        description: 'Fresh milk',
        price: '80.00',
        stock: 30,
        category: 'Dairy',
        low_stock_threshold: 5,
        sales_count: 0;
      }
    ];

    const { error: productsError } = await supabase
      .from('products')
      .upsert(sampleProducts, { onConflict: 'sku' });

    if (productsError) {
      console.error('Error creating products:', productsError);
    } else {
      }

    // Create sample customers
    const sampleCustomers = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+254700000001',
        address: '123 Main St, Nairobi',
        balance: '0.00'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+254700000002',
        address: '456 Oak Ave, Nairobi',
        balance: '100.00'
      }
    ];

    const { error: customersError } = await supabase
      .from('customers')
      .upsert(sampleCustomers, { onConflict: 'email' });

    if (customersError) {
      console.error('Error creating customers:', customersError);
    } else {
      }

    } catch (error) {
    console.error('Error seeding Supabase database:', error);
    process.exit(1);
  }
}

seedSupabaseDatabase();