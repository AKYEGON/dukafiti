#!/usr/bin/env node

/**
 * Comprehensive cleanup script for DukaFiti codebase
 * Removes console.log statements, fixes code issues, and improves production readiness
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const CONSOLE_LOG_REGEX = /console\.log\([^)]*\);?\s*\n?/g;
const CONSOLE_ERROR_REGEX = /console\.error\([^)]*\);?\s*\n?/g;
const UNUSED_IMPORT_REGEX = /import\s+.*\s+from\s+[''][^'']+[''];\s*\n/g;

function cleanFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    let cleanedContent = content;
    let changes = [];

    // Remove console.log statements (keep console.error for important errors)
    const originalLogCount = (content.match(CONSOLE_LOG_REGEX) || []).length;
    if (originalLogCount > 0) {
      cleanedContent = cleanedContent.replace(CONSOLE_LOG_REGEX, '');
      changes.push(`Removed ${originalLogCount} console.log statements`);
    }

    // Fix common JavaScript/TypeScript issues
    // Fix missing semicolons
    cleanedContent = cleanedContent.replace(/(\w+)\n(\s*})/g, '$1;\n$2');

    // Fix inconsistent spacing around operators
    cleanedContent = cleanedContent.replace(/(\w+)=(\w+)/g, '$1 = $2');
    cleanedContent = cleanedContent.replace(/(\w+)===(\w+)/g, '$1 === $2');
    cleanedContent = cleanedContent.replace(/(\w+)!==(\w+)/g, '$1 !== $2');

    // Fix inconsistent string quotes (standardize to single quotes for non-JSX)
    if (!filePath.includes('.jsx') && !filePath.includes('.tsx')) {
      cleanedContent = cleanedContent.replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, ''$1'");
    }

    // Remove trailing whitespace
    cleanedContent = cleanedContent.replace(/[ \t]+$/gm, '');

    // Fix multiple empty lines
    cleanedContent = cleanedContent.replace(/\n\n\n+/g, '\n\n');

    // Remove statements
    cleanedContent = cleanedContent.replace(/?\s*\n?/g, '');

    if (cleanedContent !== content) {
      writeFileSync(filePath, cleanedContent);
      }`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error cleaning ${filePath}:`, error.message);
    return false;
  }
}

function getAllFiles(dir) {
  let files = [];

  try {
    const items = readdirSync(dir);

    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip node_modules, .git, dist, and other build directories
        if (!['node_modules', '.git', 'dist', 'build', '.next', '.vite'].includes(item)) {
          files = files.concat(getAllFiles(fullPath));
        }
      } else if (stat.isFile()) {
        const ext = extname(item).toLowerCase();
        // Process JavaScript, TypeScript, and JSX files
        if (['.js', '.jsx', '.ts', '.tsx', '.mjs'].includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }

  return files;
}

function main() {
  const allFiles = getAllFiles('./');
  let cleanedCount = 0;

  for (const file of allFiles) {
    if (cleanFile(file)) {
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    }
}

main();