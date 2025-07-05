import { supabase } from '../supabaseClient';

// Check if in development mode without Supabase credentials
const isDevelopmentMode = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return import.meta.env.DEV && (!supabaseUrl || !supabaseAnonKey);
};

// Product operations
export const getProducts = async () => {
  // Development mode fallback
  if (isDevelopmentMode()) {
    console.warn('Development mode: Loading demo products');
    const demoProducts = JSON.parse(localStorage.getItem('demo_products') || '[]');
    
    // Add some default demo products if none exist
    if (demoProducts.length === 0) {
      const defaultProducts = [
        {
          id: 1,
          name: "Demo Coca Cola 500ml",
          sku: "DEMO-COCA-500",
          description: "Demo refreshing cola drink",
          price: "50.00",
          stock: 100,
          category: "Beverages",
          low_stock_threshold: 10,
          sales_count: 5,
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          name: "Demo Bread Loaf",
          sku: "DEMO-BREAD-001",
          description: "Demo fresh white bread",
          price: "60.00",
          stock: null,
          category: "Bakery",
          low_stock_threshold: null,
          sales_count: 3,
          created_at: new Date().toISOString(),
        }
      ];
      localStorage.setItem('demo_products', JSON.stringify(defaultProducts));
      return defaultProducts;
    }
    
    return demoProducts;
  }
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const createProduct = async (product: any) => {
  try {
    console.log('Supabase createProduct called with:', product);
    
    // Development mode fallback
    if (isDevelopmentMode()) {
      console.warn('Development mode: Simulating product creation');
      const mockProduct = {
        id: Math.floor(Math.random() * 1000),
        name: product.name,
        sku: product.sku,
        description: product.description || null,
        price: product.price,
        stock: product.unknownQuantity ? null : product.stock,
        category: product.category || 'General',
        low_stock_threshold: product.unknownQuantity ? null : (product.lowStockThreshold || 10),
        sales_count: 0,
        created_at: new Date().toISOString(),
      };
      
      // Store in localStorage for demo purposes
      const existingProducts = JSON.parse(localStorage.getItem('demo_products') || '[]');
      existingProducts.push(mockProduct);
      localStorage.setItem('demo_products', JSON.stringify(existingProducts));
      
      console.log('Demo product created:', mockProduct);
      return mockProduct;
    }
    
    const insertData = {
      name: product.name,
      sku: product.sku,
      description: product.description || null,
      price: product.price,
      stock: product.unknownQuantity ? null : product.stock,
      category: product.category || 'General',
      low_stock_threshold: product.unknownQuantity ? null : (product.lowStockThreshold || 10),
      sales_count: 0,
    };
    
    console.log('Insert data for Supabase:', insertData);
    
    const { data, error } = await supabase
      .from('products')
      .insert([insertData])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase insert error:', error);
      throw new Error(error.message || 'Failed to create product in database');
    }
    
    console.log('Product created in Supabase:', data);
    return data;
  } catch (error) {
    console.error('CreateProduct function error:', error);
    throw error;
  }
};

