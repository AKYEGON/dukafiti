import bcrypt from "bcryptjs";
import { db } from "./db";
import { 
  products, 
  customers, 
  users,
  userSettings,
  notifications
} from "../shared/schema";

export async function initializeDatabase() {
  try {
    console.log("Initializing database...");
    
    // Tables are already created by Drizzle Kit push
    console.log("Database tables already exist from schema deployment");

    // Check if we need to create initial data
    const existingUsers = await db.select().from(users).limit(1);
    
    if (existingUsers.length === 0) {
      console.log("Creating initial data...");
      
      // Create default user
      const hashedPassword = await bcrypt.hash("admin123", 10);
      const [defaultUser] = await db.insert(users).values({
        username: "admin",
        email: "admin@dukafiti.com",
        passwordHash: hashedPassword,
        phone: "+254700000000"
      }).returning();
      
      console.log("Created default user");

      // Create sample products
      const sampleProducts = [
        {
          name: "Rice 2kg",
          sku: "RICE-2KG",
          description: "Premium quality rice",
          price: "150.00",
          stock: 50,
          category: "Grains",
          lowStockThreshold: 10
        },
        {
          name: "Cooking Oil 1L",
          sku: "OIL-1L",
          description: "Pure vegetable cooking oil",
          price: "120.00",
          stock: 30,
          category: "Cooking",
          lowStockThreshold: 5
        },
        {
          name: "Sugar 1kg",
          sku: "SUGAR-1KG",
          description: "White refined sugar",
          price: "80.00",
          stock: 25,
          category: "Baking",
          lowStockThreshold: 8
        },
        {
          name: "Milk 1L",
          sku: "MILK-1L",
          description: "Fresh whole milk",
          price: "60.00",
          stock: 20,
          category: "Dairy",
          lowStockThreshold: 5
        },
        {
          name: "Bread",
          sku: "BREAD-WHITE",
          description: "White bread loaf",
          price: "45.00",
          stock: 15,
          category: "Bakery",
          lowStockThreshold: 3
        },
        {
          name: "Eggs (Tray)",
          sku: "EGGS-TRAY",
          description: "Fresh eggs - 30 pieces",
          price: "350.00",
          stock: 12,
          category: "Dairy",
          lowStockThreshold: 2
        }
      ];

      for (const product of sampleProducts) {
        await db.insert(products).values(product);
      }
      
      console.log("Created sample products");

      // Create sample customers
      const sampleCustomers = [
        {
          name: "John Doe",
          email: "john@example.com",
          phone: "+254700123456",
          address: "123 Main St, Nairobi",
          balance: "0.00"
        },
        {
          name: "Jane Smith",
          email: "jane@example.com", 
          phone: "+254700654321",
          address: "456 Oak Ave, Mombasa",
          balance: "150.00"
        },
        {
          name: "Mary Wanjiku",
          email: "mary@example.com",
          phone: "+254700111222",
          address: "789 Kenyatta Ave, Nakuru",
          balance: "75.50"
        }
      ];

      for (const customer of sampleCustomers) {
        await db.insert(customers).values(customer);
      }
      
      console.log("Created sample customers");
      
      // Create user settings for the default user
      await db.insert(userSettings).values({
        userId: defaultUser.id,
        theme: "light",
        currency: "KES",
        language: "en",
        notifications: true
      });
      
      console.log("Created user settings");

      // Create sample notifications
      const sampleNotifications = [
        {
          userId: defaultUser.id,
          title: "Welcome to DukaFiti!",
          message: "Your business management platform is ready to use.",
          type: "success"
        },
        {
          userId: defaultUser.id,
          title: "Low Stock Alert",
          message: "Some items are running low. Check your inventory.",
          type: "warning"
        }
      ];

      for (const notification of sampleNotifications) {
        await db.insert(notifications).values(notification);
      }
      
      console.log("Created sample notifications");
    }
    
    console.log("Database initialization completed!");
    
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
}