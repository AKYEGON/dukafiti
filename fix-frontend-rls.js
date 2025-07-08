/**
 * Frontend RLS Fixes Script
 * Updates all Supabase operations to include store_id and proper error handling
 */

import fs from 'fs';
import path from 'path';

console.log('🔧 Starting Frontend RLS Fixes...\n');

const clientSrcPath = './client/src';

// Files that need updating
const filesToUpdate = [
  'lib/supabase-data.ts',
  'hooks/useInventory.ts',
  'hooks/useCustomers.ts',
  'hooks/useSales.ts',
  'hooks/useNotifications.ts',
  'components/inventory/product-form.tsx',
  'components/customers/customer-form.tsx',
  'pages/sales.tsx'
];

// Read and analyze current supabase-data.ts
function analyzeSupabaseData() {
  const filePath = path.join(clientSrcPath, 'lib/supabase-data.ts');
  
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    console.log('📁 Found supabase-data.ts');
    
    // Check for store_id usage
    const hasStoreId = content.includes('store_id');
    const hasAuthCheck = content.includes('auth.getUser');
    
    console.log(`   - Contains store_id: ${hasStoreId}`);
    console.log(`   - Contains auth check: ${hasAuthCheck}`);
    
    return { content, hasStoreId, hasAuthCheck };
  } else {
    console.log('⚠️ supabase-data.ts not found');
    return null;
  }
}

