#!/usr/bin/env node

/**
 * Precise TypeScript/ESLint Warning Fixer
 * Handles complex pattern matching and replacement for TypeScript issues
 */

const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Read and fix a file with multiple patterns
 */
function fixFile(filePath, fixes) {
  if (!fs.existsSync(filePath)) {
    return { success: false, message: `File not found: ${filePath}` };
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  let appliedFixes = [];

  fixes.forEach(fix => {
    const { pattern, replacement, description } = fix;
    
    if (typeof pattern === 'string') {
      if (content.includes(pattern)) {
        content = content.replace(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
        appliedFixes.push(description);
      }
    } else if (pattern instanceof RegExp) {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        appliedFixes.push(description);
      }
    }
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    return { success: true, fixes: appliedFixes };
  }

  return { success: true, fixes: [] };
}

/**
 * Fix specific files with their known issues
 */
function fixSpecificFiles() {
  log('🔧 Fixing specific file issues...', 'blue');

  const fileFixes = [
    // Login page - remove unused router
    {
      file: './app/(auth)/login/page.tsx',
      fixes: [
        {
          pattern: 'const router = useRouter()',
          replacement: '// const router = useRouter() // Removed - using window.location.href instead',
          description: 'Removed unused router variable'
        }
      ]
    },

    // Applications new page - fix Suspense import and any types
    {
      file: './app/(dashboard)/applications/new/page.tsx',
      fixes: [
        {
          pattern: /import.*Suspense.*from 'react'/,
          replacement: "import { useState, useEffect } from 'react'",
          description: 'Fixed Suspense import'
        },
        {
          pattern: /: any/g,
          replacement: ': unknown',
          description: 'Fixed any types'
        }
      ]
    },

    // Applications page - remove unused imports
    {
      file: './app/(dashboard)/applications/page.tsx',
      fixes: [
        {
          pattern: /import.*CardDescription.*from/,
          replacement: 'import { Card, CardContent, CardHeader, CardTitle } from',
          description: 'Removed unused CardDescription import'
        },
        {
          pattern: /import.*Filter.*from/,
          replacement: '// import { Filter } from',
          description: 'Commented unused Filter import'
        }
      ]
    },

    // Company certifications page
    {
      file: './app/(dashboard)/company/certifications/page.tsx',
      fixes: [
        {
          pattern: "We'll help you",
          replacement: "We&apos;ll help you",
          description: 'Fixed unescaped apostrophe'
        }
      ]
    },

    // Company settings page
    {
      file: './app/(dashboard)/company/settings/page.tsx',
      fixes: [
        {
          pattern: /useEffect\(\(\) => \{\s*loadCompanyData\(\);\s*\}, \[\]\);/,
          replacement: 'useEffect(() => { loadCompanyData(); }, [loadCompanyData]);',
          description: 'Added missing loadCompanyData dependency'
        },
        {
          pattern: "Your company's",
          replacement: "Your company&apos;s",
          description: 'Fixed unescaped apostrophe'
        }
      ]
    },

    // Company subscription page
    {
      file: './app/(dashboard)/company/subscription/page.tsx',
      fixes: [
        {
          pattern: 'const router = useRouter()',
          replacement: '// const router = useRouter() // Removed - not used',
          description: 'Removed unused router variable'
        },
        {
          pattern: /useEffect\(\(\) => \{\s*loadUserAndSubscription\(\);\s*\}, \[\]\);/,
          replacement: 'useEffect(() => { loadUserAndSubscription(); }, [loadUserAndSubscription]);',
          description: 'Added missing loadUserAndSubscription dependency'
        },
        {
          pattern: "You're currently",
          replacement: "You&apos;re currently",
          description: 'Fixed unescaped apostrophe'
        }
      ]
    },

    // UI components
    {
      file: './components/ui/input.tsx',
      fixes: [
        {
          pattern: /interface InputProps\s*\{\s*\}/,
          replacement: 'interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}',
          description: 'Fixed empty InputProps interface'
        }
      ]
    },

    {
      file: './components/ui/textarea.tsx',
      fixes: [
        {
          pattern: /interface TextareaProps\s*\{\s*\}/,
          replacement: 'interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}',
          description: 'Fixed empty TextareaProps interface'
        }
      ]
    }
  ];

  let totalFixed = 0;
  let totalFixes = 0;

  fileFixes.forEach(({ file, fixes }) => {
    const result = fixFile(file, fixes);
    if (result.success && result.fixes && result.fixes.length > 0) {
      log(`✅ Fixed: ${file}`, 'green');
      result.fixes.forEach(fix => log(`   - ${fix}`, 'blue'));
      totalFixed++;
      totalFixes += result.fixes.length;
    } else if (result.success) {
      log(`⚪ No changes needed: ${file}`, 'yellow');
    } else {
      log(`❌ Error: ${result.message}`, 'red');
    }
  });

  return { totalFixed, totalFixes };
}

/**
 * Fix TypeScript 'any' types across all files
 */
function fixAnyTypes() {
  log('🔧 Fixing TypeScript any types globally...', 'blue');

  const fixes = [
    { pattern: ': any)', replacement: ': unknown)', description: 'Fixed any type' },
    { pattern: ': any,', replacement: ': unknown,', description: 'Fixed any type' },
    { pattern: ': any;', replacement: ': unknown;', description: 'Fixed any type' },
    { pattern: ': any =', replacement: ': Record<string, unknown> =', description: 'Fixed any type' },
    { pattern: ': any[]', replacement: ': unknown[]', description: 'Fixed any array type' },
    { pattern: '(e: any)', replacement: '(e: React.FormEvent)', description: 'Fixed any event type' },
    { pattern: '(event: any)', replacement: '(event: React.ChangeEvent<HTMLInputElement>)', description: 'Fixed any event type' },
    { pattern: 'data: any', replacement: 'data: Record<string, unknown>', description: 'Fixed any data type' },
    { pattern: 'result: any', replacement: 'result: unknown', description: 'Fixed any result type' }
  ];

  // Find all TypeScript files
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

  const tsFiles = findTsFiles('./');
  let fixedFiles = 0;

  tsFiles.forEach(file => {
    const result = fixFile(file, fixes);
    if (result.success && result.fixes && result.fixes.length > 0) {
      fixedFiles++;
    }
  });

  log(`   Fixed any types in ${fixedFiles} files`, 'green');
  return fixedFiles;
}

/**
 * Fix unused catch variables
 */
function fixUnusedCatchVars() {
  log('🔧 Fixing unused catch variables...', 'blue');

  const fixes = [
    { pattern: '} catch (error) {', replacement: '} catch (_error) {', description: 'Fixed unused error variable' }
  ];

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

  const tsFiles = findTsFiles('./');
  let fixedFiles = 0;

  tsFiles.forEach(file => {
    const result = fixFile(file, fixes);
    if (result.success && result.fixes && result.fixes.length > 0) {
      fixedFiles++;
    }
  });

  log(`   Fixed unused catch variables in ${fixedFiles} files`, 'green');
  return fixedFiles;
}

/**
 * Create common type definitions
 */
function createTypeDefinitions() {
  log('🔧 Creating common type definitions...', 'blue');

  // Ensure types directory exists
  if (!fs.existsSync('./types')) {
    fs.mkdirSync('./types');
  }

  const commonTypes = `// Common type definitions for the application

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface FormData {
  [key: string]: string | number | boolean;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SearchParams extends PaginationParams {
  query?: string;
  filters?: Record<string, unknown>;
}

export interface OpportunityData {
  estimated_value_min?: number;
  estimated_value_max?: number;
  title?: string;
  description?: string;
  agency?: string;
  due_date?: string;
  solicitation_number?: string;
  naics_codes?: string[];
  requirements?: string[];
}

export interface ApplicationData {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  form_data?: Record<string, unknown>;
  opportunities?: OpportunityData;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}
`;

  fs.writeFileSync('./types/common.ts', commonTypes, 'utf8');
  log('   ✅ Created common type definitions in types/common.ts', 'green');
}

/**
 * Main execution function
 */
function main() {
  log('🚀 Starting precise TypeScript/ESLint warning fixes...', 'blue');

  const results = {
    specificFiles: fixSpecificFiles(),
    anyTypes: fixAnyTypes(),
    catchVars: fixUnusedCatchVars()
  };

  createTypeDefinitions();

  log('\n🎉 Fix Summary:', 'green');
  log(`✅ Fixed ${results.specificFiles.totalFixed} specific files with ${results.specificFiles.totalFixes} total fixes`, 'green');
  log(`✅ Fixed any types in ${results.anyTypes} files`, 'green');
  log(`✅ Fixed unused catch variables in ${results.catchVars} files`, 'green');
  log('✅ Created common type definitions', 'green');

  log('\n📝 Next steps:', 'yellow');
  log('1. Run: npm run build', 'blue');
  log('2. Review any remaining warnings', 'blue');
  log('3. Test your application thoroughly', 'blue');
  log('4. Import types from types/common.ts where needed', 'blue');

  log('\n🔍 If you still see warnings:', 'yellow');
  log('- Check for warnings in API routes that may need custom types', 'blue');
  log('- Some warnings might be acceptable and can be disabled with eslint-disable', 'blue');
  log('- Consider updating your ESLint config for stricter rules', 'blue');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { fixFile, fixSpecificFiles, fixAnyTypes, fixUnusedCatchVars };
