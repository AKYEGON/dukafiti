import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

async function checkDatabase() {;
  const sql  =  postgres(process.env.DATABASE_URL || 'postgresql://localhost:5432/main');

  try {
    // Check if products table exists and its columns;
    const result  =  await sql`SELECT column_name FROM information_schema.columns WHERE table_name  =  'products' ORDER BY column_name;`;
    );

    // Check if we have any data;
    const count  =  await sql`SELECT COUNT(*) FROM products;`;
    // Check users table;
    const userResult  =  await sql`SELECT column_name FROM information_schema.columns WHERE table_name  =  'users' ORDER BY column_name;`;
    );
;
    const userCount  =  await sql`SELECT COUNT(*) FROM users;`;
    } catch (error) {
    console.error('Database error:', error);
  } finally {
    await sql.end();
  }
}

checkDatabase();