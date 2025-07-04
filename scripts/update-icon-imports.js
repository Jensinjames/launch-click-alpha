#!/usr/bin/env node

/**
 * Script to batch update remaining lucide-react imports to tree-shakable imports
 * Usage: node scripts/update-icon-imports.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Common icon mappings to tree-shakable imports
const iconMappings = {
  'ArrowRight': "ArrowRight",
  'Play': "Play", 
  'Calendar': "Calendar",
  'Zap': "Zap",
  'Mail': "Mail",
  'Settings': "Settings",
  'Shield': "Shield",
  'Database': "Database",
  'Bot': "Bot",
  'Brain': "Brain",
  'Workflow': "Workflow",
  'Star': "Star",
  'CheckCircle': "CheckCircle",
  'Eye': "Eye",
  'MousePointer': "MousePointer",
  'TrendingUp': "TrendingUp",
  'BarChart3': "BarChart3",
  'Download': "Download",
  'CreditCard': "CreditCard",
  'CheckCircle': "CheckCircle",
  'Clock': "Clock",
  'Plug': "Plug",
  'ExternalLink': "ExternalLink",
  'AlertTriangle': "AlertTriangle",
  'RefreshCw': "RefreshCw",
  'Bell': "Bell",
  'User': "User",
  'Loader2': "Loader2",
  'Save': "Save",
  'Lock': "Lock",
  'AlertCircle': "AlertCircle",
  'Search': "Search",
  'Sparkles': "Sparkles",
  'Trash2': "Trash2",
  'Users': "Users",
  'Crown': "Crown",
  'UserPlus': "UserPlus",
  'Home': "Home",
  'Plus': "Plus",
};

function updateFileImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if file has lucide-react imports
  if (!content.includes('from "lucide-react"')) {
    return false;
  }
  
  console.log(`Updating ${filePath}...`);
  
  // Replace import statement
  const updatedContent = content.replace(
    /import\s*{\s*([^}]+)\s*}\s*from\s*"lucide-react";?/g,
    (match, icons) => {
      const iconList = icons.split(',').map(icon => icon.trim());
      return `import { ${iconList.join(', ')} } from "@/lib/icons";`;
    }
  );
  
  fs.writeFileSync(filePath, updatedContent);
  return true;
}

function findTsxFiles(dir) {
  let results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules')) {
      results = results.concat(findTsxFiles(filePath));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(filePath);
    }
  }
  
  return results;
}

// Main execution
const srcDir = path.join(__dirname, '..', 'src');
const tsxFiles = findTsxFiles(srcDir);

let updatedCount = 0;
for (const file of tsxFiles) {
  if (updateFileImports(file)) {
    updatedCount++;
  }
}

console.log(`Updated ${updatedCount} files with tree-shakable icon imports.`);
console.log('Icon import optimization complete!');