#!/bin/bash

echo "🔧 Fixing remaining compilation issues..."

# Fix user null checks
find /Users/parkercase/govcontract-ai/app -name "*.tsx" | while read file; do
    if grep -q "user\.id" "$file" && grep -q "user.*null" "$file"; then
        echo "Adding user null check: $file"
        
        # Add user null check before using user.id
        sed -i '' 's/user\.id/user?.id/g' "$file"
        
        # Add return early if no user
        if grep -q "loadApplications" "$file"; then
            sed -i '' '/const loadApplications/i\
  if (!user) return' "$file"
        fi
    fi
done

echo "✅ Compilation fixes applied!"
