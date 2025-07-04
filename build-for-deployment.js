#!/usr/bin/env node

import { execSync } from 'child_process';
import { mkdirSync, existsSync } from 'fs';

console.log('Starting DukaFiti deployment build...');

try {
  // Create necessary directories
  if (!existsSync('dist')) {
    mkdirSync('dist', { recursive: true });
  }

  console.log('Building client...');
  // Build the client from root directory with proper Tailwind content paths
  execSync('npx vite build --mode production', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });

  console.log('Building server...');
  // Build the server
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --target=node18', {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  console.log('Build completed successfully!');
  
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}