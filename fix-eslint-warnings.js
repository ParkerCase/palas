const fs = require('fs');
const path = require('path');

// Files with unused imports that need to be fixed
const filesToFix = [
  {
    file: 'app/(auth)/login/page.tsx',
    removeImports: ['CardHeader', 'CardTitle']
  },
  {
    file: 'app/(dashboard)/admin/opportunity-requests/page.tsx',
    removeImports: ['Filter', 'Calendar', 'DollarSign', 'Star', 'MapPin', 'Mail', 'CheckCircle', 'AlertCircle', 'Info', 'ArrowRight', 'Users']
  },
  {
    file: 'app/(dashboard)/analytics/page.tsx',
    removeImports: ['Title', 'BarChart3', 'PieChart', 'Calendar', 'Filter', 'Users', 'Award', 'CheckCircle']
  },
  {
    file: 'app/(dashboard)/applications/new/page.tsx',
    removeImports: ['useState', 'useEffect']
  },
  {
    file: 'app/(dashboard)/applications/page.tsx',
    removeImports: ['CardHeader', 'CardTitle']
  },
  {
    file: 'app/(dashboard)/company/certifications/page.tsx',
    removeImports: ['Input', 'Label', 'Select', 'SelectContent', 'SelectItem', 'SelectTrigger', 'SelectValue', 'Building2', 'Certification']
  },
  {
    file: 'app/(dashboard)/company/page.tsx',
    removeImports: ['ClipboardCheck']
  },
  {
    file: 'app/(dashboard)/company/subscription/page.tsx',
    removeImports: ['useRouter']
  },
  {
    file: 'app/(dashboard)/company/team/page.tsx',
    removeImports: ['CardTitle', 'Input', 'Label', 'Textarea', 'Select', 'SelectContent', 'SelectItem', 'SelectTrigger', 'SelectValue', 'Trash', 'MoreHorizontal', 'TeamMember']
  },
  {
    file: 'app/(dashboard)/courses/page.tsx',
    removeImports: ['Video']
  },
  {
    file: 'app/(dashboard)/dashboard/page.tsx',
    removeImports: ['Search', 'Plus', 'Settings', 'CheckCircle', 'DollarSign', 'Building', 'Calendar', 'Users']
  },
  {
    file: 'app/(dashboard)/opportunities/page.tsx',
    removeImports: ['Input', 'Search', 'Filter', 'DollarSign', 'Star', 'MapPin', 'CheckCircle', 'ArrowRight']
  },
  {
    file: 'app/(dashboard)/support/page.tsx',
    removeImports: ['FileText']
  },
  {
    file: 'components/company/BiddingChecklist.tsx',
    removeImports: ['getProgressColor']
  },
  {
    file: 'components/construction/ConstructionIntelligenceDashboard.tsx',
    removeImports: ['FileText', 'CheckCircle', 'Activity']
  },
  {
    file: 'components/dashboard/DashboardNav.tsx',
    removeImports: ['isSearchFocused']
  },
  {
    file: 'components/dashboard/DashboardSidebar.tsx',
    removeImports: ['BarChart3', 'Settings', 'Users', 'Brain', 'Crown']
  },
  {
    file: 'components/dashboard/DashboardStats.tsx',
    removeImports: ['CardHeader', 'CardTitle']
  },
  {
    file: 'components/dashboard/QuickActions.tsx',
    removeImports: ['Button']
  },
  {
    file: 'components/education/EducationIntelligenceDashboard.tsx',
    removeImports: ['AlertCircle', 'Clock', 'getPriorityIcon']
  },
  {
    file: 'components/forms/JurisdictionSelector.tsx',
    removeImports: ['useEffect', 'getCaliforniaCounties', 'getCitiesByCounty', 'CaliforniaLocation']
  },
  {
    file: 'components/government/GovernmentIntelligenceDashboard.tsx',
    removeImports: ['FileText', 'CheckCircle', 'Activity', 'Shield', 'Scale']
  },
  {
    file: 'components/healthcare/HealthcareIntelligenceDashboard.tsx',
    removeImports: ['FileText', 'CheckCircle']
  },
  {
    file: 'components/manufacturing/ManufacturingIntelligenceDashboard.tsx',
    removeImports: ['FileText', 'CheckCircle', 'Activity', 'Package', 'Truck']
  },
  {
    file: 'components/ui/california-location-selector.tsx',
    removeImports: ['useEffect', 'CaliforniaCounty', 'getLocationType']
  }
];

function removeUnusedImports(filePath, importsToRemove) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    // Remove unused imports from import statements
    importsToRemove.forEach(importName => {
      // Pattern to match import statements with the specific import
      const importPattern = new RegExp(`\\b${importName}\\b`, 'g');
      
      // Check if the import is actually used in the file
      const usagePattern = new RegExp(`\\b${importName}\\b`, 'g');
      const usageMatches = content.match(usagePattern);
      
      if (usageMatches && usageMatches.length === 1) {
        // Only one occurrence means it's only in the import statement
        // Remove it from the import statement
        content = content.replace(importPattern, '');
        modified = true;
        console.log(`✅ Removed unused import: ${importName} from ${filePath}`);
      }
    });

    // Clean up empty import statements
    content = content.replace(/import\s*{\s*}\s*from\s*['"][^'"]+['"];?\s*/g, '');
    content = content.replace(/import\s*{\s*,+\s*}\s*from\s*['"][^'"]+['"];?\s*/g, '');
    content = content.replace(/,\s*,/g, ',');
    content = content.replace(/{\s*,/g, '{');
    content = content.replace(/,\s*}/g, '}');

    if (modified) {
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Updated: ${filePath}`);
    } else {
      console.log(`ℹ️  No changes needed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

console.log('🔧 Fixing ESLint warnings...\n');

filesToFix.forEach(({ file, removeImports }) => {
  removeUnusedImports(file, removeImports);
});

console.log('\n✅ ESLint warning fixes completed!');
console.log('\n📝 Note: Some warnings may still remain. You can:');
console.log('   1. Run "npm run build" to check remaining issues');
console.log('   2. Add "// eslint-disable-next-line" comments for specific warnings');
console.log('   3. Update .eslintrc.json to disable specific rules if needed');
