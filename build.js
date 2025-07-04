#!/usr/bin/env node
import { build } from 'esbuild';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function buildApp() {
  try {
    // Build frontend with Vite
    await execAsync('npx vite build');
    // Build backend with esbuild
    await build({
      entryPoints: ['server/index.ts'],
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'esm',
      outdir: 'dist',
      external: [
        '@supabase/supabase-js',
        'express',
        'ws',
        'pg',
        'bcryptjs',
        'uuid',
        'json2csv',
        'express-session',
        'connect-pg-simple'
      ],
      define: {
        'import.meta.url': 'import.meta.url'
      },
      banner: {
        js: `
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
        `
      }
    })
    } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1)
  }
}

buildApp();