# Quick Reference Guide

Quick reference for common authentication and routing tasks.

## Routes

### Public Routes
- `/auth/signin` - Login page
- `/auth/signup` - Signup page
- `/auth/logout` - Logout handler (redirects to signin)
- `/auth/firm-registration` - Firm registration landing page
- `/auth/accept-terms` - Terms acceptance page (requires auth)
- `/terms` - Terms of Use
- `/privacy` - Privacy Policy
- `/portal-agreement` - Client Portal Agreement

### Protected Routes
- `/dashboard` - Main dashboard (requires auth + firm)
- `/dashboard/firm-setup` - Firm setup (requires auth, no firm)
- `/dashboard/clients` - Clients list (requires auth + firm)
- `/dashboard/matters` - Matters list (requires auth + firm)
- `/dashboard/aml` - AML Checks (requires auth + firm)
- `/dashboard/settings` - Settings (requires auth + firm)

## Post-Login Routing Priority

1. **Terms Acceptance** → `/auth/accept-terms`
2. **Firm Setup** → `/dashboard/firm-setup`
3. **Dashboard** → `/dashboard`

## Key Functions

### Logout
```typescript
// Server-side (recommended)
window.location.href = '/auth/logout'

// Client-side utility
import { handleClientLogout } from '@/lib/logout'
await handleClientLogout()
```

### Check Terms Acceptance
```typescript
import { needsTermsAcceptance, CURRENT_TERMS_VERSION } from '@/lib/terms-config'

const needsAcceptance = needsTermsAcceptance(
  profile.terms_version,
  profile.terms_accepted_at
)
```

### Post-Login Routing
```typescript
import { getPostLoginRoute } from '@/lib/post-login-routing'

const route = await getPostLoginRoute(userId)
if (route.shouldRedirect) {
  redirect(route.redirectTo)
}
```

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_ALLOW_DEV_SIGNUP=true  # Optional
```

## Database Fields

### profiles table
- `terms_accepted_at` - Timestamp when user accepted terms
- `terms_version` - Version of terms user accepted (e.g., "1.0")
- `privacy_accepted_at` - Timestamp when user acknowledged privacy policy
- `firm_id` - Foreign key to firms table (nullable)

## Terms Versioning

To update terms:
1. Update content on `/terms` page
2. Increment `CURRENT_TERMS_VERSION` in `lib/terms-config.ts`
3. Users will be prompted to accept on next login

## Common Patterns

### Check if user has firm
```typescript
const { profile } = useAuth()
const hasFirm = Boolean(profile?.firm_id)
```

### Redirect if no firm
```typescript
if (!profile?.firm_id) {
  router.push('/dashboard/firm-setup')
}
```

### Check authentication
```typescript
const { session, loading } = useAuth()

if (loading) return <Loading />
if (!session) {
  router.push('/auth/signin')
  return null
}
```

## Debugging

### Logout Issues
Check browser DevTools:
1. Application → Cookies
2. Verify cookies are cleared after logout
3. Check Network tab for logout request

### Session Issues
Check:
- `lib/session.ts` - Session utilities
- `app/auth/logout/route.ts` - Logout handler
- Database `sessions` table - Verify `is_valid = false` after logout

### Routing Issues
Check:
- `lib/post-login-routing.ts` - Routing logic
- `app/dashboard/layout.tsx` - Client-side redirects
- Browser console for redirect loops

## Testing

Run manual tests from `docs/manual-auth-tests.md`:
- Test 1: Login with firm
- Test 2: Login without firm
- Test 4: Logout flow
- Test 7: Updated terms flow

## Code Comments

Key files have comments explaining:
- Post-login routing decisions
- Logout logic
- Terms acceptance flow
- Route guards

Look for `//` comments in:
- `app/dashboard/layout.tsx`
- `app/auth/logout/route.ts`
- `lib/post-login-routing.ts`
- `app/auth/accept-terms/page.tsx`
