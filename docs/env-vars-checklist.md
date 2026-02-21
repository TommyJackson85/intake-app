# Environment Variables Checklist

For demo login to work, these must be set correctly in **Vercel** (Project → Settings → Environment Variables):

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | From Supabase Dashboard → Settings → API. Format: `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | The **anon** (public) key. Used for client-side auth. |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | The **service_role** (secret) key. **Not** the anon key. Required for demo login to link the profile to the demo firm. |
| `DEMO_LAWYER_EMAIL` | ✅ | Must match the demo lawyer user in Supabase Auth (e.g. `demo.lawyer@demo.test`). |
| `DEMO_LAWYER_PASSWORD` | ✅ | Must match the demo lawyer's password. |

## Common Mistakes

1. **Using anon key for `SUPABASE_SERVICE_ROLE_KEY`** – In Supabase Dashboard → Settings → API you see two keys. Use the **service_role** (the longer secret one), not **anon** (public).
2. **Typo in variable name** – Must be exactly `SUPABASE_SERVICE_ROLE_KEY` (not `SUPABASE_SERVICE_KEY` or similar).
3. **Preview vs Production** – Set env vars for **Production** (and Preview if you use preview deployments).
4. **Spaces or quotes** – No extra spaces around the value. No quotes unless the value itself contains spaces.
5. **Wrong Supabase project** – Ensure `NEXT_PUBLIC_SUPABASE_URL` points to the same project as your database.

## Verify

- Demo firm exists: Run `supabase/seed-demo-firm.sql` in Supabase SQL Editor.
- Demo lawyer exists: Create in Supabase Auth or run `npx ts-node scripts/seed-demo-firm.ts`.
- After changing env vars in Vercel, **redeploy** for changes to take effect.
