# Sudo and demo concepts

The app separates **three** mechanisms. Do not conflate them.

## 1. Public demo sandbox (`/demo`) — preferred for prospects

- **Purpose**: Let anyone try fictional workflow surfaces without an account.
- **Who**: External visitors, pilots, marketing.
- **Behaviour**: Client-side `DemoProvider` + seed + `localStorage`. No Supabase writes from the demo UI.
- **Production**: Allowed and marketed (e.g. README interactive demo).
- **Canonical doc**: [public-demo-sandbox.md](./public-demo-sandbox.md).

## 2. Legacy demo law firm (`is_demo_firm`) — quarantined

- **Purpose (historical)**: Shared Supabase tenant for “try a demo firm” dashboard login.
- **Status**: Public APIs (`demo-login`, `use-demo-firm`) only **redirect to `/demo`**. Do not expand or market this path.
- **Who**: Internal QA / leftover seeded environments only.
- **Flags**: Firm has `is_demo_firm = true`. Seed via `scripts/seed-demo-firm.ts` with env password.
- **Details**: [demo-firm.md](./demo-firm.md).

## 3. Developer sudo / impersonation (internal only)

- **Purpose**: Let developers impersonate any user in non-production for debugging.
- **Who**: Only `profiles.is_dev_sudo = true`.
- **Behaviour**: Non-production `/dashboard/dev/sudo` + impersonation cookie.
- **Production**: **Never** available (`NODE_ENV === 'production'`).
- **Flags**: `profiles.is_dev_sudo`; env `ENABLE_SUDO=false` disables even in non-prod.

## Summary

| | Public `/demo` | Legacy `is_demo_firm` | Developer sudo |
|--|----------------|----------------------|----------------|
| Audience | Prospects / pilots | Internal QA only | Dev accounts |
| Production | Yes | Quarantined (not the public story) | Disabled |
| Auth | None | Historical session into demo firm | Dev session + cookie |
| Cross-tenant | N/A | No | Impersonation (non-prod) |
| UI entry | `/demo`, marketing CTAs | Do not market | Dashboard “Dev Sudo” |
