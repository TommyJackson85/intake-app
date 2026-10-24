# Public demo sandbox (`/demo`)

**Canonical product demo for prospects and pilots.** Prefer this path over any Supabase “demo firm” tenant.

## What it is

| | |
|--|--|
| **URL** | `/demo` (and nested routes: matters, intakes, calendar, documents, portal, …) |
| **Auth** | None — unauthenticated browser sandbox |
| **Data** | In-browser seed + `localStorage` (`lawintake-demo-*-v1` keys) via `DemoProvider` |
| **Backends** | Does **not** write to Supabase, Stripe, or Mailgun from the demo UI |
| **Reset** | “Reset demo data” in the demo shell |

Entry points: marketing CTAs, README interactive demo link, and legacy redirects from `/api/auth/demo-login` and `/api/auth/use-demo-firm` (both **302 → `/demo`** only; they no longer mint sessions).

## What it is not

- Not a real firm tenant.
- Not signed-in dashboard mode.
- Not the same system as `firms.is_demo_firm` (see [Legacy demo firm tenant](#legacy-demo-firm-tenant-quarantined) below).

## Key code

- Routes: `app/demo/**`
- Store / persistence: `lib/demo/store.tsx`, `lib/demo/demoPersistence.ts`, `lib/demo/demoData.ts`
- Optional AI lab: `/demo/dev/ai-payloads` (nav only in development; generation gated server-side)

## Legacy demo firm tenant (quarantined)

A separate, older path used a Supabase firm with `is_demo_firm = true` and a shared demo lawyer account. That path is **quarantined**:

- Public “try demo” APIs only redirect to `/demo`.
- Dashboard UI may still show demo-firm banners if someone is already linked to an `is_demo_firm` tenant (internal QA / leftover seed).
- Do **not** document or market that as the prospect demo.
- Seed script `scripts/seed-demo-firm.ts` is for **internal** environments only and requires `DEMO_LAWYER_PASSWORD` from env (no hardcoded password).

Details of the old flows (for maintainers): [demo-firm.md](./demo-firm.md), [sudo-and-demo-concepts.md](./sudo-and-demo-concepts.md).
