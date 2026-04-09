# Developer Sudo and Test Firms

This document describes the separation between **public demo firm**, **dev test firm(s)**, and **developer sudo**, and how they work together for internal testing.

## 1. Three Concepts

| Concept | Purpose | Flags | Audience |
|--------|---------|-------|----------|
| **Public demo firm** | Let lawyers try the app with sample data | `is_demo_firm = true` | External users |
| **Dev test firm** | Internal tenant for full dashboard testing | `is_test_firm = true`, `is_demo_firm = false` | You (developer) |
| **Developer sudo** | Impersonate users for debugging | `profiles.is_dev_sudo = true` | You only |

## 2. Public Demo Firm

- **Purpose**: Prospective lawyers can explore the product via "Explore demo firm" on sign-in or register-firm.
- **Behaviour**: Shared tenant with seeded dummy data. Shows demo banners; feature-gated (e.g. limited settings).
- **Flags**: `firms.is_demo_firm = true`, `firms.is_test_firm = true`.
- **Production**: Allowed. Clearly labelled.
- **GDPR**: Demo data only; no real client data.

## 3. Dev Test Firm

- **Purpose**: Let you test a fully registered law firm experience with full dashboard, billing, settings, and no demo banners.
- **Behaviour**: Internal tenant with synthetic data. Same features as a real firm.
- **Flags**: `firms.is_test_firm = true`, `firms.is_demo_firm = false`.
- **Default firm**: "Dev Test Conveyancing LLP".
- **Seed**: Run `npx ts-node scripts/seed-dev-test-firm.ts` or apply migration `20260222110000_seed_dev_test_firm.sql`.

### How to use the dev test firm

1. Sign in as a user with `is_dev_sudo = true`.
2. If you have no firm (or want to switch): go to `/dashboard/register-firm`.
3. Click **"Use Dev Test Firm"** (only visible to dev sudo users).
4. You are linked to the dev test firm and see the full dashboard.

## 4. Developer Sudo

- **Purpose**: Impersonate any user to see the app as they do.
- **Who**: Only `profiles.is_dev_sudo = true`.
- **UI**: `/dashboard/dev/sudo` with firm filter (Test firms only | Demo only | All) and user list.
- **Production**: Impersonation is disabled unless `ENABLE_PROD_IMPERSONATION=true`. In production, impersonation is restricted to users in **test firms only** (not real firms).

## 5. Firm Selection for Dev Sudo

- Dev sudo is **not** forced into the demo firm by default.
- On register-firm, dev sudo users see **"Use Dev Test Firm"** first, then "Explore demo firm".
- Use the dev test firm to see the full dashboard; use the demo firm only when explicitly chosen for comparison.

## 6. Environment Differences

| Environment | Impersonation | Dev test firm |
|-------------|---------------|---------------|
| Development | Enabled (unless `ENABLE_SUDO=false`) | Available |
| Staging | Enabled | Available |
| Production | Only if `ENABLE_PROD_IMPERSONATION=true`; **test firms only** | Available |

## 7. Logging and GDPR

- Impersonation is logged to `impersonation_sessions` (impersonator, impersonated, started_at, ended_at, env, reason).
- Access is strictly limited to `is_dev_sudo` profiles.
- In production, impersonation of real firm users is blocked; only test-firm users can be impersonated.
- See `docs/developer-sudo-and-impersonation.md` for audit details.

## 8. Quick Reference

| Task | Command / path |
|------|----------------|
| Seed dev test firm | `npx ts-node scripts/seed-dev-test-firm.ts` |
| Use dev test firm | Register-firm → "Use Dev Test Firm" |
| Dev Sudo page | `/dashboard/dev/sudo` |
| Mark profile as sudo | `npx ts-node scripts/set-dev-sudo.ts your@email.com` |
