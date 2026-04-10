# Developer Sudo and Test Email

This document explains `is_dev_sudo`, environment gating, and how to use the test-email functionality in dev/staging.

## Overview

Developer sudo mode is for internal testing and debugging only. It is **never** enabled in production.

## Flags and Environment

| Item | Purpose |
|------|---------|
| `profiles.is_dev_sudo` | Marks developer accounts that can use sudo tools. Set manually via SQL or `scripts/set-dev-sudo.ts`. Never set on signup. |
| `NODE_ENV` | Sudo and test-email features are disabled when `NODE_ENV === 'production'`. |
| `ENABLE_SUDO` | When set to `'false'` in non-production, disables sudo entirely (including impersonation and test email). |

## Gating Rules

1. **Production**: Sudo and test-email features are always disabled regardless of `is_dev_sudo` or `ENABLE_SUDO`.
2. **Non-production**: Sudo is enabled unless `ENABLE_SUDO === 'false'`.
3. **Dev sudo tools** (impersonation, test email): Require both non-production and `profile.is_dev_sudo === true`.

## Test Email Feature

### Purpose

Allow internal dev/sudo accounts to send test intake form links to arbitrary email addresses for:

- Deliverability and UX testing
- QA without creating real client records

### Restrictions

- **Production**: The endpoint returns 403. No generic "send to any email" in production.
- **Non-production only**: Requires `isSudoEnabled()` (non-prod and `ENABLE_SUDO !== 'false'`) and `profile.is_dev_sudo === true`.

### API

```
POST /api/dev/send-test-intake-link
Body: { "email": "test@example.com" }
```

- Creates a lead in the user's firm with the given email.
- Generates a one-time intake link.
- Sends the link via email.
- Returns `{ success, sentTo, intakeUrl, leadId }`.

### UI

On the **Dev Sudo** page (`/dashboard/dev/sudo`), a "Send test intake link" form is shown only to users with `is_dev_sudo`. Enter an email and click "Send test link".

## Law-Firm Users (Normal + Demo)

For law-firm users (including demo firms):

- **Allowed**: Sending intake links to contacts/clients that exist in their own firm (via the normal "Send link" action on intakes).
- **Allowed**: Viewing the client form in preview mode in the app.
- **Not allowed in production**: A generic "Send test form to any email" action with no client/lead context. (That exists only for dev sudo in non-production.)

## Setting `is_dev_sudo`

```bash
npx ts-node scripts/set-dev-sudo.ts your-dev-email@example.com
```

Or via SQL (run in dev/staging only):

```sql
UPDATE public.profiles
SET is_dev_sudo = true
WHERE email = 'your-dev-email@example.com';
```
