import { supabase } from '../server/supabase';

async function seedDatabase() {
  try {
    // Create a default user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'password',
      user_metadata: { name: 'Test User' }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return;
    }

    // Create user profile in database
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([{
        email: 'test@example.com',
        username: 'test',
        passwordHash: 'managed_by_supabase',
        phone: '+254700000000'
      }])
      .select()
      .single();

    if (userError) {
      console.error('Error creating user profile:', userError);
      return;
    }

    // Create store profile
    const { error: storeError } = await supabase
      .from('store_profiles')
      .insert([{
        userId: user.id,
        storeName: 'DukaFiti Demo Store',
        ownerName: 'Test User',
        storeType: 'retail',
        location: 'Nairobi, Kenya',
        description: 'A sample retail store'
      }]);

    if (storeError) {
      console.error('Error creating store profile:', storeError);
    }

    // Create user settings
    const { error: settingsError } = await supabase
      .from('user_settings')
      .insert([{
        userId: user.id,
        theme: 'light',
        currency: 'KES',
        language: 'en',
        notifications: true;
      }]);

    if (settingsError) {
      console.error('Error creating user settings:', settingsError);
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
        lowStockThreshold: 10,
        salesCount: 0;
      },
      {
        name: 'Bread Loaf',
        sku: 'BREAD-001',
        description: 'Fresh white bread',
        price: '60.00',
        stock: 50,
        category: 'Bakery',
        lowStockThreshold: 5,
        salesCount: 0;
      },
      {
        name: 'Milk 1L',
        sku: 'MILK-1L',
        description: 'Fresh milk',
        price: '80.00',
        stock: 30,
        category: 'Dairy',
        lowStockThreshold: 5,
        salesCount: 0;
      }
    ];

    const { error: productsError } = await supabase
      .from('products')
      .insert(sampleProducts);

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
      .insert(sampleCustomers);

    if (customersError) {
      console.error('Error creating customers:', customersError);
    } else {
      }

    } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();