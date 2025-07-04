#!/usr/bin/env node

/**
 * Comprehensive cleanup script for DukaFiti codebase
 * Removes console.log statements, fixes code issues, and improves production readiness
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const EXCLUDED_DIRS = ['node_modules', '.git', 'dist', 'build', 'attached_assets'];
const EXCLUDED_FILES = ['comprehensive-cleanup.js', 'package-lock.json'];

function cleanFile(filePath) {
  if (EXCLUDED_FILES.some(file => filePath.includes(file))) {
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    const originalContent = content;

    // Remove console.log statements (but keep console.error and console.warn for debugging)
    const consoleLogRegex = /^\s*console\.log\([^)]*\);\s*$/gm;
    if (consoleLogRegex.test(content)) {
      content = content.replace(consoleLogRegex, '');
      changed = true;
    }

    // Remove debugging comments
    const debugCommentRegex = /^\s*\/\/ (DEBUG|TEMP|TODO|FIXME|console\.log).*$/gm;
    if (debugCommentRegex.test(content)) {
      content = content.replace(debugCommentRegex, '');
      changed = true;
    }

    // Fix common JavaScript/TypeScript syntax issues
    if (filePath.endsWith('.js') || filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
      // Fix missing semicolons before newlines
      content = content.replace(/(?<!;)\n(\s*)(export |import |const |let |var |function |class |if |for |while |return |throw )/g, ';\n$1$2');
      
      // Remove duplicate semicolons
      content = content.replace(/;;+/g, ';');
      
      // Fix spacing around operators
      content = content.replace(/([^=!<>])=([^=])/g, '$1 = $2');
      content = content.replace(/([^=!<>])==([^=])/g, '$1 == $2');
      content = content.replace(/([^=!<>])===([^=])/g, '$1 === $2');
    }

    // Clean up excessive whitespace
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    content = content.replace(/[ \t]+$/gm, ''); // Remove trailing whitespace

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      changed = true;
    }

    if (changed) {
      console.log(`✅ Cleaned: ${filePath}`);
    }
  } catch (error) {
    console.warn(`⚠️  Could not clean ${filePath}: ${error.message}`);
  }
}

function main() {
  console.log('🧹 Starting comprehensive cleanup...');

  // Get all relevant files
  const patterns = [
    'client/src/**/*.{js,jsx,ts,tsx}',
    'server/**/*.{js,ts}',
    'src/**/*.{js,jsx,ts,tsx}',
    '*.{js,jsx,ts,tsx}'
  ];

  patterns.forEach(pattern => {
    try {
      const files = glob.sync(pattern, { 
        ignore: EXCLUDED_DIRS.map(dir => `${dir}/**`),
        absolute: false
      });
      
      files.forEach(file => {
        if (!EXCLUDED_DIRS.some(dir => file.includes(dir))) {
          cleanFile(file);
        }
      });
    } catch (error) {
      console.warn(`Warning: Could not process pattern ${pattern}: ${error.message}`);
    }
  });

  console.log('✨ Cleanup completed!');
  console.log('📝 Summary:');
  console.log('   - Removed console.log statements');
  console.log('   - Fixed syntax inconsistencies');
  console.log('   - Cleaned whitespace');
  console.log('   - Improved production readiness');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { cleanFile, main };