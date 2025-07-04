#!/usr/bin/env node

/**
 * Production deployment test script
 * Runs the production build for deployment verification
 */

import { spawn } from 'child_process'
// Kill any existing processes on port 5000
const killProcess = spawn('pkill', ['-f', 'node.*5000'], { stdio: 'inherit' })
killProcess.on('close', () => {
  // Start the production server
  const server = spawn('node', ['dist/index.js'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: '5000'
    }
  })
  server.on('error', (err) => {
    console.error('Failed to start production server:', err)
    process.exit(1)
  })
  server.on('close', (code) => {
    console.log(`Production server exited with code ${code}`)
    process.exit(code)
  })
});