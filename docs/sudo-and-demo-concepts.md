# Sudo and demo concepts

The app separates two distinct mechanisms:

## 1. Demo law firm (for lawyers)

- **Purpose**: Let prospective lawyers try the product without registering a real firm.
- **Who**: Any visitor; safe for external users.
- **Behaviour**: One shared “demo” firm (e.g. “Demo Conveyancing LLP”) with seeded fake data. Users can click “Try a demo firm” and are signed in as a demo lawyer for that firm only.
- **Powers**: None. No cross-tenant access, no impersonation, no sudo. Demo users see only that demo firm’s data.
- **Production**: Allowed. The demo flow is available in production and is clearly labelled (banner, “Demo” badge).
- **Flags**: Firm has `is_demo_firm = true` (and typically `is_test_firm = true`). Demo users do **not** have `is_dev_sudo`.

## 2. Developer sudo / impersonation (internal only)

- **Purpose**: Let developers (you) impersonate any user in non-production for debugging and testing.
- **Who**: Only accounts explicitly marked with `profiles.is_dev_sudo = true`; intended for your own dev accounts only.
- **Behaviour**: In non-production only, a dev sudo user can open `/dev/sudo`, see users grouped by firm, and click “Impersonate” to act as that user. Session stays as the dev; a cookie stores the impersonated user id so server-side code returns that user’s profile/firm.
- **Powers**: View and interact as the impersonated user (within existing RLS and app authorization). No bypass of RLS in the DB; app code uses the impersonated profile’s `firm_id` and role.
- **Production**: **Never** available. Sudo is disabled when `NODE_ENV === 'production'`. `/dev/sudo` and impersonation APIs are forbidden in production.
- **Flags**: `profiles.is_dev_sudo` (set manually via script or SQL). Env: `ENABLE_SUDO` can be set to `false` in non-production to disable sudo entirely.

## Summary

|                | Demo law firm              | Developer sudo        |
|----------------|----------------------------|------------------------|
| Audience       | Prospective lawyers        | You (dev accounts)     |
| Production     | Allowed, sandboxed         | Disabled               |
| Cross-tenant   | No                         | Yes (impersonation)    |
| Grant path     | “Try a demo firm” → demo login | Script/SQL → `is_dev_sudo` |
| UI entry       | Home / sign-in             | Dashboard “Dev Sudo” → `/dashboard/dev/sudo` |
