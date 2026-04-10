# Demo Firm and Dashboard

This document explains the demo vs real firm behaviour, dashboard differences, and feature restrictions.

## Modes Overview

| Mode | Flag | Purpose |
|------|------|---------|
| **Demo firm** | `firms.is_demo_firm = true` | User-facing: lawyers evaluating the product |
| **Real firm** | `firms.is_demo_firm = false` | Fully registered firm with real data |
| **Developer sudo** | `profiles.is_dev_sudo = true` | Internal only, non-production: testing and debugging |

## Demo Firm Mode

### Login Flow

When a user chooses **"Try a demo firm"** or **"Use demo law firm"**:

1. They are signed into the pre-configured demo lawyer account (via `DEMO_LAWYER_EMAIL` / `DEMO_LAWYER_PASSWORD`).
2. That account is linked to a firm with `is_demo_firm = true`.
3. They are redirected to the **dashboard** (not firm registration).

### Dashboard Behaviour

For `firm.is_demo_firm === true`:

- **Demo banner**: A prominent warning is shown: *"Demo firm – for testing only. Do not enter real client data."*
- **Register CTA**: A clear, non-blocking CTA **"Register your own firm"** is always visible. Clicking it starts the real firm registration flow and routes the user to their real firm dashboard once created.
- **Summary cards, intake pipeline, matters list**: Full workflow is enabled with seeded/fake data.
- **Day-to-day features**: Create demo intakes and matters, progress them through stages, add notes/tasks/documents.
- **Client portal preview**: Available for demo matters and intakes.

### Restrictions in Demo Mode

| Feature | Demo behaviour |
|---------|----------------|
| **Billing** | Hidden from navigation |
| **Settings** | Visible but marked "Settings (limited)". Export and other actions may be restricted. |
| **User/role admin** | Not available or read-only |
| **Integrations** | E-sign, accounting, external services shown as locked or hidden |
| **Real data** | Strong warnings not to enter real client data; data may be reset periodically |
| **Cross-tenant / sudo** | No access to impersonation or internal sudo tools |

### Rule

```ts
if (firm.is_demo_firm) {
  // Enable day-to-day workflow and full-ish dashboard
  // Always show "Register your own firm" CTA
  // Lock down settings, billing, integrations, admin, and any cross-tenant/sudo behaviour
}
```

## Real Firm Mode

For `firm.is_demo_firm === false`:

- Same general dashboard structure (summary cards, intake pipeline, matters list, key dates).
- No demo warning banner.
- Instead of "Register your own firm", users see: **Manage firm settings**, **Manage users**, **Billing & subscriptions**, etc.
- All firm-level features are available subject to role/permissions (e.g. firm admin vs fee-earner).

## Implementation Notes

- `is_demo_firm` is fetched as part of the firm row and exposed via `useAuth()` (context) and `getCurrentUserServer()`.
- The dashboard layout gates nav items (e.g. Billing) based on `is_demo_firm`.
- The register-firm API allows creating a new firm when the user's current firm is a demo firm, effectively "upgrading" from demo to real firm.
