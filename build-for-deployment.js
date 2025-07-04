#!/usr/bin/env node

import { execSync } from 'child_process';
import { mkdirSync, existsSync } from 'fs';

try {
  // Create necessary directories
  if (!existsSync('dist')) {
    mkdirSync('dist', { recursive: true })
  }

  // Build the client from root directory with proper Tailwind content paths
  execSync('npx vite build --mode production', {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  // Build the server
  execSync('npx esbuild server/index.ts --platform = node --packages = external --bundle --format = esm --outdir = dist --target = node18', {
    stdio: 'inherit',
    cwd: process.cwd()
  })

  } catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1)
}