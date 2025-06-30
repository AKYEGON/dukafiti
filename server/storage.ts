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
  DashboardMetrics,
  products,
  customers,
  orders,
  orderItems,
  users
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, or, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  searchProducts(query: string): Promise<Product[]>;

  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;

  // Orders
  getOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;
  getRecentOrders(limit?: number): Promise<Order[]>;

  // Order Items
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;

  // Dashboard
  getDashboardMetrics(): Promise<DashboardMetrics>;
}

export class MemStorage implements IStorage {
  private products: Map<number, Product> = new Map();
  private customers: Map<number, Customer> = new Map();
  private orders: Map<number, Order> = new Map();
  private orderItems: Map<number, OrderItem> = new Map();
  private users: Map<number, User> = new Map();
  
  private productId = 1;
  private customerId = 1;
  private orderId = 1;
  private orderItemId = 1;
  private userId = 1;

  constructor() {
    // Initialize with some sample data
    this.initializeData();
  }

  private initializeData() {
    // Create default user
    const defaultUser: User = {
      id: this.userId++,
      username: "admin",
      password: "admin123",
      name: "John Doe",
      role: "manager"
    };
    this.users.set(defaultUser.id, defaultUser);

    // Create sample products
    const sampleProducts: Omit<Product, 'id'>[] = [
      {
        name: "Wireless Headphones",
        sku: "WHD-001",
        description: "Premium Audio Device",
        price: "129.99",
        stock: 5,
        category: "Electronics",
        lowStockThreshold: 10,
        createdAt: new Date()
      },
      {
        name: "Smartphone Case",
        sku: "SPC-002", 
        description: "Protective Cover",
        price: "24.99",
        stock: 45,
        category: "Accessories",
        lowStockThreshold: 10,
        createdAt: new Date()
      },
      {
        name: "Bluetooth Speaker",
        sku: "BTS-003",
        description: "Portable wireless speaker",
        price: "79.99",
        stock: 25,
        category: "Electronics",
        lowStockThreshold: 5,
        createdAt: new Date()
      }
    ];

    sampleProducts.forEach(product => {
      const newProduct: Product = { ...product, id: this.productId++ };
      this.products.set(newProduct.id, newProduct);
    });

    // Create sample customers
    const sampleCustomers: Omit<Customer, 'id'>[] = [
      {
        name: "Alice Johnson",
        email: "alice@example.com",
        phone: "+1234567890",
        address: "123 Main St, City",
        createdAt: new Date()
      },
      {
        name: "Mike Brown", 
        email: "mike@example.com",
        phone: "+1234567891",
        address: "456 Oak Ave, City",
        createdAt: new Date()
      }
    ];

    sampleCustomers.forEach(customer => {
      const newCustomer: Customer = { ...customer, id: this.customerId++ };
      this.customers.set(newCustomer.id, newCustomer);
    });

    // Create sample orders
    const sampleOrders: Omit<Order, 'id'>[] = [
      {
        customerId: 1,
        customerName: "Alice Johnson",
        total: "127.50",
        status: "completed",
        createdAt: new Date()
      },
      {
        customerId: 2,
        customerName: "Mike Brown",
        total: "89.25", 
        status: "processing",
        createdAt: new Date()
      }
    ];

    sampleOrders.forEach(order => {
      const newOrder: Order = { ...order, id: this.orderId++ };
      this.orders.set(newOrder.id, newOrder);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = { ...insertUser, id: this.userId++ };
    this.users.set(user.id, user);
    return user;
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const product: Product = {
      ...insertProduct,
      id: this.productId++,
      createdAt: new Date()
    };
    this.products.set(product.id, product);
    return product;
  }

  async updateProduct(id: number, productUpdate: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;

    const updatedProduct = { ...product, ...productUpdate };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  async searchProducts(query: string): Promise<Product[]> {
    const products = Array.from(this.products.values());
    const lowerQuery = query.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(lowerQuery) ||
      product.sku.toLowerCase().includes(lowerQuery) ||
      product.category.toLowerCase().includes(lowerQuery)
    );
  }

  // Customer methods
  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const customer: Customer = {
      ...insertCustomer,
      id: this.customerId++,
      createdAt: new Date()
    };
    this.customers.set(customer.id, customer);
    return customer;
  }

  async updateCustomer(id: number, customerUpdate: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;

    const updatedCustomer = { ...customer, ...customerUpdate };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    return this.customers.delete(id);
  }

  // Order methods
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const order: Order = {
      ...insertOrder,
      id: this.orderId++,
      createdAt: new Date()
    };
    this.orders.set(order.id, order);
    return order;
  }

