#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting production build...');

// Ensure output directories exist
const distDir = path.join(__dirname, '..', 'dist');
const publicDir = path.join(distDir, 'public');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

try {
  // Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  execSync('rm -rf dist/*', { stdio: 'inherit' });

  // Build frontend
  console.log('🎨 Building frontend...');
  execSync('cd client && npm run build', { stdio: 'inherit' });

  // Build backend
  console.log('⚙️ Building backend...');
  execSync('npx esbuild server/index.ts --bundle --platform=node --outfile=dist/index.js --external:@replit/database --external:better-sqlite3 --external:pg --external:bcryptjs --format=esm --target=node20', { stdio: 'inherit' });

  // Copy package.json for production
  console.log('📦 Setting up production dependencies...');
  const packageJson = {
    name: "dukafiti-production",
    version: "1.0.0",
    type: "module",
    scripts: {
      start: "node index.js"
    },
    dependencies: {
      "@supabase/supabase-js": "^2.38.4",
      "express": "^4.18.2",
      "express-session": "^1.17.3",
      "bcryptjs": "^2.4.3"
    }
  };
  
  fs.writeFileSync(path.join(distDir, 'package.json'), JSON.stringify(packageJson, null, 2));

  console.log('✅ Production build completed successfully!');
  console.log('📁 Output directory: dist/');
  console.log('🌐 Frontend assets: dist/public/');
  console.log('⚙️ Backend bundle: dist/index.js');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}