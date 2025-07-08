#!/usr/bin/env node

/**
 * Vercel Build Script for DukaFiti
 * This script creates an optimized build for Vercel deployment
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

async function buildForVercel() {
  console.log('🚀 Starting Vercel build...');
  
  try {
    // Clean previous build
    console.log('🧹 Cleaning previous build...');
    await execAsync('rm -rf dist');
    
    // Run Vite build
    console.log('⚡ Building frontend with Vite...');
    const { stdout, stderr } = await execAsync('vite build --mode production');
    
    if (stderr && !stderr.includes('browserslist')) {
      console.warn('⚠️ Build warnings:', stderr);
    }
    
    console.log('✅ Build completed successfully!');
    console.log(stdout);
    
    // Verify build output
    const buildExists = await fs.access('dist/public').then(() => true).catch(() => false);
    if (!buildExists) {
      throw new Error('Build output directory not found');
    }
    
    console.log('📦 Build verification passed!');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildForVercel();
}