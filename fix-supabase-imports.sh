#!/bin/bash

echo "🔧 Fixing Supabase imports across the project..."

# Find all TypeScript and JavaScript files that import from @supabase/supabase-js
find /Users/parkercase/govcontract-ai -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | \
xargs grep -l "createRouteHandlerClient.*@supabase/supabase-js\|createClientComponentClient.*@supabase/supabase-js\|createServerComponentClient.*@supabase/supabase-js" | \
while read file; do
    echo "Fixing: $file"
    
    # Replace Supabase imports
    sed -i '' 's|createRouteHandlerClient.*from.*@supabase/supabase-js|createRouteHandlerClient } from '\''@/lib/supabase/client'\''|g' "$file"
    sed -i '' 's|createClientComponentClient.*from.*@supabase/supabase-js|createClientComponentClient } from '\''@/lib/supabase/client'\''|g' "$file"
    sed -i '' 's|createServerComponentClient.*from.*@supabase/supabase-js|createServerComponentClient } from '\''@/lib/supabase/client'\''|g' "$file"
    
    # Remove { cookies } import if it's only used for Supabase
    if ! grep -q "cookies" "$file" | grep -v "createRouteHandlerClient\|createServerComponentClient"; then
        sed -i '' '/import.*cookies.*from.*next\/headers/d' "$file"
    fi
    
    # Fix createRouteHandlerClient calls to remove { cookies } parameter
    sed -i '' 's|createRouteHandlerClient({ cookies })|createRouteHandlerClient()|g' "$file"
done

echo "✅ Supabase imports fixed!"
