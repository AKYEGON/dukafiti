#!/usr/bin/env node

/**
 * Railway deployment build script
 * Builds both frontend and backend for production deployment
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

function runCommand(command, description) {
  try {
    execSync(command, { stdio: 'inherit' });
    } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
}

function main() {
  // Ensure dist directory exists
  if (!existsSync('./dist')) {
    mkdirSync('./dist', { recursive: true });
  }

  // Update browserslist database
  runCommand('npx update-browserslist-db@latest', 'Updating browserslist database');

  // Build frontend
  runCommand('npx vite build', 'Building frontend with Vite');

  // Build backend
  runCommand(
    'npx esbuild server/index.ts --platform = node --packages = external --bundle --format = esm --outdir = dist',
    'Building backend with esbuild'
  );

  }

main();