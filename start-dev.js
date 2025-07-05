#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Start Vite dev server with proper configuration
const viteProcess = spawn('npx', [
  'vite',
  '--config', join(__dirname, 'vite.config.dev.ts'),
  '--host', '0.0.0.0',
  '--port', '5000'
], {
  cwd: join(__dirname, 'client'),
  stdio: 'inherit'
});

viteProcess.on('close', (code) => {
  console.log(`Vite process exited with code ${code}`);
  process.exit(code);
});

viteProcess.on('error', (error) => {
  console.error('Error starting Vite:', error);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  viteProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  viteProcess.kill('SIGTERM');
});