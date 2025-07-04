#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure output directories exist
const distDir = path.join(__dirname, '..', 'dist');
const publicDir = path.join(distDir, 'public');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true })
}
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
}

try {
  // Clean previous builds
  execSync('rm -rf dist/*', { stdio: 'inherit' });

  // Build frontend
  execSync('cd client && npm run build', { stdio: 'inherit' });

  // Build backend
  execSync('npx esbuild server/index.ts --bundle --platform = node --outfile = dist/index.js --external:@replit/database --external:better-sqlite3 --external:pg --external:bcryptjs --format = esm --target = node20', { stdio: 'inherit' });

  // Copy package.json for production
  const packageJson = {
    name: 'dukafiti-production',
    version: '1.0.0',
    type: 'module',
    scripts: {
      start: 'node index.js'
    },
    dependencies: {
      '@supabase/supabase-js': '^2.38.4',
      'express': '^4.18.2',
      'express-session': '^1.17.3',
      'bcryptjs': '^2.4.3'
    }
  };

  fs.writeFileSync(path.join(distDir, 'package.json'), JSON.stringify(packageJson, null, 2))

  } catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1)
}