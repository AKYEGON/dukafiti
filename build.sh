#!/bin/bash

# Build script for Render deployment

echo "Starting build process..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building application..."
npm run build

# Verify build outputs
echo "Verifying build outputs..."
if [ -d "dist" ]; then
    echo "✅ dist directory created"
    ls -la dist/
else
    echo "❌ dist directory not found"
    exit 1
fi

if [ -d "dist/public" ]; then
    echo "✅ Frontend build successful"
    ls -la dist/public/
else
    echo "❌ Frontend build failed"
    exit 1
fi

if [ -f "dist/index.js" ]; then
    echo "✅ Backend build successful"
    ls -la dist/index.js
else
    echo "❌ Backend build failed"
    exit 1
fi

echo "Build completed successfully!"