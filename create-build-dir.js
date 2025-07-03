#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create build directory if it doesn't exist
const buildDir = path.join(__dirname, 'build');
const distPublicDir = path.join(__dirname, 'dist', 'public');

try {
  // Check if dist/public exists (from vite build output)
  if (fs.existsSync(distPublicDir)) {
    console.log('Found dist/public directory, creating build symlink...');
    
    // Remove build directory if it exists
    if (fs.existsSync(buildDir)) {
      fs.rmSync(buildDir, { recursive: true, force: true });
    }
    
    // Create symlink from build to dist/public
    fs.symlinkSync(distPublicDir, buildDir);
    console.log('✅ Created build symlink to dist/public');
  } else {
    console.log('dist/public not found, creating empty build directory...');
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir, { recursive: true });
    }
    
    // Create a simple index.html for fallback
    const fallbackHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>DukaFiti - Building...</title>
</head>
<body>
  <h1>DukaFiti is building...</h1>
  <p>Please wait while the application is being prepared.</p>
</body>
</html>`;
    
    fs.writeFileSync(path.join(buildDir, 'index.html'), fallbackHtml);
    console.log('✅ Created fallback build directory');
  }
} catch (error) {
  console.error('Error setting up build directory:', error);
  process.exit(1);
}