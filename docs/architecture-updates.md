# Architecture updates: demo and developer sudo

This document summarises how **demo law-firm access** and **developer sudo/impersonation** work and where they are restricted.

## Demo law-firm access (for lawyers)

- **Goal**: Let prospective lawyers try the app without registering a real firm, in a safe sandbox.
- **Mechanism**:
  - A single **demo firm** (e.g. “Demo Conveyancing LLP”) is marked with `is_demo_firm = true` (and typically `is_test_firm = true`).
  - A **demo lawyer** user is tied only to that firm (no `is_dev_sudo`).
  - “Try a demo firm” on the home and sign-in pages POSTs to `/api/auth/demo-login`, which signs in as that demo lawyer using env credentials (`DEMO_LAWYER_EMAIL`, `DEMO_LAWYER_PASSWORD`).
  - The dashboard shows a **Demo** badge and a banner: *“Demo firm – for testing only. Do not enter real client data. Data may be reset regularly.”*
- **Restrictions**:
  - Demo users see only the demo firm’s data (RLS and app code scope by `firm_id`). No cross-tenant access and no impersonation/sudo.
- **Production**: Allowed. Demo is intended to be used in production and is clearly labelled.

**Relevant code**: `app/api/auth/demo-login/route.ts`, “Try a demo firm” on `app/page.tsx` and `app/auth/signin/page.tsx`, demo banner and badge in `app/dashboard/layout.tsx`, `scripts/seed-demo-firm.ts`, migration `is_demo_firm` on `firms`.

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
| `DEMO_LAWYER_EMAIL` | Email of the demo lawyer account (for demo login API and seed script). |
| `DEMO_LAWYER_PASSWORD` | Password for the demo lawyer account. |

---

## Schema

- **firms**: `is_demo_firm` (boolean) – identifies the shared demo sandbox firm.
- **profiles**: `is_dev_sudo` (boolean) – marks developer accounts that can use sudo in non-production.

See `docs/sudo-and-demo-concepts.md` for the conceptual split between demo and sudo, and `docs/demo-firm-for-lawyers.md` and `docs/developer-sudo.md` for usage and setup.
