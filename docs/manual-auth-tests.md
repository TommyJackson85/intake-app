# Manual Authentication Test Checklist

Use this checklist to manually verify the authentication flows work correctly.

## Prerequisites

- [ ] Database migration for terms acceptance has been run
- [ ] Environment variables are configured
- [ ] Application is running locally or on staging

## Test 1: Login and Redirect (User With Firm)

**Goal**: Verify users with existing firms go directly to dashboard.

1. [ ] Create a test user account with a firm (or use existing)
2. [ ] Navigate to `/auth/signin`
3. [ ] Enter valid credentials
4. [ ] Click "Sign In"
5. [ ] **Expected**: User is redirected to `/dashboard`
6. [ ] **Expected**: Dashboard loads with firm data
7. [ ] **Expected**: Sidebar shows firm-related navigation (Clients, Matters, AML Checks)

**Pass Criteria**: User lands on dashboard without being redirected to firm-setup or terms acceptance.

---

## Test 2: Login and Firm Setup Redirect (User Without Firm)

**Goal**: Verify users without firms are redirected to firm-setup.

1. [ ] Create a test user account WITHOUT a firm (or manually set `firm_id = NULL` in database)
2. [ ] Navigate to `/auth/signin`
3. [ ] Enter valid credentials
4. [ ] Click "Sign In"
5. [ ] **Expected**: User is redirected to `/dashboard/firm-setup`
6. [ ] **Expected**: Firm setup page displays with stepper
7. [ ] **Expected**: User cannot access dashboard until firm is created

**Pass Criteria**: User is redirected to firm-setup and cannot bypass it.

---

## Test 3: Firm Setup Flow

**Goal**: Verify firm setup creates firm and links it to user.

1. [ ] Start from Test 2 (user without firm)
2. [ ] On firm-setup page, fill in:
   - Firm Name: "Test Law Firm"
   - State: "FL"
   - Contact Email: (optional)
3. [ ] Click "Continue" through steps
4. [ ] Click "Create Firm"
5. [ ] **Expected**: Firm is created in database
6. [ ] **Expected**: User's `profiles.firm_id` is updated
7. [ ] **Expected**: User is redirected to `/dashboard`
8. [ ] **Expected**: Dashboard loads with firm data
9. [ ] **Expected**: Sidebar shows firm-related navigation

**Pass Criteria**: Firm is created and user can access dashboard.

---

## Test 4: Logout Flow

**Goal**: Verify logout properly clears session and prevents re-authentication.

1. [ ] Log in as any user
2. [ ] Navigate to dashboard
3. [ ] Click "Sign Out" in sidebar
4. [ ] **Expected**: User is redirected to `/auth/signin`
5. [ ] **Expected**: Login page loads (not dashboard)
6. [ ] **Expected**: No session cookies are present (check browser DevTools)
7. [ ] Try to navigate directly to `/dashboard`
8. [ ] **Expected**: User is redirected back to `/auth/signin`
9. [ ] Refresh the page
10. [ ] **Expected**: Still on login page (not re-authenticated)

**Pass Criteria**: Logout clears all session data and prevents access to protected routes.

---

## Test 5: Multi-Tab Logout Behavior

**Goal**: Verify logout in one tab affects other tabs.

1. [ ] Log in as any user
2. [ ] Open dashboard in two browser tabs
3. [ ] In Tab 1, click "Sign Out"
4. [ ] **Expected**: Tab 1 redirects to login
5. [ ] In Tab 2, refresh the page
6. [ ] **Expected**: Tab 2 redirects to login (or shows loading/auth check)

**Pass Criteria**: Logout in one tab prevents access in other tabs after refresh.

---

## Test 6: Terms Acceptance on Signup

**Goal**: Verify terms acceptance is required during signup.

1. [ ] Navigate to `/auth/signup`
2. [ ] Fill in email and password
3. [ ] **Expected**: "I agree to Terms of Use" checkbox is visible
4. [ ] **Expected**: "Create Account" button is disabled until checkbox is checked
5. [ ] Check the checkbox
6. [ ] **Expected**: "Create Account" button becomes enabled
7. [ ] Click "Create Account"
8. [ ] **Expected**: Account is created
9. [ ] **Expected**: `terms_accepted_at` and `terms_version` are set in database

**Pass Criteria**: Terms acceptance is required and recorded.

---

## Test 7: Updated Terms Flow

**Goal**: Verify users are prompted to accept updated terms.

1. [ ] Create a test user with `terms_version = '0.9'` (or old version)
2. [ ] Set `CURRENT_TERMS_VERSION = '1.0'` in `lib/terms-config.ts`
3. [ ] Log in as that user
4. [ ] **Expected**: User is redirected to `/auth/accept-terms`
5. [ ] **Expected**: Page shows current version and previous version
6. [ ] **Expected**: "Accept & Continue" button is disabled until checkbox is checked
7. [ ] Check "I agree to updated Terms of Use"
8. [ ] Click "Accept & Continue"
9. [ ] **Expected**: `terms_accepted_at` and `terms_version` are updated in database
10. [ ] **Expected**: User is redirected to dashboard (or firm-setup if needed)

**Pass Criteria**: Users are prompted to accept updated terms and cannot bypass.

---

## Test 8: Terms Acceptance Cancel

**Goal**: Verify users can cancel terms acceptance (logout).

