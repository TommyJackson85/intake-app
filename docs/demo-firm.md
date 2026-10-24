# Demo firm system (legacy / quarantined)

> **Prospects and pilots:** use the public browser sandbox at **`/demo`**.  
> See **[public-demo-sandbox.md](./public-demo-sandbox.md)** (canonical).  
> This document describes the **legacy** Supabase tenant (`is_demo_firm`), kept for internal QA and historical reference. Public auth entry points no longer sign users into that firm.

---

## Public path (current)

| Item | Behaviour |
|------|-----------|
| Marketing / product demo | `/demo` — client-side store, no login |
| `POST/GET /api/auth/demo-login` | **302 → `/demo`** (no session) |
| `POST/GET /api/auth/use-demo-firm` | **302 → `/demo`** (no session) |

---

## Legacy data model (still in schema)

- **`firms.is_demo_firm`** – Boolean; true for the shared “Demo Conveyancing LLP” tenant if seeded.
- **`profiles.is_demo_guest`** – Used historically for the shared demo-lawyer guest profile.
- **`profiles.firm_id`** – Active firm; RLS still isolates by firm.

Dashboard layout may still branch on `is_demo_firm` (limited settings, banners, hide billing). Treat that as **quarantined leftover**, not the public product story.

## Legacy entry flows (historical — no longer wired from marketing)

### Flow A: Anonymous “demo login” (obsolete for public)

Previously: sign in as shared demo lawyer via `DEMO_LAWYER_EMAIL` / `DEMO_LAWYER_PASSWORD`, land on dashboard.

**Today:** `/api/auth/demo-login` redirects to `/demo` only.

### Flow B: Logged-in “use demo firm” (obsolete for public)

Previously: link a no-firm profile to the demo firm via `/api/auth/use-demo-firm`.

**Today:** same redirect to `/demo` only.

## Feature gating (if still on an `is_demo_firm` dashboard session)

| Feature | Demo firms |
|---------|------------|
| Matters, intakes, tasks | Allowed (real DB rows for that firm) |
| Billing | Hidden in nav |
| Settings | Limited |
| Send intake link | Disabled (403) |
| Dev sudo | Never via this account |

## Seed (internal only)

1. SQL: `supabase/migrations/20260219100000_seed_demo_firm.sql` / `supabase/seed-demo-firm.sql` — firm + RPC.
2. Auth user: `npx ts-node scripts/seed-demo-firm.ts`
   - Requires **`DEMO_LAWYER_PASSWORD`** in `.env` / `.env.local` (no hardcoded default).
   - Optional **`DEMO_LAWYER_EMAIL`** (defaults to `demo.lawyer@demo.test`).
   - Script does **not** print the password.

## Environment variables (legacy seed / internal login experiments)

| Variable | Purpose |
|----------|---------|
| `DEMO_LAWYER_EMAIL` | Demo lawyer email for seed (optional; has a non-secret default) |
| `DEMO_LAWYER_PASSWORD` | **Required** for seed; never commit a real value |
| `SUPABASE_SERVICE_ROLE_KEY` | Seed script only |

Public `/demo` does **not** need these variables.

## Demo → real firm (legacy dashboard)

If a logged-in user is somehow still on an `is_demo_firm` tenant, `POST /api/auth/register-firm` can create a real firm and move `profiles.firm_id`. Prefer directing new evaluators to `/demo` and normal signup instead of expanding this path.
