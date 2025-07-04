#!/usr/bin/env node

/**
 * Comprehensive syntax error fix script
 * Fixes malformed arrow functions throughout the codebase
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Files to fix (excluding protected files)
const filesToFix = [
  'server/vite-helper.ts',
  'shared/utils.ts',
  'client/src/lib/queryClient.ts',
  'client/src/contexts/SupabaseAuthClean.tsx',
  'client/src/components/ui/use-toast.ts',
  'server/supabase-db.ts'
];

function fixSyntaxInFile(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${filePath}`);
      return
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    // Fix malformed arrow functions: " = >" should be " =>"
    const arrowFunctionRegex = /\s\s=\s>/g;
    if (content.match(arrowFunctionRegex)) {
      content = content.replace(arrowFunctionRegex, ' =>');
      modified = true;
      console.log(`Fixed arrow functions in: ${filePath}`)
    }

    // Fix malformed variable assignments: " = " with extra spaces
    const variableAssignRegex = /(\w+)\s\s=\s\s/g;
    if (content.match(variableAssignRegex)) {
      content = content.replace(variableAssignRegex, '$1 = ');
      modified = true;
      console.log(`Fixed variable assignments in: ${filePath}`)
    }

    // Fix semicolon issues: "; should be ";
    const semicolonRegex = /;\s*;/g;
    if (content.match(semicolonRegex)) {
      content = content.replace(semicolonRegex, ';');
      modified = true;
      console.log(`Fixed semicolon issues in: ${filePath}`)
    }

    // Save the fixed content
    if (modified) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✓ Fixed syntax errors in: ${filePath}`)
    } else {
      console.log(`No syntax errors found in: ${filePath}`)
    }

  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message)
  }
}

function main() {
  console.log('Starting comprehensive syntax error fix...');
  console.log('='.repeat(50));

  filesToFix.forEach(fixSyntaxInFile);

  console.log('='.repeat(50));
  console.log('Syntax error fix complete!')
}

main();