#!/usr/bin/env node

/**
 * Railway deployment build script
 * Builds both frontend and backend for production deployment
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`)
  try {
    execSync(command, { stdio: 'inherit' })
    console.log(`✅ ${description} completed`)
  } catch (error) {
    console.error(`❌ ${description} failed:`)
    console.error(error.message)
    process.exit(1)
  }
}

function main() {
  console.log('🚀 Starting Railway build process...')
  // Update browserslist database
  runCommand('npx update-browserslist-db@latest', 'Updating browserslist database')
  // Build frontend with Vite
  runCommand('npx vite build', 'Building frontend')
  // Build backend with esbuild
  runCommand(
    'npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist',
    'Building backend'
  )
  // Verify the dist directory exists
  if (!fs.existsSync('dist')) {
    console.error('❌ Build failed: dist directory not created')
    process.exit(1)
  }

  // Verify the backend bundle exists
  if (!fs.existsSync('dist/index.js')) {
    console.error('❌ Build failed: backend bundle not created')
    process.exit(1)
  }

  console.log('\n✅ Railway build completed successfully!')
  console.log('📁 Output files:')
  console.log('   - Frontend: dist/public/')
  console.log('   - Backend: dist/index.js')
  console.log('\n🚀 Ready for Railway deployment')
}

main();