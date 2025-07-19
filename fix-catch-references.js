#!/usr/bin/env node

/**
 * Fix catch block variable references
 * Finds cases where catch(_error) but still references 'error' inside the block
 */

const fs = require('fs');
const path = require('path');

function fixCatchReferences(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Pattern to find catch(_error) { ... error ... }
  const catchPattern = /} catch \(_error\) \{([^}]*?error[^}]*?)\}/gs;
  
  content = content.replace(catchPattern, (match, catchBody) => {
    // If the catch body references 'error', change the parameter back to 'error'
    if (catchBody.includes('error')) {
      return match.replace('} catch (_error) {', '} catch (error) {');
    }
    return match;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed catch references in: ${filePath}`);
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
  console.log('🔧 Fixing catch block variable references...');
  
  const tsFiles = findTsFiles('./');
  let fixedFiles = 0;

  tsFiles.forEach(file => {
    if (fixCatchReferences(file)) {
      fixedFiles++;
    }
  });

  console.log(`✅ Fixed catch references in ${fixedFiles} files`);
}

if (require.main === module) {
  main();
}
