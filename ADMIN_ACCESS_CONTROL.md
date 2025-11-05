# Admin Access Control

## Overview

The admin opportunity requests page and related endpoints are now restricted to **only two specific email addresses**:

1. **veteransccsd@gmail.com**
2. **parker@stroomai.com**

No other accounts can access these admin features, regardless of their email domain.

## Protected Resources

### Pages

- `/admin/opportunity-requests` - Admin opportunity requests management page

### API Endpoints

- `POST /api/admin/search-opportunities` - Search for opportunities using Brave Search
- `POST /api/admin/approve-opportunities` - Approve and send opportunities to companies

## How It Works

### Centralized Configuration

Admin emails are managed in a single file: **`lib/config/admin.ts`**

```typescript
export const ADMIN_EMAILS = [
  "veteransccsd@gmail.com",
  "parker@stroomai.com",
] as const;

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase() as any);
}
```

### Access Control Implementation

**Client-side (Pages):**

```typescript
import { ADMIN_EMAILS } from '@/lib/config/admin'

// Check 1: During page load
const checkAdminAccess = async () => {
  if (!user?.email) return

  const isAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase() as any)

  if (!isAdmin) {
    toast({
      title: 'Access Denied',
      description: 'You do not have permission to access this page',
      variant: 'destructive'
    })
    router.push('/dashboard')
    return
  }
}

// Check 2: Before rendering page
if (!user?.email || !ADMIN_EMAILS.includes(user.email.toLowerCase() as any)) {
  return <AccessDenied />
}
```

**Server-side (API Routes):**

```typescript
import { isAdmin } from "@/lib/config/admin";

// Check user authentication first
const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser();

if (authError || !user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// Then check admin access
if (!isAdmin(user.email)) {
  return NextResponse.json({ error: "Admin access required" }, { status: 403 });
}
```

## Security Features

### Dual Protection

1. **Client-side**: Immediate redirect if unauthorized user tries to access
2. **Server-side**: API endpoints validate on every request

### Case-insensitive Matching

- Email comparison is done in lowercase
- `parker@stroomai.com` = `PARKER@STROOMAI.COM` ✅

### Null Safety

- Handles undefined/null emails gracefully
- No crashes if user object is missing

## Response Codes

| Code | Meaning      | When It Happens                 |
| ---- | ------------ | ------------------------------- |
| 401  | Unauthorized | User not logged in              |
| 403  | Forbidden    | User logged in but not an admin |
| 200  | Success      | Authorized admin access granted |

## User Experience

### Authorized Users

- ✅ Full access to admin panel
- ✅ Can search for opportunities
- ✅ Can approve and send opportunities
- ✅ See admin badge in UI

### Unauthorized Users

- ❌ Redirected to dashboard if trying to access `/admin/opportunity-requests`
- ❌ See "Access Denied" message
- ❌ API requests return 403 Forbidden
- ❌ Toast notification: "You do not have permission to access this page"

## Adding New Admins

To add a new admin email, simply update `lib/config/admin.ts`:

```typescript
export const ADMIN_EMAILS = [
  "veteransccsd@gmail.com",
  "parker@stroomai.com",
  "newadmin@example.com", // Add new admin here
] as const;
```

**No other changes needed** - all pages and endpoints will automatically recognize the new admin.

## Testing Admin Access

### Test as Admin

1. Sign in with `veteransccsd@gmail.com` or `parker@stroomai.com`
2. Navigate to `/admin/opportunity-requests`
3. Should see full admin interface ✅

### Test as Non-Admin

1. Sign in with any other email (e.g., `user@example.com`)
2. Try navigating to `/admin/opportunity-requests`
3. Should be redirected to dashboard with error message ✅
4. Try calling admin API endpoints directly
5. Should receive 403 Forbidden response ✅

## Database Security

**Note**: The admin access control is enforced at the application level, not the database level.

For additional security, consider adding Row Level Security (RLS) policies in Supabase to restrict `admin_notifications` table access:

```sql
-- Example RLS policy (optional)
CREATE POLICY "Only admins can view admin_notifications"
ON admin_notifications
FOR SELECT
USING (
  auth.jwt()->>'email' IN ('veteransccsd@gmail.com', 'parker@stroomai.com')
);
```

## Files Modified

### New Files

- ✅ `lib/config/admin.ts` - Centralized admin configuration

### Modified Files

- ✅ `app/(dashboard)/admin/opportunity-requests/page.tsx`
- ✅ `app/api/admin/search-opportunities/route.ts`
- ✅ `app/api/admin/approve-opportunities/route.ts`

## Advantages of This Approach

1. **Centralized Management**: All admin emails in one place
2. **Type Safety**: TypeScript ensures correct usage
3. **Reusable**: Easy to add admin checks to new pages/endpoints
4. **Maintainable**: Update once, applies everywhere
5. **Secure**: Both client and server-side validation
6. **Clear**: Easy to understand who has admin access

## Future Enhancements

Consider implementing:

- Admin roles (super admin, moderator, etc.)
- Database-backed admin permissions
- Admin activity logging
- Time-based admin access (temporary admins)
- IP-based restrictions for extra security
