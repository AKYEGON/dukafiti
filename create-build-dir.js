#!/usr/bin/env node

import { mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';

// Create dist directory structure
const distDir = resolve(process.cwd(), 'dist');
const publicDir = resolve(distDir, 'public');

if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
  console.log('Created dist directory');
}

if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
  console.log('Created dist/public directory');
}

console.log('Build directories ready!');