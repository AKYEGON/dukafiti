#!/bin/bash
set -e

echo "🏗️ Building DukaFiti application..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build frontend
echo "🎨 Building frontend..."
npx vite build

# Build backend
echo "⚙️ Building backend..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --external:@supabase/supabase-js --external:express --external:ws --external:pg --external:bcryptjs --external:uuid --external:json2csv --external:express-session --external:connect-pg-simple

echo "✅ Build completed successfully!"
echo "📁 Frontend assets: dist/public/"
echo "📁 Backend build: dist/index.js"

# Copy necessary files for deployment
echo "📋 Copying deployment files..."
cp package.json dist/
cp -r server/package*.json dist/ 2>/dev/null || true

echo "🚀 Ready for deployment!"