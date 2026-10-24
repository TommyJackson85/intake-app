# Demo firm and dashboard (legacy / quarantined)

> **Public product demo is `/demo`.** See [public-demo-sandbox.md](./public-demo-sandbox.md).  
> This page describes dashboard behaviour when a session is still attached to a firm with `is_demo_firm = true` (internal QA / leftover seed). Do not market this as the prospect path.

## Modes overview

| Mode | Flag | Purpose |
|------|------|---------|
| **Public sandbox** | N/A (`/demo`) | Prospect / pilot fictional workspace |
| **Legacy demo firm** | `firms.is_demo_firm = true` | Quarantined shared tenant |
| **Real firm** | `firms.is_demo_firm = false` | Registered firm with real data |
| **Developer sudo** | `profiles.is_dev_sudo = true` | Internal only, non-production |

## Public sandbox (preferred)

Unauthenticated `/demo` with browser-local data. No dashboard login. CTAs and README should send people here.

## Legacy demo firm mode (dashboard)

### How someone might still land here

Only via an existing seeded session or internal tooling — **not** via current public `demo-login` / `use-demo-firm` (those redirect to `/demo`).

### Dashboard behaviour when `firm.is_demo_firm === true`

- Demo banner / limited settings / billing hidden (see `app/dashboard/layout.tsx`).
- Register-firm CTA may still appear for upgrading off the demo tenant.
- Day-to-day workflow against **real DB rows** for that firm (unlike `/demo`).

### Restrictions

| Feature | Demo firm dashboard |
|---------|---------------------|
| Billing | Hidden from navigation |
| Settings | Marked limited |
| Send intake link | Disabled (403) |
| Cross-tenant / sudo | No |

## Real firm mode

For `firm.is_demo_firm === false`: full dashboard subject to role/permissions; no demo firm banner.

## Implementation notes

- `is_demo_firm` is still selected with the firm row (`getCurrentUserServer`, auth context).
- Prefer retiring leftover demo-firm sessions over adding new features on this path.
- Seed internals: [demo-firm.md](./demo-firm.md).
