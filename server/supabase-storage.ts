import { 
  Product, 
  InsertProduct, 
  Customer, 
  InsertCustomer, 
  Order, 
  InsertOrder, 
  OrderItem, 
  InsertOrderItem,
  User, 
  InsertUser,
  BusinessProfile,
  InsertBusinessProfile,
  Payment,
  InsertPayment,
  StoreProfile,
  InsertStoreProfile,
  UserSettings,
  InsertUserSettings,
  Notification,
  InsertNotification,
  DashboardMetrics,
  SearchResult
} from "@shared/schema";
import { createClient } from '@supabase/supabase-js';
import { IStorage } from "./storage";

// Initialize Supabase client
let supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Fix URL if it's a database connection string
if (supabaseUrl.includes('postgresql://')) {
  const match = supabaseUrl.match(/db\.([^.]+)\.supabase\.co/);
  if (match) {
    supabaseUrl = `https://${match[1]}.supabase.co`;
  }
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export class SupabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return undefined;
    return data as User;
  }

  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) throw error;
    return data as User[];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error) return undefined;
    return data as User;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();
    
    if (error) return undefined;
    return data as User;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) return undefined;
    
    // Map snake_case back to camelCase
    return {
      id: data.id,
      username: data.username,
      email: data.email,
      passwordHash: data.password_hash,
      phone: data.phone,
      createdAt: data.created_at
    } as User;
  }

  async createUser(user: InsertUser): Promise<User> {
    // Map camelCase to snake_case for database
    const dbUser = {
      username: user.username,
      email: user.email,
      password_hash: user.passwordHash,
      phone: user.phone
    };
    
    const { data, error } = await supabase
      .from('users')
      .insert(dbUser)
      .select('*')
      .single();
    
    if (error) throw error;
    
    // Map snake_case back to camelCase
    return {
      id: data.id,
      username: data.username,
      email: data.email,
      passwordHash: data.password_hash,
      phone: data.phone,
      createdAt: data.created_at
    } as User;
  }

  // Products
  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Product[];
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return undefined;
    return data as Product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select('*')
      .single();
    
    if (error) throw error;
    return data as Product;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const { data, error } = await supabase
      .from('products')
      .update(product)
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) return undefined;
    return data as Product;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  async getFrequentProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('sales_count', { ascending: false })
      .limit(6);
    
    if (error) throw error;
    return data as Product[];
  }

  async searchProducts(query: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%,category.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(8);
    
    if (error) throw error;
    return data as Product[];
  }

  async updateProductStock(id: number, newStock: number): Promise<Product | undefined> {
    return await this.updateProduct(id, { stock: newStock });
  }

  async incrementProductSalesCount(id: number, quantity: number): Promise<Product | undefined> {
    const product = await this.getProduct(id);
    if (!product) return undefined;
    
    const newSalesCount = (product.salesCount || 0) + quantity;
    return await this.updateProduct(id, { salesCount: newSalesCount });
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Customer[];
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return undefined;
    return data as Customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .insert(customer)
      .select('*')
      .single();
    
    if (error) throw error;
    return data as Customer;
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const { data, error } = await supabase
      .from('customers')
      .update(customer)
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) return undefined;
    return data as Customer;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  async getCustomerByNameOrPhone(name: string, phone?: string): Promise<Customer | undefined> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`name.eq.${name}${phone ? `,phone.eq.${phone}` : ''}`)
      .single();
    
    if (error) return undefined;
    return data as Customer;
  }

  async updateCustomerBalance(customerId: number, amountChange: number): Promise<Customer | undefined> {
    const customer = await this.getCustomer(customerId);
    if (!customer) return undefined;
    
    const currentBalance = parseFloat(customer.balance || "0");
    const newBalance = currentBalance + amountChange;
    
    return await this.updateCustomer(customerId, { balance: newBalance.toFixed(2) });
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Order[];
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return undefined;
    return data as Order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .insert(order)
      .select('*')
      .single();
    
    if (error) throw error;
    return data as Order;
  }

  async getOrdersWithItems(): Promise<any[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (name, price)
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as any[];
  }

  async getRecentOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) throw error;
    return data as Order[];
  }

  async getOrderByReference(reference: string): Promise<Order | undefined> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('reference', reference)
      .single();
    
    if (error) return undefined;
    return data as Order;
  }

  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const { data, error } = await supabase
      .from('orders')
      .update(order)
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) return undefined;
    return data as Order;
  }

  // Order Items
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);
    
    if (error) throw error;
    return data as OrderItem[];
  }

  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const { data, error } = await supabase
      .from('order_items')
      .insert(orderItem)
      .select('*')
      .single();
    
    if (error) throw error;
    return data as OrderItem;
  }

  // Payments
  async getPayments(): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Payment[];
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .insert(payment)
      .select('*')
      .single();
    
    if (error) throw error;
    return data as Payment;
  }

  // Business Profiles
  async getBusinessProfile(userId: number): Promise<BusinessProfile | undefined> {
    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) return undefined;
    return data as BusinessProfile;
  }

  async createBusinessProfile(profile: InsertBusinessProfile): Promise<BusinessProfile> {
    const { data, error } = await supabase
      .from('business_profiles')
      .insert(profile)
      .select('*')
      .single();
    
    if (error) throw error;
    return data as BusinessProfile;
  }

  // Store Profiles
  async getStoreProfile(userId: number): Promise<StoreProfile | undefined> {
    const { data, error } = await supabase
      .from('store_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) return undefined;
    return data as StoreProfile;
  }

  async createStoreProfile(profile: InsertStoreProfile): Promise<StoreProfile> {
    const { data, error } = await supabase
      .from('store_profiles')
      .insert(profile)
      .select('*')
      .single();
    
    if (error) throw error;
    return data as StoreProfile;
  }

  async updateStoreProfile(userId: number, profile: Partial<InsertStoreProfile>): Promise<StoreProfile | undefined> {
    const { data, error } = await supabase
      .from('store_profiles')
      .update(profile)
      .eq('user_id', userId)
      .select('*')
      .single();
    
    if (error) return undefined;
    return data as StoreProfile;
  }

  // User Settings
  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) return undefined;
    return data as UserSettings;
  }

  async createUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    const { data, error } = await supabase
      .from('user_settings')
      .insert(settings)
      .select('*')
      .single();
    
    if (error) throw error;
    return data as UserSettings;
  }

  async updateUserSettings(userId: number, settings: Partial<InsertUserSettings>): Promise<UserSettings | undefined> {
    const { data, error } = await supabase
      .from('user_settings')
      .update(settings)
      .eq('user_id', userId)
      .select('*')
      .single();
    
    if (error) return undefined;
    return data as UserSettings;
  }

  // Notifications
  async getNotifications(userId: number): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Notification[];
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select('*')
      .single();
    
    if (error) throw error;
    return data as Notification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    
    return !error;
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    
    if (error) return 0;
    return count || 0;
  }

  // Dashboard Metrics
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    // Get total revenue from orders
    const { data: revenueData } = await supabase
      .from('orders')
      .select('total')
      .eq('status', 'paid');

    const totalRevenue = revenueData?.reduce((sum, order) => sum + parseFloat(order.total), 0) || 0;

    // Get total orders count
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    // Get total products count
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    // Get total customers count
    const { count: totalCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    // Get low stock products count
    const { count: lowStockCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .not('stock', 'is', null)
      .lt('stock', 'low_stock_threshold');

    // Get active customers (those with recent orders or outstanding balance)
    const { count: activeCustomersCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .gt('balance', 0);

    return {
      totalRevenue: totalRevenue.toFixed(2),
      totalOrders: totalOrders || 0,
      totalProducts: totalProducts || 0,
      totalCustomers: totalCustomers || 0,
      revenueGrowth: "0.00", // Simplified for now
      ordersGrowth: "0.00",  // Simplified for now
      lowStockCount: lowStockCount || 0,
      activeCustomersCount: activeCustomersCount || 0
    };
  }

  // Search functionality
  async search(query: string): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    // Search products
    const { data: products } = await supabase
      .from('products')
      .select('id, name, sku, price')
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
      .limit(3);

    if (products) {
      results.push(...products.map(p => ({
        id: p.id,
        type: 'product' as const,
        name: p.name,
        subtitle: `SKU: ${p.sku} - KES ${p.price}`,
        url: `/inventory`
      })));
    }

    // Search customers
    const { data: customers } = await supabase
      .from('customers')
      .select('id, name, email, phone')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
      .limit(3);

    if (customers) {
      results.push(...customers.map(c => ({
        id: c.id,
        type: 'customer' as const,
        name: c.name,
        subtitle: c.email || c.phone || '',
        url: `/customers`
      })));
    }

    return results;
  }

  // Reports functionality
  async getReportsSummary(period: string = '7d'): Promise<any> {
    // Simplified implementation
    const metrics = await this.getDashboardMetrics();
    return {
      totalRevenue: metrics.totalRevenue,
      totalOrders: metrics.totalOrders,
      averageOrderValue: metrics.totalOrders > 0 ? (parseFloat(metrics.totalRevenue) / metrics.totalOrders).toFixed(2) : "0.00"
    };
  }

  async getReportsTrend(period: string = '7d'): Promise<any[]> {
    // Simplified implementation - return empty array for now
    return [];
  }

  async getTopCustomers(period: string = '7d'): Promise<any[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, balance')
      .gt('balance', 0)
      .order('balance', { ascending: false })
      .limit(5);

    if (error) return [];
    return data || [];
  }

  async getTopProducts(period: string = '7d'): Promise<any[]> {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, sales_count')
      .order('sales_count', { ascending: false })
      .limit(5);

    if (error) return [];
    return data || [];
  }

  // Additional missing methods for interface compliance
  async deleteOrder(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  async getAllOrderItems(): Promise<OrderItem[]> {
    const { data, error } = await supabase
      .from('order_items')
      .select('*');
    
    if (error) throw error;
    return data as OrderItem[];
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return undefined;
    return data as Payment;
  }

  async getPaymentsByCustomer(customerId: number): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('customer_id', customerId);
    
    if (error) throw error;
    return data as Payment[];
  }

  async getBusinessProfile(userId: number): Promise<BusinessProfile | undefined> {
    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) return undefined;
    return data as BusinessProfile;
  }

  async saveBusinessProfile(profile: any): Promise<BusinessProfile> {
    const { data, error } = await supabase
      .from('business_profiles')
      .upsert(profile)
      .select('*')
      .single();
    
    if (error) throw error;
    return data as BusinessProfile;
  }

  async saveStoreProfile(profile: any): Promise<StoreProfile> {
    const { data, error } = await supabase
      .from('store_profiles')
      .upsert(profile)
      .select('*')
      .single();
    
    if (error) throw error;
    return data as StoreProfile;
  }

  async saveUserSettings(settings: any): Promise<UserSettings> {
    const { data, error } = await supabase
      .from('user_settings')
      .upsert(settings)
      .select('*')
      .single();
    
    if (error) throw error;
    return data as UserSettings;
  }

  async getDetailedDashboardMetrics(userId: number): Promise<DashboardMetrics> {
    return await this.getDashboardMetrics();
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    
    return !error;
  }

  async deleteNotification(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    
    return !error;
  }
}

// Export the instance
export const storage = new SupabaseStorage();