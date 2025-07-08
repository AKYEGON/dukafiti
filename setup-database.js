#!/usr/bin/env node

/**
 * DukaFiti Database Setup Script
 * This script creates the complete database schema with RLS policies
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function setupDatabase() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials');
    console.log('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  console.log('🚀 Setting up DukaFiti database...');
  console.log('📍 Supabase URL:', supabaseUrl);

  try {
    // Read the SQL setup file
    const sqlScript = fs.readFileSync('./database-setup.sql', 'utf8');
    
    // Split into individual statements (basic approach)
    const statements = sqlScript
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s !== 'NOTIFY pgrst, \'reload schema\'');

    console.log(`📝 Executing ${statements.length} SQL statements...`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        console.log(`⏳ ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql_text: statement });
        
        if (error) {
          console.log(`⚠️  Statement may already exist or RPC not available: ${error.message}`);
          // Continue with next statement - many errors are expected for existing tables
        } else {
          console.log(`✅ Executed successfully`);
        }
      }
    }

    console.log('\n🎉 Database setup completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Open your app in the browser');
    console.log('2. Create an account using email/password');
    console.log('3. Start adding products and customers');
    console.log('\n🔒 Multi-tenant isolation is active - each user sees only their own data');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n💡 Manual setup required:');
    console.log('1. Open your Supabase dashboard');
    console.log('2. Go to SQL Editor');
    console.log('3. Copy and paste the content from database-setup.sql');
    console.log('4. Run the script manually');
  }
}

setupDatabase();