1. [ ] Start from Test 7 (user needs to accept terms)
2. [ ] On accept-terms page, click "Cancel"
3. [ ] **Expected**: User is logged out
4. [ ] **Expected**: User is redirected to `/auth/signin`
5. [ ] Log in again
6. [ ] **Expected**: User is redirected back to `/auth/accept-terms` (still needs to accept)

**Pass Criteria**: Cancel logs user out and they must accept terms on next login.

---

## Test 9: Login Page UI

**Goal**: Verify login page has correct elements.

1. [ ] Navigate to `/auth/signin`
2. [ ] **Expected**: Email field is visible
3. [ ] **Expected**: Password field is visible with "Show/Hide" toggle
4. [ ] **Expected**: "Forgot password?" link is visible
5. [ ] **Expected**: Policy links are visible at bottom:
   - Terms of Use
   - Privacy Policy
   - Client Portal Agreement
6. [ ] **Expected**: "Law firm admin registering your firm? Start here." link is visible
7. [ ] **Expected**: No firm setup form or checkboxes on login page

**Pass Criteria**: Login page is clean and focused on authentication only.

---

## Test 10: Footer on All Pages

**Goal**: Verify footer with policy links appears on all pages.

1. [ ] Check footer on `/auth/signin`
2. [ ] **Expected**: Footer is visible with policy links
3. [ ] Check footer on `/dashboard`
4. [ ] **Expected**: Footer is visible with policy links
5. [ ] Check footer on `/terms`
6. [ ] **Expected**: Footer is visible with policy links
7. [ ] Click each policy link
8. [ ] **Expected**: Each link navigates to correct page

**Pass Criteria**: Footer appears consistently across all pages.

---

## Test 11: Error Handling

**Goal**: Verify error messages are displayed correctly.

### Invalid Credentials
1. [ ] Navigate to `/auth/signin`
2. [ ] Enter invalid email/password
3. [ ] Click "Sign In"
4. [ ] **Expected**: Error message is displayed
5. [ ] **Expected**: Error message is user-friendly (not technical)

### Network Error
1. [ ] Disconnect internet (or block network requests)
2. [ ] Try to log in
3. [ ] **Expected**: Error message is displayed
4. [ ] **Expected**: Error message indicates network/server issue

### Logout Error (if detectable)
1. [ ] Log in
2. [ ] Simulate logout failure (if possible)
3. [ ] **Expected**: Best-effort logout still clears local state
4. [ ] **Expected**: User is redirected to login

**Pass Criteria**: Errors are handled gracefully with clear messages.

---

## Test 12: Loading States

**Goal**: Verify loading states are shown during async operations.

1. [ ] Navigate to `/auth/signin`
2. [ ] Enter credentials and click "Sign In"
3. [ ] **Expected**: Button shows "Signing in..." and is disabled
4. [ ] **Expected**: Form cannot be submitted again while loading

5. [ ] Navigate to `/dashboard/firm-setup`
6. [ ] Fill form and submit
7. [ ] **Expected**: Button shows "Creating..." and is disabled

8. [ ] Navigate to `/auth/accept-terms`
9. [ ] Check checkbox and submit
10. [ ] **Expected**: Button shows "Accepting..." and is disabled

**Pass Criteria**: Loading states prevent duplicate submissions and provide feedback.

---

## Test 13: Password Visibility Toggle

**Goal**: Verify password show/hide toggle works.

1. [ ] Navigate to `/auth/signin`
2. [ ] Enter password
3. [ ] **Expected**: Password is masked (dots/asterisks)
4. [ ] Click "Show"
5. [ ] **Expected**: Password is visible as plain text
6. [ ] **Expected**: Button text changes to "Hide"
7. [ ] Click "Hide"
8. [ ] **Expected**: Password is masked again

**Pass Criteria**: Password toggle works correctly.

---

## Test 14: Backward Compatibility

**Goal**: Verify existing users can still log in.

1. [ ] Use an existing user account (created before terms acceptance fields were added)
2. [ ] **Expected**: User can log in
3. [ ] **Expected**: If `terms_accepted_at` is null, user is redirected to `/auth/accept-terms`
4. [ ] **Expected**: If `firm_id` is null, user is redirected to `/dashboard/firm-setup`
5. [ ] **Expected**: No runtime errors occur

**Pass Criteria**: Existing users are handled gracefully with appropriate redirects.

---

## Test 15: Protected Route Access

**Goal**: Verify protected routes redirect unauthenticated users.

1. [ ] Log out (or start in incognito/private window)
2. [ ] Try to access `/dashboard` directly
3. [ ] **Expected**: Redirected to `/auth/signin`
4. [ ] Try to access `/dashboard/clients` directly
5. [ ] **Expected**: Redirected to `/auth/signin`
6. [ ] Try to access `/dashboard/firm-setup` directly
7. [ ] **Expected**: Redirected to `/auth/signin`

**Pass Criteria**: All protected routes require authentication.

---

## Notes

- Mark each test as ✅ Pass or ❌ Fail
- Note any issues or unexpected behavior
- If a test fails, document the exact behavior observed
- Re-run failed tests after fixes are applied

## Test Environment

- **Date**: _______________
- **Tester**: _______________
- **Environment**: [ ] Local [ ] Staging [ ] Production
- **Browser**: _______________
- **Version**: _______________
