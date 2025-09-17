#!/bin/bash

echo "🚀 APPLYING BIDDING CHECKLIST FILE UPLOADS MIGRATION"
echo "=================================================="

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if we're linked to a project
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase. Please run:"
    echo "supabase login"
    exit 1
fi

echo "📋 Migration file: supabase/migrations/20241201000004_bidding_checklist_file_uploads.sql"
echo ""

# Apply the migration
echo "🔄 Applying migration..."
supabase db push --include-all

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "📁 Created resources:"
    echo "  - Storage bucket: bidding-checklist-files"
    echo "  - Table: checklist_files"
    echo "  - Table: ai_analysis_queue"
    echo "  - View: checklist_files_with_company"
    echo "  - RLS policies for security"
    echo "  - Triggers for auto-processing"
    echo ""
    echo "🎯 Next steps:"
    echo "  1. Test file upload functionality"
    echo "  2. Verify AI analysis queue processing"
    echo "  3. Check RLS policies are working"
    echo ""
else
    echo "❌ Migration failed!"
    echo "Please check the error messages above and fix any issues."
    exit 1
fi
