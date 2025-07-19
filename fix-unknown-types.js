#!/usr/bin/env node

/**
 * Final TypeScript fix script
 * This script fixes the remaining type issues by replacing all instances of accessing properties on 'unknown' types
 */

const fs = require('fs');
const path = require('path');

function fixUnknownTypeAccesses(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Fix common patterns where we access properties on unknown types
  const fixes = [
    // Pattern: finance.unitid where finance is unknown
    {
      pattern: /(\w+)\.forEach\((\w+) => \{[\s\S]*?\2\.(\w+)/g,
      replacement: (match, arrayVar, itemVar, prop) => {
        return match.replace(new RegExp(`${itemVar}\\.${prop}`, 'g'), `(${itemVar} as Record<string, unknown>).${prop}`);
      }
    },
    // Pattern: object.property where object is of type unknown
    {
      pattern: /(\w+) => \{\s*(\w+)Map\.set\((\w+)\.(\w+), \3\)/g,
      replacement: (match, param, mapName, obj, prop) => {
        return match.replace(`${obj}.${prop}`, `(${obj} as Record<string, unknown>).${prop}`);
      }
    },
    // Pattern: award['Property'] where award is unknown
    {
      pattern: /(\w+)\.forEach\((\w+) => \{[\s\S]*?\2\[['"][^'"]+['"]\]/g,
      replacement: (match, arrayVar, itemVar) => {
        return match.replace(new RegExp(`${itemVar}\\[`, 'g'), `(${itemVar} as Record<string, unknown>)[`);
      }
    }
  ];

  // Apply global replacements for common unknown type access patterns
  const globalReplacements = [
    // Replace .forEach(item => { with .forEach((item: unknown) => {
    { from: /\.forEach\((\w+) =>/g, to: '.forEach(($1: unknown) =>' },
    
    // Replace item.property with (item as Record<string, unknown>).property
    { from: /(\w+)\.(\w+)(?=\s*[,\]\)\}])/g, to: '($1 as Record<string, unknown>).$2' },
    
    // Fix specific patterns
    { from: /financeMap\.set\(finance\.unitid, finance\)/g, to: 'financeMap.set((finance as Record<string, unknown>).unitid, finance)' },
    { from: /\.map\((\w+) => \(\{/g, to: '.map(($1: unknown) => ({' },
    { from: /\.map\((\w+) => \{/g, to: '.map(($1: unknown) => {' },
    { from: /\.filter\((\w+) => /g, to: '.filter(($1: unknown) => ' },
  ];

  globalReplacements.forEach(({ from, to }) => {
    if (from.test(content)) {
      content = content.replace(from, to);
    }
  });

  // Fix specific access patterns after the type annotations
  const specificFixes = [
    { from: /\((\w+): unknown\) as Record<string, unknown>\)\.(\w+)/g, to: '($1 as Record<string, unknown>).$2' },
    { from: /\(\((\w+) as Record<string, unknown>\) as Record<string, unknown>\)/g, to: '($1 as Record<string, unknown>)' },
  ];

  specificFixes.forEach(({ from, to }) => {
    content = content.replace(from, to);
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed unknown type accesses in: ${filePath}`);
    return true;
  }

  return false;
}

function findTsFiles(dir) {
  const files = [];
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    items.forEach(item => {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory() && item !== 'node_modules' && item !== '.next') {
        traverse(fullPath);
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        files.push(fullPath);
      }
    });
  }
  traverse(dir);
  return files;
}

function main() {
  console.log('🔧 Fixing unknown type accesses...');
  
  const tsFiles = findTsFiles('./');
  let fixedFiles = 0;

  tsFiles.forEach(file => {
    if (fixUnknownTypeAccesses(file)) {
      fixedFiles++;
    }
  });

  console.log(`✅ Fixed unknown type accesses in ${fixedFiles} files`);
}

if (require.main === module) {
  main();
}