  async updateOrder(id: number, orderUpdate: Partial<InsertOrder>): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const updatedOrder = { ...order, ...orderUpdate };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async deleteOrder(id: number): Promise<boolean> {
    return this.orders.delete(id);
  }

  async getRecentOrders(limit = 10): Promise<Order[]> {
    const orders = await this.getOrders();
    return orders.slice(0, limit);
  }

  // Order Item methods
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(item => item.orderId === orderId);
  }

  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const orderItem: OrderItem = {
      ...insertOrderItem,
      id: this.orderItemId++
    };
    this.orderItems.set(orderItem.id, orderItem);
    return orderItem;
  }

  // Dashboard methods
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const products = await this.getProducts();
    const orders = await this.getOrders();
    const customers = await this.getCustomers();

    const totalRevenue = orders
      .filter(order => order.status === 'completed')
      .reduce((sum, order) => sum + parseFloat(order.total), 0);

    const lowStockProducts = products.filter(product => product.stock <= product.lowStockThreshold);

    // Calculate growth (simplified - comparing with mock previous period)
    const revenueGrowth = "+12.5%";
    const ordersGrowth = "+8.2%";

    return {
      totalRevenue: totalRevenue.toFixed(2),
      totalOrders: orders.length,
      totalProducts: products.length,
      totalCustomers: customers.length,
      revenueGrowth,
      ordersGrowth,
      lowStockCount: lowStockProducts.length,
      activeCustomersCount: customers.length
    };
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(insertProduct)
      .returning();
    return product;
  }

  async updateProduct(id: number, productUpdate: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set(productUpdate)
      .where(eq(products.id, id))
      .returning();
    return product || undefined;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async searchProducts(query: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(
        or(
          ilike(products.name, `%${query}%`),
          ilike(products.sku, `%${query}%`),
          ilike(products.category, `%${query}%`)
        )
      );
  }

  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers);
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db
      .insert(customers)
      .values(insertCustomer)
      .returning();
    return customer;
  }

  async updateCustomer(id: number, customerUpdate: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [customer] = await db
      .update(customers)
      .set(customerUpdate)
      .where(eq(customers.id, id))
      .returning();
    return customer || undefined;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values(insertOrder)
      .returning();
    return order;
  }

  async updateOrder(id: number, orderUpdate: Partial<InsertOrder>): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set(orderUpdate)
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  async deleteOrder(id: number): Promise<boolean> {
    const result = await db.delete(orders).where(eq(orders.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getRecentOrders(limit = 10): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(limit);
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const [orderItem] = await db
      .insert(orderItems)
      .values(insertOrderItem)
      .returning();
    return orderItem;
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const allProducts = await this.getProducts();
    const allOrders = await this.getOrders();
    const allCustomers = await this.getCustomers();

    const completedOrders = allOrders.filter(order => order.status === 'completed');
    const totalRevenue = completedOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);

    const lowStockProducts = allProducts.filter(product => product.stock <= product.lowStockThreshold);

    return {
      totalRevenue: totalRevenue.toFixed(2),
      totalOrders: allOrders.length,
      totalProducts: allProducts.length,
      totalCustomers: allCustomers.length,
      revenueGrowth: "+12.5%", // This would be calculated from historical data
      ordersGrowth: "+8.2%", // This would be calculated from historical data
      lowStockCount: lowStockProducts.length,
      activeCustomersCount: allCustomers.length
    };
  }
}

export const storage = new DatabaseStorage();