export const updateProduct = async (id: number, updates: any) => {
  // Development mode fallback
  if (isDevelopmentMode()) {
    console.warn('Development mode: Simulating product update');
    const existingProducts = JSON.parse(localStorage.getItem('demo_products') || '[]');
    const updatedProducts = existingProducts.map((product: any) => {
      if (product.id === id) {
        return {
          ...product,
          name: updates.name,
          sku: updates.sku,
          description: updates.description,
          price: updates.price,
          stock: updates.unknownQuantity ? null : updates.stock,
          category: updates.category,
          low_stock_threshold: updates.unknownQuantity ? null : updates.lowStockThreshold,
        };
      }
      return product;
    });
    localStorage.setItem('demo_products', JSON.stringify(updatedProducts));
    const updatedProduct = updatedProducts.find((p: any) => p.id === id);
    console.log('Demo product updated:', updatedProduct);
    return updatedProduct;
  }
  
  const { data, error } = await supabase
    .from('products')
    .update({
      name: updates.name,
      sku: updates.sku,
      description: updates.description,
      price: updates.price,
      stock: updates.unknownQuantity ? null : updates.stock,
      category: updates.category,
      low_stock_threshold: updates.unknownQuantity ? null : updates.lowStockThreshold,
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteProduct = async (id: number) => {
  // Development mode fallback
  if (isDevelopmentMode()) {
    console.warn('Development mode: Simulating product deletion');
    const existingProducts = JSON.parse(localStorage.getItem('demo_products') || '[]');
    const filteredProducts = existingProducts.filter((product: any) => product.id !== id);
    localStorage.setItem('demo_products', JSON.stringify(filteredProducts));
    console.log('Demo product deleted:', id);
    return;
  }
  
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Customer operations
export const getCustomers = async () => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const createCustomer = async (customer: any) => {
  const { data, error } = await supabase
    .from('customers')
    .insert([{
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      balance: customer.balance || 0,
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateCustomer = async (id: number, updates: any) => {
  const { data, error } = await supabase
    .from('customers')
    .update({
      name: updates.name,
      email: updates.email,
      phone: updates.phone,
      balance: updates.balance,
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Order operations
export const getOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const createOrder = async (order: any) => {
  const { data, error } = await supabase
    .from('orders')
    .insert([{
      customer_id: order.customerId,
      customer_name: order.customerName,
      total: order.total,
      status: order.status || 'completed',
      payment_method: order.paymentMethod || 'cash',
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const createOrderItem = async (orderItem: any) => {
  const { data, error } = await supabase
    .from('order_items')
    .insert([{
      order_id: orderItem.orderId,
      product_id: orderItem.productId,
      product_name: orderItem.productName,
      quantity: orderItem.quantity,
      price: orderItem.price,
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};



// Search functionality
export const searchProducts = async (query: string) => {
  if (!query) return [];
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .or(`name.ilike.%${query}%,sku.ilike.%${query}%,category.ilike.%${query}%`)
    .limit(8);
  
  if (error) throw error;
  return data;
};

// Dashboard metrics functions
export const getDashboardMetrics = async () => {
  try {
    console.log('Fetching dashboard metrics...');
    
    // Get total revenue from orders
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('total, created_at');
    
    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      // If table doesn't exist, return empty metrics instead of throwing
      if (ordersError.message.includes('relation "orders" does not exist')) {
        console.warn('Orders table does not exist, returning empty metrics');
        return {
          totalRevenue: '0',
          totalOrders: 0,
          totalProducts: 0,
          totalCustomers: 0,
          lowStockItems: 0,
          activeCustomersCount: 0,
        };
      }
      throw ordersError;
    }

    // Get total products count
    const { count: totalProducts, error: productsError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    if (productsError) throw productsError;

    // Get total customers count
    const { count: totalCustomers, error: customersError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
    
    if (customersError) throw customersError;

    // Get low stock count
    const { data: lowStockData, error: lowStockError } = await supabase
      .from('products')
      .select('id, stock, low_stock_threshold')
      .not('stock', 'is', null);
    
    if (lowStockError) throw lowStockError;

    // Calculate metrics
    const totalRevenue = ordersData?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
    const totalOrders = ordersData?.length || 0;
    const lowStockCount = lowStockData?.filter(product => 
      product.stock !== null && 
      product.stock <= (product.low_stock_threshold || 10)
    ).length || 0;

    // Calculate today's data for growth
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysOrders = ordersData?.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= today;
    }) || [];

    return {
      totalRevenue: totalRevenue.toFixed(2),
      totalOrders,
      totalProducts: totalProducts || 0,
      totalCustomers: totalCustomers || 0,
      revenueGrowth: "0.0", // Simplified for now
      ordersGrowth: "0.0", // Simplified for now
      lowStockCount,
      activeCustomersCount: totalCustomers || 0
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    // Return default values if there's an error
    return {
      totalRevenue: "0.00",
      totalOrders: 0,
      totalProducts: 0,
      totalCustomers: 0,
      revenueGrowth: "0.0",
      ordersGrowth: "0.0",
      lowStockCount: 0,
      activeCustomersCount: 0
    };
  }
};

export const getRecentOrders = async () => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers(name),
        order_items(*, products(name))
      `)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    return [];
  }
};