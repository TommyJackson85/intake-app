# Environment Variables Checklist

**Public product demo (`/demo`)** does not need `DEMO_LAWYER_*` — see [public-demo-sandbox.md](./public-demo-sandbox.md).

For the **authenticated app** (and optional **legacy** demo-firm seed), set these in **Vercel** (Project → Settings → Environment Variables) or `.env.local`:

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | From Supabase Dashboard → Settings → API. Format: `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | The **anon** (public) key. Used for client-side auth. |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ for server/admin | The **service_role** (secret) key. **Not** the anon key. Needed for seed scripts and privileged server routes. |
| `DEMO_LAWYER_EMAIL` | Legacy seed only | Optional; defaults to `demo.lawyer@demo.test` in `scripts/seed-demo-firm.ts`. |
| `DEMO_LAWYER_PASSWORD` | Legacy seed only | **Required** to run `scripts/seed-demo-firm.ts`. Never commit. Not used by `/demo`. |
| `ENABLE_SUDO` | Optional | In non-production, set to `'false'` to disable developer sudo (impersonation, test email). |
| `ENABLE_PROD_IMPERSONATION` | Optional | In production, set to `'true'` to enable impersonation for support/debug (GDPR trade-off). Default: disabled. |
| `MAILGUN_API_KEY` | For email | **US:** Private API key (Dashboard → Settings → API Keys). **EU:** Must use a **Domain Sending Key** (Dashboard → Sending → your domain → Sending API keys → Add key). The account Private API key does not work with the EU endpoint. |
| `MAILGUN_DOMAIN` | For email | Sending domain, e.g. `sandboxXXXX.mailgun.org` (Dashboard → Sending → your domain). Must be the domain name, not an ID. |
| `MAILGUN_FROM_EMAIL` | For email | Sender address. For **sandbox** use `postmaster@your-domain.mailgun.org`. If unset, defaults to `postmaster@` + MAILGUN_DOMAIN. |
| `MAILGUN_HOST` | For EU only | **Required for EU.** Set to `api.eu.mailgun.net` if your Mailgun region is EU (Dashboard shows Base URL https://api.eu.mailgun.net). For US, leave **unset**. |

### Mailgun EU setup (fix 401 Unauthorized)

If you use an **EU domain** and get `401 Unauthorized` / `Forbidden`:

1. In **Mailgun Dashboard** (EU), go to **Sending** → your domain → **Sending API keys** → **Add key**. Copy the new key.
2. In `.env.local` set:
   ```bash
   MAILGUN_HOST=api.eu.mailgun.net
   MAILGUN_API_KEY=<paste the Domain Sending Key from step 1>
   MAILGUN_DOMAIN=your-domain.mailgun.org   # or your verified domain
   MAILGUN_FROM_EMAIL=postmaster@your-domain.mailgun.org
   ```
3. Do **not** use the account-level Private API key (Settings → API Keys) for EU — it only works with the US endpoint.

## Common Mistakes

1. **Using anon key for `SUPABASE_SERVICE_ROLE_KEY`** – In Supabase Dashboard → Settings → API you see two keys. Use the **service_role** (the longer secret one), not **anon** (public).
2. **Typo in variable name** – Must be exactly `SUPABASE_SERVICE_ROLE_KEY` (not `SUPABASE_SERVICE_KEY` or similar).
3. **Preview vs Production** – Set env vars for **Production** (and Preview if you use preview deployments).
4. **Spaces or quotes** – No extra spaces around the value. No quotes unless the value itself contains spaces.
5. **Wrong Supabase project** – Ensure `NEXT_PUBLIC_SUPABASE_URL` points to the same project as your database.

## Verify

- **Public demo:** Open `/demo` — no `DEMO_LAWYER_*` required.
- **Legacy demo firm (internal only):** Run `supabase/seed-demo-firm.sql` then `DEMO_LAWYER_PASSWORD=… npx ts-node scripts/seed-demo-firm.ts`.
- After changing env vars in Vercel, **redeploy** for changes to take effect.
