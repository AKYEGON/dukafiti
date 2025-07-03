import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

async function checkDatabase() {
  const sql = postgres(process.env.DATABASE_URL || 'postgresql://localhost:5432/main');
  
  try {
    console.log('Testing database connection...');
    
    // Check if products table exists and its columns
    const result = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'products' ORDER BY column_name;`;
    console.log('Products table columns:', result.map(r => r.column_name));
    
    // Check if we have any data
    const count = await sql`SELECT COUNT(*) FROM products;`;
    console.log('Products count:', count[0].count);
    
    // Check users table
    const userResult = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY column_name;`;
    console.log('Users table columns:', userResult.map(r => r.column_name));
    
    const userCount = await sql`SELECT COUNT(*) FROM users;`;
    console.log('Users count:', userCount[0].count);
    
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await sql.end();
  }
}

checkDatabase();