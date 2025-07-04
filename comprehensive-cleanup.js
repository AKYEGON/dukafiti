#!/usr/bin/env node
/**
 * Comprehensive cleanup script for DukaFiti codebase
 * Removes console.log statements, fixes code issues, and improves production readiness
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();

// Files to clean up
const filesToClean = [
  'client/src/hooks/use-websocket.tsx',
  'client/src/lib/enhanced-offline-queue.ts',
  'client/src/lib/offline-queue.ts',
  'client/src/main.tsx',
  'client/src/pages/sales.tsx'
];

// Console.log patterns to remove
const consolePatterns = [
  /\s*console\.log\([^;]+\);\s*/g,
  /\s*console\.error\([^;]+\);\s*/g,
  /\s*console\.warn\([^;]+\);\s*/g,
  /\s*console\.info\([^;]+\);\s*/g
];

function cleanFile(filePath) {
  const fullPath = path.join(projectRoot, filePath);

  if (!fs.existsSync(fullPath)) {
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;

  // Remove console statements
  consolePatterns.forEach(pattern => {
    content = content.replace(pattern, '');
  });

  // Clean up empty lines
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    }
}

function main() {
  filesToClean.forEach(cleanFile);

  }

if (require.main === module) {
  main();
}