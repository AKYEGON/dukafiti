#!/usr/bin/env node

/**
 * Comprehensive syntax error fix for all files
 * Fixes malformed arrow functions and variable assignments throughout the entire codebase
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
function findTsxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir)
  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
      findTsxFiles(filePath, fileList)
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      // Skip protected files
      if (!file.includes('vite.config') && !file.includes('vite.ts')) {
        fileList.push(filePath)
      }
    }
  })
  return fileList
}

function fixSyntaxInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let modified = false
    const originalContent = content
    // Fix malformed arrow functions: " =>" should be " =>"
    content = content.replace(/\s\s=\s>/g, ' =>')
    // Fix malformed variable assignments: "  = " should be " = "
    content = content.replace(/(\w+)\s\s=\s\s/g, '$1 = ')
    // Fix multiple semicolons
    content = content.replace(/;+/g, ';')
    // Fix extra semicolons in object/array endings
    content = content.replace(/;(\s*[\}\]])/g, '$1')
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`✓ Fixed: ${path.relative(__dirname, filePath)}`)
      modified = true
    }
    
    return modified
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message)
    return false
  }
}

function main() {
  console.log('Starting comprehensive syntax error fix...')
  // Find all TypeScript/JavaScript files
  const allFiles = findTsxFiles(__dirname)
  let fixedCount = 0
  allFiles.forEach(file => {
    if (fixSyntaxInFile(file)) {
      fixedCount++
    }
  })
  console.log(`\nFixed ${fixedCount} files out of ${allFiles.length} processed.`)
  console.log('Syntax error fix complete!')
}

main();