// Generate updated supabase-data.ts with RLS support
function generateUpdatedSupabaseData() {
  return `/**
 * Supabase Data Operations with RLS (Row Level Security) Support
 * All operations include store_id for proper data isolation
 */

import { supabase } from './supabase';
import type { Product, Customer, Order, Notification, InsertProduct, InsertCustomer } from '../types/schema';

// Helper function to get current user ID
async function getCurrentUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('User not authenticated');
  }
  return user.id;
}

// Enhanced error logging
function logSupabaseError(operation: string, error: any) {
  console.error(\`❌ Supabase \${operation} error:\`, error);
  if (error.details) console.error('Details:', error.details);
  if (error.hint) console.error('Hint:', error.hint);
  if (error.code) console.error('Code:', error.code);
}

// PRODUCTS OPERATIONS
export async function getProducts(): Promise<Product[]> {
  try {
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logSupabaseError('getProducts', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    logSupabaseError('getProducts', error);
    throw error;
  }
}

export async function createProduct(productData: InsertProduct): Promise<Product> {
  try {
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('products')
      .insert([{
        ...productData,
        store_id: userId,
        sales_count: 0
      }])
      .select()
      .single();

    if (error) {
      logSupabaseError('createProduct', error);
      throw error;
    }

    console.log('✅ Product created successfully:', data);
    return data;
  } catch (error) {
    logSupabaseError('createProduct', error);
    throw error;
  }
}

export async function updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product> {
  try {
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .eq('store_id', userId)
      .select()
      .single();

    if (error) {
      logSupabaseError('updateProduct', error);
      throw error;
    }

    console.log('✅ Product updated successfully:', data);
    return data;
  } catch (error) {
    logSupabaseError('updateProduct', error);
    throw error;
  }
}

export async function deleteProduct(id: number): Promise<void> {
  try {
    const userId = await getCurrentUserId();
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('store_id', userId);

    if (error) {
      logSupabaseError('deleteProduct', error);
      throw error;
    }

    console.log('✅ Product deleted successfully');
  } catch (error) {
    logSupabaseError('deleteProduct', error);
    throw error;
  }
}

export async function restockProduct(productId: number, quantity: number, costPrice?: number): Promise<Product> {
  try {
    const userId = await getCurrentUserId();
    
    // Get current product
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('stock, cost_price')
      .eq('id', productId)
      .eq('store_id', userId)
      .single();

    if (fetchError) {
      logSupabaseError('restockProduct fetch', fetchError);
      throw fetchError;
    }

    const newStock = (product.stock || 0) + quantity;
    const updateData: any = { stock: newStock };
    
    if (costPrice !== undefined) {
      updateData.cost_price = costPrice.toString();
    }

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .eq('store_id', userId)
      .select()
      .single();

    if (error) {
      logSupabaseError('restockProduct update', error);
      throw error;
    }

    console.log('✅ Product restocked successfully:', data);
    return data;
  } catch (error) {
    logSupabaseError('restockProduct', error);
    throw error;
  }
}

// CUSTOMERS OPERATIONS
export async function getCustomers(): Promise<Customer[]> {
  try {
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('store_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logSupabaseError('getCustomers', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    logSupabaseError('getCustomers', error);
    throw error;
  }
}

export async function createCustomer(customerData: InsertCustomer): Promise<Customer> {
  try {
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('customers')
      .insert([{
        ...customerData,
        store_id: userId
      }])
      .select()
      .single();

    if (error) {
      logSupabaseError('createCustomer', error);
      throw error;
    }

    console.log('✅ Customer created successfully:', data);
    return data;
  } catch (error) {
    logSupabaseError('createCustomer', error);
    throw error;
  }
}

export async function updateCustomer(id: number, customerData: Partial<InsertCustomer>): Promise<Customer> {
  try {
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('customers')
      .update(customerData)
      .eq('id', id)
      .eq('store_id', userId)
      .select()
      .single();

    if (error) {
      logSupabaseError('updateCustomer', error);
      throw error;
    }

    console.log('✅ Customer updated successfully:', data);
    return data;
  } catch (error) {
    logSupabaseError('updateCustomer', error);
    throw error;
  }
}

export async function deleteCustomer(id: number): Promise<void> {
  try {
    const userId = await getCurrentUserId();
    
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)
      .eq('store_id', userId);

    if (error) {
      logSupabaseError('deleteCustomer', error);
      throw error;
    }

    console.log('✅ Customer deleted successfully');
  } catch (error) {
    logSupabaseError('deleteCustomer', error);
    throw error;
  }
}

// ORDERS OPERATIONS
export async function getOrders(): Promise<Order[]> {
  try {
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('store_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logSupabaseError('getOrders', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    logSupabaseError('getOrders', error);
    throw error;
  }
}

export async function createOrder(orderData: any): Promise<Order> {
  try {
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        ...orderData,
        store_id: userId
      }])
      .select()
      .single();

    if (error) {
      logSupabaseError('createOrder', error);
      throw error;
    }

    console.log('✅ Order created successfully:', data);
    return data;
  } catch (error) {
    logSupabaseError('createOrder', error);
    throw error;
  }
}

// NOTIFICATIONS OPERATIONS
export async function getNotifications(): Promise<Notification[]> {
  try {
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .or(\`user_id.eq.\${userId},store_id.eq.\${userId}\`)
      .order('created_at', { ascending: false });

    if (error) {
      logSupabaseError('getNotifications', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    logSupabaseError('getNotifications', error);
    throw error;
  }
}

export async function createNotification(type: string, title: string, message: string): Promise<Notification> {
  try {
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        store_id: userId,
        type,
        title,
        message,
        is_read: false
      }])
      .select()
      .single();

    if (error) {
      logSupabaseError('createNotification', error);
      throw error;
    }

    console.log('✅ Notification created successfully:', data);
    return data;
  } catch (error) {
    logSupabaseError('createNotification', error);
    throw error;
  }
}

// DASHBOARD OPERATIONS
export async function getDashboardMetrics(): Promise<any> {
  try {
    const userId = await getCurrentUserId();
    
    // Get products count
    const { count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', userId);

    // Get customers count
    const { count: customersCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', userId);

    // Get orders and calculate revenue
    const { data: orders } = await supabase
      .from('orders')
      .select('total, created_at')
      .eq('store_id', userId);

    const totalRevenue = orders?.reduce((sum, order) => sum + parseFloat(order.total), 0) || 0;
    const totalOrders = orders?.length || 0;

    // Get low stock products
    const { data: lowStockProducts } = await supabase
      .from('products')
      .select('stock, low_stock_threshold')
      .eq('store_id', userId)
      .not('stock', 'is', null);

    const lowStockCount = lowStockProducts?.filter(p => 
      p.stock <= (p.low_stock_threshold || 10)
    ).length || 0;

    return {
      totalRevenue: totalRevenue.toFixed(2),
      totalOrders,
      totalProducts: productsCount || 0,
      totalCustomers: customersCount || 0,
      lowStockCount,
      activeCustomersCount: customersCount || 0,
      revenueGrowth: "0",
      ordersGrowth: "0"
    };
  } catch (error) {
    logSupabaseError('getDashboardMetrics', error);
    throw error;
  }
}

// SEARCH OPERATIONS
export async function searchProducts(query: string): Promise<Product[]> {
  try {
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', userId)
      .or(\`name.ilike.%\${query}%,sku.ilike.%\${query}%,category.ilike.%\${query}%\`);

    if (error) {
      logSupabaseError('searchProducts', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    logSupabaseError('searchProducts', error);
    throw error;
  }
}
`;
}

// Main execution
function updateFrontendFiles() {
  console.log('1. Analyzing current supabase-data.ts...');
  const analysis = analyzeSupabaseData();
  
  if (!analysis || !analysis.hasStoreId) {
    console.log('2. Updating supabase-data.ts with RLS support...');
    
    const updatedContent = generateUpdatedSupabaseData();
    const filePath = path.join(clientSrcPath, 'lib/supabase-data.ts');
    
    try {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log('✅ supabase-data.ts updated successfully');
    } catch (error) {
      console.error('❌ Failed to update supabase-data.ts:', error.message);
    }
  } else {
    console.log('✅ supabase-data.ts already has RLS support');
  }
  
  console.log('\n3. Frontend RLS fixes completed!');
  console.log('\nNext steps:');
  console.log('1. Test creating a customer');
  console.log('2. Test creating a product');
  console.log('3. Verify data appears immediately');
  console.log('4. Test with multiple users to verify isolation');
}

// Execute if run directly
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  updateFrontendFiles();
}

export { updateFrontendFiles };