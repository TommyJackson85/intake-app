# Developer Account Setup and Login

Step-by-step guide to create a developer sudo account and log in.

---

## Prerequisites

- **Non-production environment** (Dev Sudo is disabled in production unless `ENABLE_PROD_IMPERSONATION=true`).
- Environment variables set:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

---

## Option A: Sign Up via the App (recommended)

### 1. Enable dev signup (one-time)

Add to `.env.local`:

```
NEXT_PUBLIC_ALLOW_DEV_SIGNUP=true
```

Restart the dev server.

### 2. Sign up

1. Go to `/auth/signup`.
2. Enter your email and password.
3. Check **“Sign up as developer”** (creates a test firm for you; does **not** grant sudo yet).
4. Accept terms and submit.

### 3. Confirm email (if required)

If Supabase email confirmation is enabled, confirm your email via the link.

### 4. Mark as dev sudo

Run:

```bash
npx ts-node scripts/set-dev-sudo.ts your-email@example.com
```

Use the **exact** email you signed up with.

### 5. Sign in

1. Go to `/auth/signin`.
2. Enter your email and password.
3. You’re redirected to the dashboard.

You should see **“Dev Sudo”** in the sidebar (non-production only). Click it to access `/dashboard/dev/sudo`.

---

## Option B: Create User in Supabase

Use this if you prefer to create the user directly in Supabase Auth.

### 1. Create auth user

1. Supabase Dashboard → **Authentication** → **Users** → **Add user**.
2. Enter email and password.
3. User is created; a profile row is created via trigger.

### 2. (Optional) Add a test firm

If you want a firm for testing:

1. Supabase Dashboard → **Table Editor** → `firms` → **Insert row**.
2. Name: e.g. `Test Law Firm (Dev)`, State: e.g. `FL`, `is_test_firm`: true.
3. Supabase Dashboard → **Table Editor** → `profiles`.
4. Find your user row and set `firm_id` to the new firm’s ID.

### 5. Mark as dev sudo

```bash
npx ts-node scripts/set-dev-sudo.ts your-email@example.com
```

### 6. Sign in

1. Go to `/auth/signin`.
2. Enter the email and password you created in Supabase.

---

## Option C: SQL-only

To grant sudo on an **existing** profile:

```sql
UPDATE public.profiles
SET is_dev_sudo = true
WHERE email = 'your-email@example.com';
```

Run in Supabase → **SQL Editor**.

---

## Verify Dev Sudo Access

After setup:

1. Sign in with your dev account.
2. Confirm you see **“Dev Sudo”** in the dashboard sidebar (non-production).
3. Open `/dashboard/dev/sudo`.
4. You should see firms and users with **“Impersonate”** buttons.

---

## Troubleshooting

| Problem | Cause | Fix |
|--------|-------|-----|
| No “Dev Sudo” link | `is_dev_sudo` not set or production | Run `set-dev-sudo.ts` and ensure you’re in non-production |
| “Dev Sudo” link not showing | `ENABLE_SUDO=false` | Remove or unset in non-production |
| Script says “No profile found” | Email mismatch or no profile | Confirm the email; check `profiles` table for that user |
| Script fails on env vars | Missing Supabase keys | Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` |

---

## Quick Reference

| Task | Command / path |
|------|----------------|
| Mark profile as sudo | `npx ts-node scripts/set-dev-sudo.ts your@email.com` |
| Sign in | `/auth/signin` |
| Dev Sudo page | `/dashboard/dev/sudo` |
