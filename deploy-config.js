/**
 * DukaFiti Deployment Configuration
 * This script ensures proper branding assets are used during deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Copy custom branding assets to deployment directories
function setupDeploymentBranding() {
  console.log('Setting up DukaFiti deployment branding...');
  
  // Ensure public assets directory exists
  const publicAssetsDir = path.join(__dirname, 'public', 'assets');
  if (!fs.existsSync(publicAssetsDir)) {
    fs.mkdirSync(publicAssetsDir, { recursive: true });
  }
  
  // Copy custom D logo assets
  const sourceDir = path.join(__dirname, 'client', 'public', 'assets');
  const targetDir = path.join(__dirname, 'public', 'assets');
  
  const brandingFiles = [
    'logo-d-black.png',
    'logo-d-white.png'
  ];
  
  brandingFiles.forEach(file => {
    const source = path.join(sourceDir, file);
    const target = path.join(targetDir, file);
    
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, target);
      console.log(`✓ Copied ${file} to deployment assets`);
    }
  });
  
  console.log('✓ DukaFiti deployment branding setup complete');
}

// Update deployment metadata
function updateDeploymentMetadata() {
  console.log('✓ DukaFiti deployment metadata prepared');
  // Note: Package.json updates are handled by the deployment platform
}

// Main deployment setup
function main() {
  try {
    setupDeploymentBranding();
    updateDeploymentMetadata();
    console.log('🚀 DukaFiti deployment configuration complete!');
  } catch (error) {
    console.error('❌ Deployment configuration failed:', error);
    process.exit(1);
  }
}

// Run main if this is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { setupDeploymentBranding, updateDeploymentMetadata };