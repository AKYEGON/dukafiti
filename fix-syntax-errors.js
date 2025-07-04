#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';

// Fix specific syntax errors introduced by cleanup
const fixes = [
  // Fix server/index.ts errors
  {
    file: 'server/index.ts',
    fixes: [
      { from: /(\w+);(\s*\})/g, to: '$1$2' },
      { from: /(\w+);(\s*\]\s*\})/g, to: '$1$2' }
    ]
  },
  // Fix supabase-db.ts errors  
  {
    file: 'server/supabase-db.ts',
    fixes: [
      { from: /(\w+);(\s*\})/g, to: '$1$2' },
      { from: /(\w+);(\s*\]\s*\})/g, to: '$1$2' }
    ]
  },
  // Fix inventory.tsx errors
  {
    file: 'client/src/pages/inventory.tsx',
    fixes: [
      { from: /(\w+);(\s*\})/g, to: '$1$2' }
    ]
  }
];

for (const filefix of fixes) {
  try {
    let content = readFileSync(filefix.file, 'utf8');
    let changed = false;
    
    for (const fix of filefix.fixes) {
      const newContent = content.replace(fix.from, fix.to);
      if (newContent !== content) {
        content = newContent;
        changed = true;
      }
    }
    
    if (changed) {
      writeFileSync(filefix.file, content);
      console.log(`Fixed syntax errors in ${filefix.file}`);
    }
  } catch (error) {
    console.log(`Could not fix ${filefix.file}: ${error.message}`);
  }
}

console.log('Syntax fix completed');