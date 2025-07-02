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
  SearchResult,
  products,
  customers,
  orders,
  orderItems,
  users,
  businessProfiles,
  payments,
  storeProfiles,
  userSettings,
  notifications
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, sql, or, ilike, and, gte, isNotNull } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  updateProductStock(id: number, stockChange: number): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  searchProducts(query: string): Promise<Product[]>;
  getFrequentProducts(): Promise<Array<{ id: number; name: string; price: string }>>;
  incrementProductSalesCount(id: number, quantity: number): Promise<Product | undefined>;

  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  getCustomerByNameOrPhone(name: string, phone?: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  updateCustomerBalance(id: number, amount: number): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;

  // Orders
  getOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrderByReference(reference: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;
  getRecentOrders(limit?: number): Promise<Order[]>;

  // Order Items
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  getAllOrderItems(): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;

  // Payments
  getPayments(): Promise<Payment[]>;
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentsByCustomer(customerId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;

  // Dashboard
  getDashboardMetrics(): Promise<DashboardMetrics>;
  getDetailedDashboardMetrics(): Promise<{
    revenue: {
      today: number;
      yesterday: number;
      weekToDate: number;
      priorWeekToDate: number;
    };
    orders: {
      today: number;
      yesterday: number;
    };
    inventory: {
      totalItems: number;
      priorSnapshot: number;
    };
    customers: {
      active: number;
      priorActive: number;
    };
  }>;

  // Business Profile
  saveBusinessProfile(userId: number, profile: Omit<InsertBusinessProfile, 'userId'>): Promise<void>;
  getBusinessProfile(userId: number): Promise<BusinessProfile | undefined>;

  // Store Profile
  getStoreProfile(userId: number): Promise<StoreProfile | undefined>;
  saveStoreProfile(userId: number, profile: Omit<InsertStoreProfile, 'userId'>): Promise<StoreProfile>;
  updateStoreProfile(userId: number, profile: Partial<Omit<InsertStoreProfile, 'userId'>>): Promise<StoreProfile | undefined>;

  // User Settings
  getUserSettings(userId: number): Promise<UserSettings | undefined>;
  saveUserSettings(userId: number, settings: Omit<InsertUserSettings, 'userId'>): Promise<UserSettings>;
  updateUserSettings(userId: number, settings: Partial<Omit<InsertUserSettings, 'userId'>>): Promise<UserSettings | undefined>;

  // Notifications
  getNotifications(userId: number, limit?: number): Promise<Notification[]>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;
  deleteNotification(id: number): Promise<boolean>;

  // Search
  globalSearch(query: string): Promise<SearchResult[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async updateProduct(id: number, productUpdate: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db.update(products)
      .set(productUpdate)
      .where(eq(products.id, id))
      .returning();
    return product || undefined;
  }

  async updateProductStock(id: number, stockChange: number): Promise<Product | undefined> {
    const [product] = await db.update(products)
      .set({ stock: sql`${products.stock} + ${stockChange}` })
      .where(eq(products.id, id))
      .returning();
    return product || undefined;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return result.rowCount! > 0;
  }

  async searchProducts(query: string): Promise<Product[]> {
    return await db.select().from(products).where(
      or(
        ilike(products.name, `%${query}%`),
        ilike(products.sku, `%${query}%`),
        ilike(products.category, `%${query}%`)
      )
    );
  }

  async getFrequentProducts(): Promise<Array<{ id: number; name: string; price: string }>> {
    const result = await db.select({
      id: products.id,
      name: products.name,
      price: products.price
    })
    .from(products)
    .where(sql`${products.salesCount} > 0`)
    .orderBy(desc(products.salesCount))
    .limit(10);
    
    return result;
  }

  async incrementProductSalesCount(id: number, quantity: number): Promise<Product | undefined> {
    const [product] = await db.update(products)
      .set({ salesCount: sql`${products.salesCount} + ${quantity}` })
      .where(eq(products.id, id))
      .returning();
    return product || undefined;
  }

  // Customer methods
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async getCustomerByNameOrPhone(name: string, phone?: string): Promise<Customer | undefined> {
    let whereClause = eq(customers.name, name);
    if (phone) {
      whereClause = or(eq(customers.name, name), eq(customers.phone, phone))!;
    }
    
    const [customer] = await db.select().from(customers).where(whereClause);
    return customer || undefined;
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    console.log("=== STORAGE CREATE CUSTOMER DEBUG ===");
    console.log("Data being inserted to DB:", insertCustomer);
    console.log("Balance field in storage:", insertCustomer.balance);
    console.log("Balance type in storage:", typeof insertCustomer.balance);
    
    const [customer] = await db.insert(customers).values(insertCustomer).returning();
    
    console.log("Customer returned from DB:", customer);
    console.log("Balance in returned customer:", customer.balance);
    console.log("=== END STORAGE DEBUG ===");
    return customer;
  }

  async updateCustomer(id: number, customerUpdate: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [customer] = await db.update(customers)
      .set(customerUpdate)
      .where(eq(customers.id, id))
      .returning();
    return customer || undefined;
  }

  async updateCustomerBalance(id: number, amount: number): Promise<Customer | undefined> {
    const [customer] = await db.update(customers)
      .set({ balance: sql`${customers.balance} + ${amount}` })
      .where(eq(customers.id, id))
      .returning();
    return customer || undefined;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id));
    return result.rowCount! > 0;
  }

  // Order methods
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getOrderByReference(reference: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.reference, reference));
    return order || undefined;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(insertOrder).returning();
    return order;
  }

  async updateOrder(id: number, orderUpdate: Partial<InsertOrder>): Promise<Order | undefined> {
    const [order] = await db.update(orders)
      .set(orderUpdate)
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  async deleteOrder(id: number): Promise<boolean> {
    const result = await db.delete(orders).where(eq(orders.id, id));
    return result.rowCount! > 0;
  }

  async getRecentOrders(limit = 10): Promise<Order[]> {
    return await db.select().from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(limit);
  }

  // Order Item methods
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async getAllOrderItems(): Promise<OrderItem[]> {
    return await db.select().from(orderItems);
  }

  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const [orderItem] = await db.insert(orderItems).values(insertOrderItem).returning();
    return orderItem;
  }

  // Payment methods
  async getPayments(): Promise<Payment[]> {
    return await db.select().from(payments).orderBy(desc(payments.createdAt));
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  async getPaymentsByCustomer(customerId: number): Promise<Payment[]> {
    return await db.select().from(payments)
      .where(eq(payments.customerId, customerId))
      .orderBy(desc(payments.createdAt));
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values(insertPayment).returning();
    return payment;
  }

  // Dashboard methods
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    // Get total revenue from all revenue-generating orders (paid, credit, completed)
    const [revenueResult] = await db.select({
      totalRevenue: sql<string>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)::TEXT`
    })
    .from(orders)
    .where(or(eq(orders.status, 'paid'), eq(orders.status, 'credit'), eq(orders.status, 'completed')));

    // Get today's orders count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [todayOrdersResult] = await db.select({
      todayOrders: sql<number>`COUNT(*)`
    })
    .from(orders)
    .where(gte(orders.createdAt, today));

    // Get total products count
    const [productsResult] = await db.select({
      totalProducts: sql<number>`COUNT(*)`
    }).from(products);

    // Get total customers count  
    const [customersResult] = await db.select({
      totalCustomers: sql<number>`COUNT(*)`
    }).from(customers);

    // Get low stock count
    const [lowStockResult] = await db.select({
      lowStockCount: sql<number>`COUNT(*)`
    }).from(products)
    .where(sql`${products.stock} <= ${products.lowStockThreshold}`);

    return {
      totalRevenue: revenueResult?.totalRevenue || "0.00",
      totalOrders: todayOrdersResult?.todayOrders || 0,
      totalProducts: productsResult?.totalProducts || 0,
      totalCustomers: customersResult?.totalCustomers || 0,
      revenueGrowth: "0.0%", // Will be calculated accurately by detailed metrics
      ordersGrowth: "0.0%", // Will be calculated accurately by detailed metrics
      lowStockCount: lowStockResult?.lowStockCount || 0,
      activeCustomersCount: customersResult?.totalCustomers || 0
    };
  }

  async getDetailedDashboardMetrics(): Promise<{
    revenue: { today: number; yesterday: number; weekToDate: number; priorWeekToDate: number; };
    orders: { today: number; yesterday: number; };
    inventory: { totalItems: number; priorSnapshot: number; };
    customers: { active: number; priorActive: number; };
  }> {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const tomorrowStart = new Date(today);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    // Revenue calculations for all revenue-generating orders (paid, credit)
    const [todayRevenue] = await db.select({
      revenue: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`
    })
    .from(orders)
    .where(and(
      or(eq(orders.status, 'paid'), eq(orders.status, 'credit'), eq(orders.status, 'completed')),
      gte(orders.createdAt, today),
      sql`${orders.createdAt} < ${tomorrowStart}`
    ));

    const [yesterdayRevenue] = await db.select({
      revenue: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`
    })
    .from(orders)
    .where(and(
      or(eq(orders.status, 'paid'), eq(orders.status, 'credit'), eq(orders.status, 'completed')),
      gte(orders.createdAt, yesterday),
      sql`${orders.createdAt} < ${today}`
    ));

    // Orders calculations (all orders for today and yesterday)
    const [todayOrders] = await db.select({
      count: sql<number>`COUNT(*)`
    })
    .from(orders)
    .where(and(
      gte(orders.createdAt, today),
      sql`${orders.createdAt} < ${tomorrowStart}`
    ));

    const [yesterdayOrders] = await db.select({
      count: sql<number>`COUNT(*)`
    })
    .from(orders)
    .where(and(
      gte(orders.createdAt, yesterday),
      sql`${orders.createdAt} < ${today}`
    ));

    // Inventory calculations
    const [inventoryCount] = await db.select({
      totalItems: sql<number>`COALESCE(SUM(${products.stock}), 0)`
    }).from(products);

    // Customer calculations (customers with orders in last 30 days are considered active)
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [activeCustomers] = await db.select({
      active: sql<number>`COUNT(DISTINCT ${orders.customerId})`
    })
    .from(orders)
    .where(and(
      isNotNull(orders.customerId),
      gte(orders.createdAt, thirtyDaysAgo)
    ));

    const [totalCustomers] = await db.select({
      total: sql<number>`COUNT(*)`
    }).from(customers);

    // Calculate week-to-date revenue
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)
    
    const [weekToDateRevenue] = await db.select({
      revenue: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`
    })
    .from(orders)
    .where(and(
      or(eq(orders.status, 'paid'), eq(orders.status, 'credit'), eq(orders.status, 'completed')),
      gte(orders.createdAt, weekStart),
      sql`${orders.createdAt} < ${tomorrowStart}`
    ));

    // Calculate prior week revenue
    const priorWeekStart = new Date(weekStart);
    priorWeekStart.setDate(weekStart.getDate() - 7);
    const priorWeekEnd = new Date(weekStart);
    
    const [priorWeekRevenue] = await db.select({
      revenue: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`
    })
    .from(orders)
    .where(and(
      or(eq(orders.status, 'paid'), eq(orders.status, 'credit'), eq(orders.status, 'completed')),
      gte(orders.createdAt, priorWeekStart),
      sql`${orders.createdAt} < ${priorWeekEnd}`
    ));

    // Calculate prior active customers (30-60 days ago)
    const sixtyDaysAgo = new Date(today);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const [priorActiveCustomers] = await db.select({
      active: sql<number>`COUNT(DISTINCT ${orders.customerId})`
    })
    .from(orders)
    .where(and(
      isNotNull(orders.customerId),
      gte(orders.createdAt, sixtyDaysAgo),
      sql`${orders.createdAt} < ${thirtyDaysAgo}`
    ));

    return {
      revenue: {
        today: Number(todayRevenue?.revenue || 0),
        yesterday: Number(yesterdayRevenue?.revenue || 0),
        weekToDate: Number(weekToDateRevenue?.revenue || 0),
        priorWeekToDate: Number(priorWeekRevenue?.revenue || 0),
      },
      orders: {
        today: Number(todayOrders?.count || 0),
        yesterday: Number(yesterdayOrders?.count || 0),
      },
      inventory: {
        totalItems: Number(inventoryCount?.totalItems || 0),
        priorSnapshot: Number(inventoryCount?.totalItems || 0), // Would need historical inventory data
      },
      customers: {
        active: Number(activeCustomers?.active || 0),
        priorActive: Number(priorActiveCustomers?.active || 0),
      },
    };
  }

  // Business Profile methods
  async saveBusinessProfile(userId: number, profile: Omit<InsertBusinessProfile, 'userId'>): Promise<void> {
    await db.insert(businessProfiles).values({
      ...profile,
      userId
    }).onConflictDoUpdate({
      target: businessProfiles.userId,
      set: profile
    });
  }

  async getBusinessProfile(userId: number): Promise<BusinessProfile | undefined> {
    const [profile] = await db.select().from(businessProfiles).where(eq(businessProfiles.userId, userId));
    return profile || undefined;
  }

  // Store Profile methods
  async getStoreProfile(userId: number): Promise<StoreProfile | undefined> {
    const [profile] = await db.select().from(storeProfiles).where(eq(storeProfiles.userId, userId));
    return profile || undefined;
  }

  async saveStoreProfile(userId: number, profile: Omit<InsertStoreProfile, 'userId'>): Promise<StoreProfile> {
    const [storeProfile] = await db.insert(storeProfiles).values({
      ...profile,
      userId
    }).returning();
    return storeProfile;
  }

  async updateStoreProfile(userId: number, profile: Partial<Omit<InsertStoreProfile, 'userId'>>): Promise<StoreProfile | undefined> {
    const [storeProfile] = await db.update(storeProfiles)
      .set(profile)
      .where(eq(storeProfiles.userId, userId))
      .returning();
    return storeProfile || undefined;
  }

  // User Settings methods
  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings || undefined;
  }

  async saveUserSettings(userId: number, settings: Omit<InsertUserSettings, 'userId'>): Promise<UserSettings> {
    const [userSetting] = await db.insert(userSettings).values({
      ...settings,
      userId
    }).returning();
    return userSetting;
  }

  async updateUserSettings(userId: number, settings: Partial<Omit<InsertUserSettings, 'userId'>>): Promise<UserSettings | undefined> {
    const [userSetting] = await db.update(userSettings)
      .set(settings)
      .where(eq(userSettings.userId, userId))
      .returning();
    return userSetting || undefined;
  }

  // Notification methods
  async getNotifications(userId: number, limit = 50): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const [result] = await db.select({
      count: sql<number>`COUNT(*)`
    })
    .from(notifications)
    .where(and(
      eq(notifications.userId, userId),
      eq(notifications.isRead, false)
    ));

    return result?.count || 0;
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(insertNotification).returning();
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const result = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
    return result.rowCount! > 0;
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    const result = await db.update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    return result.rowCount! > 0;
  }

  async deleteNotification(id: number): Promise<boolean> {
    const result = await db.delete(notifications)
      .where(eq(notifications.id, id));
    return result.rowCount! > 0;
  }

  // Search methods
  async globalSearch(query: string): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    
    // Search products
    const productResults = await db.select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      price: products.price
    }).from(products).where(
      or(
        ilike(products.name, `%${query}%`),
        ilike(products.sku, `%${query}%`)
      )
    ).limit(5);

    results.push(...productResults.map(p => ({
      id: p.id,
      type: 'product' as const,
      name: p.name,
      subtitle: `${p.sku} - KES ${p.price}`,
      url: `/inventory`
    })));

    // Search customers
    const customerResults = await db.select({
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
      email: customers.email
    }).from(customers).where(
      or(
        ilike(customers.name, `%${query}%`),
        ilike(customers.phone, `%${query}%`),
        ilike(customers.email, `%${query}%`)
      )
    ).limit(5);

    results.push(...customerResults.map(c => ({
      id: c.id,
      type: 'customer' as const,
      name: c.name,
      subtitle: c.phone || c.email || '',
      url: `/customers`
    })));

    // Search orders
    const orderResults = await db.select({
      id: orders.id,
      customerName: orders.customerName,
      total: orders.total,
      status: orders.status
    }).from(orders).where(
      or(
        ilike(orders.customerName, `%${query}%`),
        ilike(orders.reference, `%${query}%`)
      )
    ).limit(5);

    results.push(...orderResults.map(o => ({
      id: o.id,
      type: 'order' as const,
      name: `Order for ${o.customerName}`,
      subtitle: `KES ${o.total} - ${o.status}`,
      url: `/orders`
    })));

    return results;
  }
}

export const storage = new DatabaseStorage();