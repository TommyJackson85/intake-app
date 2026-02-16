# Authentication Flow Documentation

This document describes the authentication, routing, and logout flows in the LawIntake application.

## Overview

The application uses Supabase for authentication with a custom session management system. Users are lawyers/firm admins who must:
1. Authenticate (login)
2. Accept terms of use (if not already accepted or if terms have been updated)
3. Set up their firm (if they don't have one)
4. Access the main dashboard

## Login Flow

### Client Flow

1. User visits `/auth/signin`
2. User enters email and password
3. Client calls Supabase `signInWithPassword()`
4. On success, client redirects to `/dashboard`

### Server/Session Flow

1. Supabase authenticates the user
2. Custom session is created in the `sessions` table
3. Session cookies are set:
   - `session_token` (session ID)
   - `user_id` (user ID)
   - `firm_id` (if user has a firm)

### Post-Login Routing

After successful login, the application checks:

1. **Terms Acceptance** (highest priority)
   - If `terms_version` doesn't match `CURRENT_TERMS_VERSION` OR `terms_accepted_at` is null
   - → Redirect to `/auth/accept-terms`

2. **Firm Setup**
   - If `firm_id` is null
   - → Redirect to `/dashboard/firm-setup`

3. **Dashboard**
   - If user has accepted terms and has a firm
   - → Allow access to `/dashboard`

The routing logic is implemented in:
- `lib/post-login-routing.ts` (server-side utility)
- `app/dashboard/layout.tsx` (client-side redirect)

## Logout Flow

### How Logout Works

1. **User clicks "Sign Out"**
   - Link in dashboard sidebar points to `/auth/logout`

2. **Server-side logout handler** (`app/auth/logout/route.ts`)
   - Gets user ID from session cookie
   - Invalidates all sessions for that user in the database (`sessions.is_valid = false`)
   - Clears all session cookies:
     - `session_token`
     - `user_id`
     - `firm_id`
     - `_csrf`
   - Signs out from Supabase auth (clears Supabase session)
   - Redirects to `/auth/signin`

3. **Client-side cleanup** (if using client logout utility)
   - Clears Supabase session
   - Clears localStorage and sessionStorage
   - Redirects to server logout route

### Logout Reliability

The logout handler ensures:
- ✅ Database sessions are invalidated
- ✅ All cookies are cleared (with explicit expiration)
- ✅ Supabase auth session is cleared
- ✅ Redirects to public route that doesn't auto-reauthenticate

### Debugging Logout

Logout includes console logging:
- `[Logout] Logout handler called`
- `[Logout] Invalidating sessions for user: <userId>`
- `[Logout] Clearing session cookies`
- `[Logout] Supabase auth signout completed`
- `[Logout] Logout completed successfully, redirecting to login`

## Firm Setup Flow

### New Lawyer Without Firm

1. User logs in successfully
2. Post-login routing detects `firm_id` is null
3. User is redirected to `/dashboard/firm-setup`
4. User completes firm setup form:
   - Firm name (required)
   - State/Jurisdiction (required)
   - Contact email (optional)
5. On submission:
   - Firm record is created in `firms` table
   - User's `profiles.firm_id` is updated
   - `firm_id` cookie is set
   - User is redirected to `/dashboard`

### Lawyer With Existing Firm

1. User logs in successfully
2. Post-login routing detects `firm_id` exists
3. User goes directly to `/dashboard`

## Terms Acceptance Flow

### Account Creation

1. User signs up at `/auth/signup`
2. User must check "I agree to Terms of Use" checkbox
3. On account creation:
   - `terms_accepted_at` is set to current timestamp
   - `terms_version` is set to `CURRENT_TERMS_VERSION`
   - `privacy_accepted_at` is set to current timestamp

### Updated Terms Flow

1. User logs in
2. Post-login routing checks if `terms_version` matches `CURRENT_TERMS_VERSION`
3. If not:
   - User is redirected to `/auth/accept-terms`
   - User sees explanation that terms have been updated
   - User must check "I agree to updated Terms of Use"
   - On acceptance:
     - `terms_accepted_at` is updated
     - `terms_version` is updated to `CURRENT_TERMS_VERSION`
   - User is redirected to dashboard (or firm-setup if needed)

### Terms Versioning

- Current version is defined in `lib/terms-config.ts` as `CURRENT_TERMS_VERSION`
- To update terms:
  1. Update terms content on `/terms` page
  2. Increment `CURRENT_TERMS_VERSION` in `lib/terms-config.ts`
  3. Users will be prompted to accept updated terms on next login

## Sequence Diagrams

### User Logs In

```
User → Login Page → Submit Credentials
  ↓
Supabase Auth → Authenticate
  ↓
Create Session → Set Cookies
  ↓
Check Terms → [If outdated] → Accept Terms Page
  ↓
Check Firm → [If missing] → Firm Setup Page
  ↓
Dashboard
```

### User Logs Out

```
User → Click Sign Out
  ↓
Logout Handler → Get User ID
  ↓
Invalidate Sessions → Clear Cookies → Supabase Sign Out
  ↓
Redirect → Login Page
```

### New Lawyer Logs In Without Firm

```
Lawyer → Login → Success
  ↓
Check Terms → [Accepted] ✓
  ↓
Check Firm → [Missing] ✗
  ↓
Redirect → Firm Setup Page
  ↓
Complete Form → Create Firm → Update Profile
  ↓
Redirect → Dashboard
```

## Middleware and Route Guards

### Dashboard Layout Guard

The `app/dashboard/layout.tsx` component:
- Checks if user is authenticated (via `useAuth()`)
- Redirects to `/auth/signin` if not authenticated
- Redirects to `/dashboard/firm-setup` if user has no firm (unless already on firm-setup page)

### Protected Routes

Routes under `/dashboard/*` are protected by the dashboard layout guard.

Public routes:
- `/auth/signin`
- `/auth/signup`
- `/auth/logout` (handles its own auth check)
- `/terms`
- `/privacy`
- `/portal-agreement`
- `/` (homepage)

## Session Management

### Session Storage

- **Database**: `sessions` table stores session records with:
  - `user_id`
  - `token_hash`
  - `is_valid` (boolean)
  - `expires_at`
  - `ip_address`
  - `user_agent`

- **Cookies**: HttpOnly cookies store:
  - `session_token` (session ID)
  - `user_id` (user ID)
  - `firm_id` (firm ID, if user has firm)

### Session Verification

Server-side routes use `getUserId()` and `getSessionToken()` from `lib/session.ts` to:
1. Read cookies
2. Verify session exists and is valid in database
3. Return user/firm IDs

## Error Handling

### Login Errors

- Invalid credentials → Error message displayed
- Email not confirmed → Special message with resend link
- Network errors → Generic error message

### Logout Errors

- Best-effort approach: Even if some steps fail, cookies are cleared and user is redirected
- Errors are logged but don't block logout

### Terms Acceptance Errors

- If acceptance fails → Error message displayed, user can retry
- User can cancel → Redirects to logout

## Security Considerations

1. **Session Cookies**: HttpOnly, Secure (in production), SameSite=Strict
2. **Session Expiration**: 30 minutes default
3. **Session Invalidation**: All sessions invalidated on logout
4. **Password Security**: Handled by Supabase (hashing, etc.)
5. **Rate Limiting**: Login attempts are rate-limited (see `lib/rate-limit.ts`)

## Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:
- `NEXT_PUBLIC_ALLOW_DEV_SIGNUP` (for developer test accounts)
