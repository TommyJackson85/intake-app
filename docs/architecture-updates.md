# Architecture updates: demo and developer sudo

This document summarises how **public demo**, **legacy demo-firm tenants**, and **developer sudo** relate.

## Public demo sandbox (`/demo`) — current product path

- **Goal**: Let prospective lawyers try the app without registering, in a safe browser sandbox.
- **Mechanism**:
  - Unauthenticated routes under `app/demo/**`.
  - `DemoProvider` (`lib/demo/store.tsx`) holds fictional seed data; selected slices persist in `localStorage`.
  - Marketing and README link to `/demo`. Legacy `/api/auth/demo-login` and `/api/auth/use-demo-firm` **only 302 to `/demo`** (no session minting).
- **Restrictions**: Demo UI does not call Supabase/Stripe/Mailgun for CRM writes.
- **Canonical doc**: [public-demo-sandbox.md](./public-demo-sandbox.md).

## Legacy demo law-firm tenant (`is_demo_firm`) — quarantined

- **Goal (historical)**: Shared Supabase firm + demo lawyer account for dashboard “try a demo firm”.
- **Status**: Quarantined. Do not market or wire new public CTAs to session-based demo login.
- **Still in schema**: `firms.is_demo_firm`, optional seed via `scripts/seed-demo-firm.ts` (**requires `DEMO_LAWYER_PASSWORD` from env**).
- **Dashboard**: Existing `is_demo_firm` banners/gating in `app/dashboard/layout.tsx` remain for leftover/internal sessions only.
- **Details**: [demo-firm.md](./demo-firm.md).

---

## Developer sudo / impersonation (internal only)

- **Goal**: Let developers impersonate any user in non-production for debugging and testing.
- **Mechanism**:
  - Only profiles with `is_dev_sudo = true` (set manually via script or SQL; never set on signup).
  - In **non-production** only, `isSudoEnabled()` is true (unless `ENABLE_SUDO=false`). Then:
- Dashboard sidebar shows **“Dev Sudo”** for dev sudo users; link goes to `/dashboard/dev/sudo`.
- `/dashboard/dev/sudo` lists users by firm with an “Impersonate” button.
  - POST `/api/dev/impersonate` sets a cookie `dev_impersonate_user_id` and redirects to the appropriate home (dashboard, firm-setup, or client portal).
  - `getCurrentUserServer()` reads that cookie; if the current auth user has `is_dev_sudo` and sudo is enabled, it returns the **impersonated** user’s profile and firm.
  - POST `/api/dev/stop-impersonate` clears the cookie and redirects to `/dashboard/dev/sudo`.
- **Restrictions**:
  - **Production**: Sudo is disabled (`NODE_ENV === 'production'`). `/dashboard/dev/sudo` and impersonation APIs are not available (redirect or 403).
  - Impersonation does not bypass RLS; the app uses the impersonated user’s profile/firm for context, and existing authorization applies.

**Relevant code**: `lib/env.ts` (`isSudoEnabled`, `isNonProductionEnv`), `lib/server/current-user.ts` (impersonation cookie handling), `app/dashboard/dev/sudo/page.tsx`, `app/api/dev/impersonate/route.ts`, `app/api/dev/stop-impersonate/route.ts`, `scripts/set-dev-sudo.ts`, `docs/dev-setup.md`.

---

## Environment and feature flags

| Variable | Purpose |
|----------|---------|
| `NODE_ENV` | Production disables sudo and (if desired) can hide dev-only UI. |
| `ENABLE_SUDO` | Set to `'false'` in non-production to disable sudo even for `is_dev_sudo` users. |
| `NEXT_PUBLIC_ALLOW_DEV_SIGNUP` | When `'true'` and non-production, shows “Sign up as developer” on signup (creates test firm only; does **not** set `is_dev_sudo`). |
| `DEMO_LAWYER_EMAIL` | Optional for **legacy** seed only (default `demo.lawyer@demo.test`). Not used by public `/demo`. |
| `DEMO_LAWYER_PASSWORD` | Required for **legacy** `scripts/seed-demo-firm.ts`. Never hardcode or commit. Not used by public `/demo`. |

---

## Schema

- **firms**: `is_demo_firm` (boolean) – legacy shared demo tenant marker (quarantined).
- **profiles**: `is_dev_sudo` (boolean) – marks developer accounts that can use sudo in non-production.

See [sudo-and-demo-concepts.md](./sudo-and-demo-concepts.md) for the conceptual split, and [public-demo-sandbox.md](./public-demo-sandbox.md) for the public path.
