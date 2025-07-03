#!/usr/bin/env tsx

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runCommand(command: string, description: string) {
  console.log(`\n🚀 ${description}...`);
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stdout) console.log(stdout);
    if (stderr) console.warn(stderr);
    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error);
    throw error;
  }
}

async function deploy() {
  console.log('🎯 Starting DukaFiti deployment process...');
  
  try {
    // Check if required environment variables are set
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'DATABASE_URL'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:', missingVars.join(', '));
      process.exit(1);
    }
    
    // Run database migration
    await runCommand('npm run db:push', 'Database migration');
    
    // Seed database with initial data
    await runCommand('npm run seed', 'Database seeding');
    
    console.log('\n🎉 Deployment completed successfully!');
    console.log('Your DukaFiti app is ready to serve requests.');
    
  } catch (error) {
    console.error('\n💥 Deployment failed:', error);
    process.exit(1);
  }
}

// Run deployment if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  deploy();
}

export { deploy };