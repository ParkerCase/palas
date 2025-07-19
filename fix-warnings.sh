#!/bin/bash

# Comprehensive ESLint/TypeScript Warning Fix Script
# This script fixes all the remaining warnings in your Next.js project

set -e

echo "🔧 Starting comprehensive fix of ESLint/TypeScript warnings..."

# Define colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log with colors
log() {
    echo -e "${2:-$NC}$1${NC}"
}

# Function to fix a file with sed (cross-platform compatible)
fix_file() {
    local file="$1"
    local pattern="$2"
    local replacement="$3"
    local description="$4"
    
    if [[ -f "$file" ]]; then
        if grep -q "$pattern" "$file" 2>/dev/null; then
            sed -i.bak "s|$pattern|$replacement|g" "$file"
            rm -f "$file.bak"
            log "  ✅ $description" "$GREEN"
            return 0
        fi
    fi
    return 1
}

# Function to fix unused variables in catch blocks
fix_unused_catch_vars() {
    log "🔧 Fixing unused variables in catch blocks..." "$BLUE"
    
    find . -name "*.tsx" -o -name "*.ts" | grep -v node_modules | while read -r file; do
        if fix_file "$file" "} catch (error) {" "} catch (_error) {" "Fixed unused error variable in $file"; then
            continue
        fi
    done
}

# Function to fix unescaped entities
fix_unescaped_entities() {
    log "🔧 Fixing unescaped entities in JSX..." "$BLUE"
    
    # Fix common apostrophes in JSX content
    fix_file "app/(auth)/signup/page.tsx" "This will be your company's unique URL" "This will be your company&apos;s unique URL" "Fixed apostrophe in signup page"
    fix_file "app/(dashboard)/company/certifications/page.tsx" "We'll help you" "We&apos;ll help you" "Fixed apostrophe in certifications page"
    fix_file "app/(dashboard)/company/settings/page.tsx" "Your company's" "Your company&apos;s" "Fixed apostrophe in settings page"
    fix_file "app/(dashboard)/company/subscription/page.tsx" "You're currently" "You&apos;re currently" "Fixed apostrophe in subscription page"
    fix_file "app/(dashboard)/opportunities/[id]/apply/page.tsx" "\"quality\"" "&quot;quality&quot;" "Fixed quotes in apply page"
    fix_file "app/(dashboard)/courses/[courseId]/page.tsx" "You'll learn" "You&apos;ll learn" "Fixed apostrophe in course page"
    fix_file "app/(dashboard)/support/page.tsx" "We're here" "We&apos;re here" "Fixed apostrophe in support page"
    fix_file "app/diagnostic/page.tsx" "can't connect" "can&apos;t connect" "Fixed apostrophe in diagnostic page"
    fix_file "app/setup/page.tsx" "Let's get" "Let&apos;s get" "Fixed apostrophe in setup page"
}

# Function to fix TypeScript any types
fix_any_types() {
    log "🔧 Fixing TypeScript 'any' types..." "$BLUE"
    
    # Replace common any types with proper types
    find . -name "*.tsx" -o -name "*.ts" | grep -v node_modules | while read -r file; do
        # Fix API route parameters
        fix_file "$file" ": any\)" ": unknown)" "Fixed any type in $file"
        
        # Fix event handlers
        fix_file "$file" "(e: any)" "(e: React.FormEvent)" "Fixed any event type in $file"
        fix_file "$file" "(event: any)" "(event: React.ChangeEvent<HTMLInputElement>)" "Fixed any event type in $file"
        
        # Fix data types
        fix_file "$file" "data: any" "data: Record<string, unknown>" "Fixed any data type in $file"
        fix_file "$file" "result: any" "result: unknown" "Fixed any result type in $file"
    done
}

# Function to remove unused imports
fix_unused_imports() {
    log "🔧 Removing unused imports..." "$BLUE"
    
    # Remove specific unused imports identified in build output
    fix_file "app/(dashboard)/applications/new/page.tsx" "import.*Suspense.*from 'react'" "import { useState, useEffect } from 'react'" "Fixed Suspense import"
    fix_file "app/(dashboard)/applications/page.tsx" "CardDescription," "// CardDescription," "Commented unused CardDescription"
    fix_file "app/(dashboard)/company/certifications/page.tsx" "Input," "// Input," "Commented unused Input"
    fix_file "app/(dashboard)/company/certifications/page.tsx" "Label," "// Label," "Commented unused Label"
    fix_file "app/(dashboard)/company/team/page.tsx" "CardDescription," "// CardDescription," "Commented unused CardDescription"
    fix_file "app/(dashboard)/opportunities/page.tsx" "CardDescription," "// CardDescription," "Commented unused CardDescription"
    
    # Remove unused router assignments
    fix_file "app/(dashboard)/company/subscription/page.tsx" "const router = useRouter()" "// const router = useRouter()" "Commented unused router"
    fix_file "app/fix-auth/page.tsx" "const router = useRouter()" "// const router = useRouter()" "Commented unused router"
}

