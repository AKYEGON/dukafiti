import { db } from "../server/db";
import { users, products, customers, businessProfiles, userSettings, storeProfiles } from "../shared/schema";
import bcrypt from "bcryptjs";

async function seedDatabase() {
  try {
    console.log("Seeding database with sample data...");

    // Create a default user
    const hashedPassword = await bcrypt.hash("password", 10);
    const [user] = await db.insert(users).values({
      username: "test",
      email: "test@example.com",
      passwordHash: hashedPassword,
      phone: "+254700000000"
    }).returning();

    console.log("Created default user:", user.username);

    // Create business profile
    await db.insert(businessProfiles).values({
      userId: user.id,
      businessName: "DukaSmart Demo Store",
      businessType: "retail",
      location: "Nairobi, Kenya",
      description: "A sample retail business for demonstration"
    });

    // Create user settings
    await db.insert(userSettings).values({
      userId: user.id,
      theme: "light",
      currency: "KES",
      language: "en",
      notifications: true
    });

    // Create store profile
    await db.insert(storeProfiles).values({
      userId: user.id,
      storeName: "DukaSmart Demo Store",
      storeType: "retail",
      location: "Nairobi, Kenya",
      description: "A sample retail store"
    });

    // Create sample products
    const sampleProducts = [
      {
        name: "Coca Cola 500ml",
        sku: "COCA-500",
        description: "Refreshing cola drink",
        price: "50.00",
        stock: 100,
        category: "Beverages",
        lowStockThreshold: 10,
        salesCount: 0
      },
      {
        name: "Bread Loaf",
        sku: "BREAD-001",
        description: "Fresh white bread",
        price: "60.00",
        stock: 50,
        category: "Bakery",
        lowStockThreshold: 5,
        salesCount: 0
      },
      {
        name: "Milk 1L",
        sku: "MILK-1L",
        description: "Fresh milk",
        price: "80.00",
        stock: 30,
        category: "Dairy",
        lowStockThreshold: 5,
        salesCount: 0
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
        phone: "+254700000001",
        address: "123 Main St, Nairobi",
        balance: "0.00"
      },
      {
        name: "Jane Smith",
        email: "jane@example.com", 
        phone: "+254700000002",
        address: "456 Oak Ave, Nairobi",
        balance: "100.00"
      }
    ];

    for (const customer of sampleCustomers) {
      await db.insert(customers).values(customer);
    }

    console.log("Created sample customers");
    console.log("Database seeding completed successfully!");

  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();