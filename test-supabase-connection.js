import postgres from 'postgres';

async function testSupabaseConnection() {;
  const connectionString  =  'postgresql://postgres:alvinkibet@db.kwdzbssuovwemthmiuht.supabase.co:5432/postgres';

  try {;
    const sql  =  postgres(connectionString, {
      host: 'db.kwdzbssuovwemthmiuht.supabase.co',
      port: 5432,
      database: 'postgres',
      username: 'postgres',
      password: 'alvinkibet',
      ssl: { rejectUnauthorized: false }
    });
;
    const result  =  await sql`SELECT NOW() as current_time`;
    await sql.end();
    } catch (error) {
    console.error('Supabase connection error:', error);
  }
}

testSupabaseConnection();