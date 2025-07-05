#!/usr/bin/env node

import { build } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function buildApp() {
  try {
    console.log('Building DukaFiti frontend application...');
    
    // Build using the existing vite config
    await build({
      configFile: resolve(__dirname, 'vite.config.ts'),
      mode: 'production',
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
              supabase: ['@supabase/supabase-js']
            }
          }
        }
      }
    });
    
    console.log('Frontend build completed successfully!');
    console.log('Output directory: dist/public');
    
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildApp();