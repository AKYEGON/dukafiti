#!/bin/bash

# Build the frontend
echo "Building frontend..."
npm run build:frontend

# Build the backend
echo "Building backend..."
npm run build:backend

# Copy package.json to dist for production dependencies
cp package.json dist/

echo "Build completed!"