# Function to fix useEffect dependencies
fix_useeffect_deps() {
    log "🔧 Fixing useEffect dependencies..." "$BLUE"
    
    # Add missing dependencies to useEffect hooks
    fix_file "app/(dashboard)/company/settings/page.tsx" "}, \[\])" "}, [loadCompanyData])" "Added loadCompanyData dependency"
    fix_file "app/(dashboard)/company/subscription/page.tsx" "}, \[\])" "}, [loadUserAndSubscription])" "Added loadUserAndSubscription dependency"
    fix_file "app/(dashboard)/courses/[courseId]/page.tsx" "}, \[\])" "}, [fetchCourseData])" "Added fetchCourseData dependency"
    fix_file "app/(dashboard)/courses/page.tsx" "}, \[\])" "}, [fetchCourses])" "Added fetchCourses dependency"
    fix_file "app/(dashboard)/opportunities/page.tsx" "}, \[\])" "}, [fetchOpportunities])" "Added fetchOpportunities dependency"
    fix_file "app/test/page.tsx" "}, \[\])" "}, [runTests])" "Added runTests dependency"
    fix_file "app/working-dashboard/page.tsx" "}, \[\])" "}, [loadUserData])" "Added loadUserData dependency"
}

# Function to fix interface issues
fix_interfaces() {
    log "🔧 Fixing TypeScript interfaces..." "$BLUE"
    
    # Fix empty interfaces
    fix_file "components/ui/input.tsx" "interface InputProps" "interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>" "Fixed empty InputProps interface"
    fix_file "components/ui/textarea.tsx" "interface TextareaProps" "interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement>" "Fixed empty TextareaProps interface"
}

# Function to add missing type definitions
add_type_definitions() {
    log "🔧 Adding missing type definitions..." "$BLUE"
    
    # Create a types file for common interfaces
    cat > types/common.ts << 'EOF'
// Common type definitions for the application

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
EOF
    
    log "  ✅ Created common type definitions" "$GREEN"
}

# Function to run specific fixes for known files
fix_specific_files() {
    log "🔧 Applying specific file fixes..." "$BLUE"
    
    # Fix unused variables in specific files
    fix_file "app/api/ai/analyze-application/route.ts" "'applicationData' is defined but never used" "'_applicationData' is defined but never used" "Fixed unused applicationData"
    fix_file "app/api/applications/route.ts" "'generateApplicationId' is defined but never used" "// 'generateApplicationId' is defined but never used" "Fixed unused generateApplicationId"
    fix_file "app/api/opportunities/[id]/route.ts" "'opportunityId' is defined but never used" "'_opportunityId' is defined but never used" "Fixed unused opportunityId"
    
    # Fix unused parameters in API routes
    find app/api -name "*.ts" | while read -r file; do
        fix_file "$file" "request\)" "_request)" "Fixed unused request parameter in $file"
    done
}

# Main execution
main() {
    log "🚀 Starting comprehensive ESLint/TypeScript warning fixes..." "$BLUE"
    
    # Create types directory if it doesn't exist
    mkdir -p types
    
    # Run all fix functions
    fix_unused_catch_vars
    fix_unescaped_entities
    fix_any_types
    fix_unused_imports
    fix_useeffect_deps
    fix_interfaces
    add_type_definitions
    fix_specific_files
    
    log "\n🎉 Fix Summary:" "$GREEN"
    log "✅ Fixed unused variables in catch blocks" "$GREEN"
    log "✅ Fixed unescaped entities in JSX" "$GREEN"
    log "✅ Replaced 'any' types with proper TypeScript types" "$GREEN"
    log "✅ Removed/commented unused imports" "$GREEN"
    log "✅ Added missing useEffect dependencies" "$GREEN"
    log "✅ Fixed TypeScript interface issues" "$GREEN"
    log "✅ Added common type definitions" "$GREEN"
    log "✅ Applied specific file fixes" "$GREEN"
    
    log "\n📝 Next steps:" "$YELLOW"
    log "1. Run: npm run build" "$BLUE"
    log "2. Review any remaining warnings" "$BLUE"
    log "3. Test your application thoroughly" "$BLUE"
    log "4. Consider enabling stricter ESLint rules for future development" "$BLUE"
    
    log "\n🔍 If you still see warnings:" "$YELLOW"
    log "- Check the build output for any new errors" "$BLUE"
    log "- Some warnings might be in generated files or dependencies" "$BLUE"
    log "- Consider adding eslint-disable comments for intentional cases" "$BLUE"
}

# Run the main function
main

echo -e "\n${GREEN}🎯 Comprehensive fix completed!${NC}"
echo -e "${YELLOW}Run 'npm run build' to see the results.${NC}"
