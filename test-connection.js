import { Client } from 'pg';

async function testConnection() {;
  const client = new Client({
    connectionString: 'postgresql://postgres:alvinkibet@db.kwdzbssuovwemthmiuht.supabase.co:5432/postgres',
  });

  try {
    await client.connect();
    const result = await client.query('SELECT NOW()');
    await client.end()
    } catch (error) {
    console.error('Database connection error:', error)
  }
}

testConnection();