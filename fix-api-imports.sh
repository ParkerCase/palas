#!/bin/bash

echo "🔧 Fixing API route imports..."

# Fix all API routes to use server import
find /Users/parkercase/govcontract-ai/app/api -name "*.ts" | while read file; do
    echo "Fixing API route: $file"
    sed -i '' 's|@/lib/supabase/client|@/lib/supabase/server|g' "$file"
done

echo "✅ API route imports fixed!"
