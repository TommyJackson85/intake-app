# Developer setup (non-production)

## Marking a profile as developer sudo

Developer sudo (impersonation) is only available in **non-production** and only for profiles explicitly marked with `is_dev_sudo = true`. There is no automatic path that sets this on signup.

### Option 1: Script (recommended)

```bash
npx ts-node scripts/set-dev-sudo.ts your-dev-email@example.com
```

Requires `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the environment.

### Option 2: SQL (Supabase SQL editor)

```sql
UPDATE public.profiles
SET is_dev_sudo = true
WHERE email = 'your-dev-email@example.com';
```

Run this in the Supabase dashboard SQL editor. Replace the email with your dev account.

### Notes

- Only run this for **your own** dev/test accounts.
- Sudo and `/dev/sudo` are disabled in production (`NODE_ENV=production`).
- You can set `ENABLE_SUDO=false` in non-production to disable sudo even for marked accounts.
