# Developer Sudo and Impersonation

This document describes the **developer sudo** account and **impersonation** feature: who can use it, how it works, where it is logged, environment behaviour, and how it aligns with GDPR.

## 1. Who can use this

Only profiles with `profiles.is_dev_sudo = true` can access developer sudo tools. This flag is:

- Set manually via SQL or `npx ts-node scripts/set-dev-sudo.ts your@email.com`
- Never set on signup or through any user-facing flow
- Intended only for internal developer / app-owner accounts
- Never set for law-firm users or demo users

## 2. What developer sudo provides

- **Developer Sudo page** (`/dashboard/dev/sudo`): Lists firms and users; allows selecting a user to impersonate
- **Impersonation**: Act as another user temporarily to see the app as they do
- **Stop impersonating**: Return to your developer account

For the full design of dev test firms vs demo firms, see **[developer-sudo-and-test-firms.md](./developer-sudo-and-test-firms.md)**.

## 3. Separation from demo firm

| Feature | Demo firm | Developer sudo |
|---------|-----------|----------------|
| Purpose | Let lawyers try the app with dummy data | Let developers debug and support |
| Who | Any lawyer via “Try demo” | Only `is_dev_sudo` profiles |
| Flag | `is_demo_firm` on firm | `is_dev_sudo` on profile |
| Cross-tenant | No | Yes (impersonation) |
| Production | Available | Disabled by default |

Developer sudo **never** uses the demo firm’s flows or flags. The public demo firm has no access to `/dashboard/dev/sudo` or impersonation routes.

## 4. How impersonation works

1. A dev sudo user opens `/dashboard/dev/sudo`.
2. They choose a firm and user, then click **Impersonate**.
3. The app sets a secure cookie (`dev_impersonate_user_id`) and redirects to the appropriate home (dashboard, portal, or firm registration).
4. While impersonating:
   - `getCurrentUserServer()` and `/api/auth/me` return the **impersonated** user’s profile and firm
   - A fixed impersonation banner appears: “You are impersonating [Name] at [Firm]. All actions may affect real data.”
   - The **Stop impersonating** button ends the session and returns to `/dashboard/dev/sudo`
5. Impersonation does **not** bypass RLS; data access uses the impersonated user’s `firm_id` and role.

## 5. Audit logging

Impersonation is logged to `impersonation_sessions`:

| Column | Purpose |
|--------|---------|
| `impersonator_user_id` | Who performed the impersonation |
| `impersonated_user_id` | Who was impersonated |
| `started_at` | When impersonation started |
| `ended_at` | When it ended (set on stop) |
| `reason` | Optional reason (for support/debug) |
| `env` | `development`, `staging`, or `production` |
| `metadata` | Additional context (e.g. target email) |

A row is created when impersonation starts and updated with `ended_at` when it stops.

## 6. Environment behaviour

| Environment | Impersonation | Controlled by |
|-------------|---------------|---------------|
| Development | Enabled (default) | `is_dev_sudo` + `ENABLE_SUDO !== 'false'` |
| Staging | Enabled (default) | Same |
| Production | **Disabled by default** | `ENABLE_PROD_IMPERSONATION === 'true'` required |

- In non-production: `ENABLE_SUDO=false` disables sudo entirely.
- In production: impersonation is only allowed if `ENABLE_PROD_IMPERSONATION=true` is explicitly set (acknowledging GDPR trade-offs for support/debugging).

## 7. GDPR alignment

- **Purpose**: Support and debugging under legitimate interest.
- **Access control**: Only `is_dev_sudo` profiles; strictly internal.
- **Logging**: All impersonation start/stop events are recorded in `impersonation_sessions` for accountability.
- **Limitation**: Impersonation uses the impersonated user’s context; RLS and app authorization apply. No bulk export or cross-tenant data access beyond what the impersonated user would see.

If production impersonation is enabled, ensure this use is documented in any processor/DPA context as a support/debug feature with logging and access control.

## 8. Setup and login

For step-by-step instructions to create a developer account and log in, see **[dev-account-setup-and-login.md](./dev-account-setup-and-login.md)**.

## 9. Quick reference

| Action | Where |
|--------|-------|
| Mark profile as dev sudo | `npx ts-node scripts/set-dev-sudo.ts your@email.com` |
| Access sudo UI | `/dashboard/dev/sudo` (link in sidebar when `show_dev_sudo`) |
| Start impersonating | Click **Impersonate** next to a user |
| Stop impersonating | Click **Stop impersonating** in the banner or on the sudo page |
| View audit log | Query `impersonation_sessions` in Supabase |
