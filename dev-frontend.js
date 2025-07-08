#!/usr/bin/env node

/**
 * Frontend Development Server for DukaFiti
 * Runs Vite development server with proper configuration
 */

import { exec } from 'child_process';

console.log('🚀 Starting DukaFiti frontend development server...');
console.log('📱 This is a frontend-only app using Supabase backend');
console.log('🌐 Server will be available at http://localhost:5000');

const viteProcess = exec('vite --host 0.0.0.0 --port 5000', {
  cwd: process.cwd(),
  env: { ...process.env, NODE_ENV: 'development' }
});

viteProcess.stdout.on('data', (data) => {
  console.log(data.toString());
});

viteProcess.stderr.on('data', (data) => {
  console.error(data.toString());
});

viteProcess.on('close', (code) => {
  console.log(`Development server exited with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development server...');
  viteProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down development server...');
  viteProcess.kill('SIGTERM');
  process.exit(0);
});