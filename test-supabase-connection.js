import postgres from 'postgres';

async function testSupabaseConnection() {
  const connectionString = "postgresql://postgres:alvinkibet@db.kwdzbssuovwemthmiuht.supabase.co:5432/postgres";
  
  try {
    const sql = postgres(connectionString, {
      host: 'db.kwdzbssuovwemthmiuht.supabase.co',
      port: 5432,
      database: 'postgres',
      username: 'postgres',
      password: 'alvinkibet',
      ssl: { rejectUnauthorized: false }
    });

    console.log('Attempting to connect to Supabase...');
    
    const result = await sql`SELECT NOW() as current_time`;
    console.log('Connected to Supabase successfully!');
    console.log('Database time:', result[0].current_time);
    
    await sql.end();
    console.log('Connection closed');
  } catch (error) {
    console.error('Supabase connection error:', error);
  }
}

testSupabaseConnection();