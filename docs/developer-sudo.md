# Developer sudo (impersonation)

Internal-only feature for developers to impersonate users in **non-production** environments.

## When it is available

- **Environment**: Non-production only (`NODE_ENV !== 'production'`). In production, sudo is always disabled.
- **Opt-in**: You can set `ENABLE_SUDO=false` in non-production to disable sudo even for marked accounts.
- **Account**: Only profiles with `is_dev_sudo = true` can use sudo. There is no automatic path that sets this on signup.

## Marking a profile as dev sudo

Use **one** of:

1. **Script** (recommended):
   ```bash
   npx ts-node scripts/set-dev-sudo.ts your-email@example.com
   ```
   Requires `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

2. **SQL** (Supabase SQL editor):
   ```sql
   UPDATE public.profiles
   SET is_dev_sudo = true
   WHERE email = 'your-email@example.com';
   ```

Only run this for your own dev/test accounts.

## Accessing the sudo UI

1. Sign in as a user that has `is_dev_sudo = true`.
2. In the dashboard sidebar (non-production only), a **“Dev Sudo”** link is shown.
3. Open **“Dev Sudo”** (or go directly to `/dashboard/dev/sudo`).
4. You see a list of users grouped by firm (real and demo/test firms labelled).

## Impersonating a user

1. On `/dashboard/dev/sudo`, click **“Impersonate”** next to the user you want to act as.
2. The app sets a cookie (`dev_impersonate_user_id`) and redirects you to the appropriate home for that user:
   - **Lawyer** with firm → dashboard.
   - **Lawyer** without firm → firm-setup.
   - **Client** → client portal (`/portal`).
3. While impersonating, all server-side “current user” resolution (e.g. `getCurrentUserServer()`) returns the **impersonated** user’s profile and firm. You see only what that user would see (same RLS and app scoping).
4. A banner on the sudo page and the “Dev Sudo” entry point remain available so you can stop impersonating.

## Stopping impersonation

1. Go to **“Dev Sudo”** (e.g. via the sidebar link or `/dashboard/dev/sudo`).
2. Click **“Stop impersonating / return to my dev account”**.
3. The impersonation cookie is cleared and you are redirected back to `/dashboard/dev/sudo` as yourself.

## Security and behaviour

- **Production**: `/dashboard/dev/sudo` and the impersonation API routes return 403 or redirect in production. No sudo UI or behaviour is exposed.
- **RLS**: Impersonation does not change Supabase `auth.uid()`. The app layer swaps the “current user” profile/firm so that API and UI use the impersonated user’s context; data access is still subject to your existing RLS and any server-side checks.
- **Logging**: In non-production, impersonation start is logged to the server console (real user id, impersonated user id, target email) for traceability.
