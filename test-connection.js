import { Client } from 'pg';

async function testConnection() {
  const client = new Client({
    connectionString: "postgresql://postgres:alvinkibet@db.kwdzbssuovwemthmiuht.supabase.co:5432/postgres",
  });

  try {
    await client.connect();
    console.log('Connected to database successfully');
    
    const result = await client.query('SELECT NOW()');
    console.log('Database time:', result.rows[0].now);
    
    await client.end();
    console.log('Connection closed');
  } catch (error) {
    console.error('Database connection error:', error);
  }
}

testConnection();