import fs from 'fs';
import path from 'path';

function fixSyntaxErrors(filePath) {
  console.log(`Fixing syntax errors in ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix common syntax errors - semicolons instead of commas in object literals
  content = content.replace(/(\s+)(\w+):\s*([^,\n}]+);(\s*[}\]])/g, '$1$2: $3$4');
  content = content.replace(/(\s+)(\w+):\s*([^,\n}]+);(\s*\n)/g, '$1$2: $3$4');
  
  // Fix specific patterns we found
  content = content.replace(/outstandingOrders: 1;/g, 'outstandingOrders: 1');
  content = content.replace(/totalRevenue: ([^,\n}]+);/g, 'totalRevenue: $1');
  content = content.replace(/revenue: ([^,\n}]+);/g, 'revenue: $1');
  content = content.replace(/value: ([^,\n}]+);/g, 'value: $1');
  content = content.replace(/unitsSold: ([^,\n}]+);/g, 'unitsSold: $1');
  content = content.replace(/productName: ([^,\n}]+);/g, 'productName: $1');
  content = content.replace(/customerName: ([^,\n}]+);/g, 'customerName: $1');
  content = content.replace(/totalOwed: ([^,\n}]+);/g, 'totalOwed: $1');
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed ${filePath}`);
}

// Fix all route files
const filesToFix = [
  'server/routes.ts',
  'server/routes-supabase.ts',
  'server/routes-old.ts'
];

filesToFix.forEach(file => {
  if (fs.existsSync(file)) {
    fixSyntaxErrors(file);
  }
});

console.log('All syntax errors fixed!');