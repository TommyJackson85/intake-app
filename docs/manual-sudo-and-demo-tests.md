# Manual tests: public demo, legacy demo firm, and sudo

Use this checklist to verify the three distinct paths. Prefer **§1 Public `/demo`** for product validation.

## Prerequisites

- Local (or non-production) run with migrations applied.
- For §1 only: no special env beyond a normal `npm run dev`.
- For §2 (legacy): demo firm seeded with `DEMO_LAWYER_PASSWORD` set (`npx ts-node scripts/seed-demo-firm.ts`).
- For §3–4: at least one profile with `is_dev_sudo = true` (e.g. `npx ts-node scripts/set-dev-sudo.ts your@email.com`).

---

## 1. Public demo sandbox (`/demo`) — preferred

- [ ] Open `/demo` while signed out. Dashboard-like demo shell loads without login.
- [ ] Banner explains browser/`localStorage` persistence and **Reset demo data**.
- [ ] Create or edit a matter/intake; refresh — changes remain until reset.
- [ ] Open `/api/auth/demo-login` (GET) → redirected to `/demo` (not a dashboard session).
- [ ] Open `/api/auth/use-demo-firm` (GET) → redirected to `/demo`.

**Pass**: Prospect path is `/demo` only; legacy auth URLs do not mint sessions.

Canonical: [public-demo-sandbox.md](./public-demo-sandbox.md).

---

## 2. Legacy demo firm dashboard (quarantined / optional)

Only if you still maintain an `is_demo_firm` tenant for internal QA:

- [ ] Sign in as the seeded demo lawyer (env credentials). Confirm dashboard **Demo** banner and limited settings/billing gating.
- [ ] Confirm no “Dev Sudo” for that account.
- [ ] Confirm you only see that firm’s data.

**Pass**: Legacy tenant remains isolated; do not use this as the marketed prospect path.

---

## 3. Developer sudo (non-production)

- [ ] Sign in as a user with `is_dev_sudo = true`.
- [ ] In the dashboard sidebar, **“Dev Sudo”** is visible. Open it (`/dashboard/dev/sudo`).
- [ ] **User list**: Users are listed grouped by firm; demo and test firms are labelled (e.g. “Demo firm”, “Test”).
- [ ] **Impersonate lawyer**: Click “Impersonate” for another lawyer (with a firm). You are redirected to the dashboard as that user (their firm, their data).
- [ ] **Stop**: Go to “Dev Sudo” again (sidebar or `/dashboard/dev/sudo`). Click “Stop impersonating / return to my dev account”. You return to `/dashboard/dev/sudo` as yourself.
- [ ] **Impersonate client**: If you have a client-role user, impersonate them. You are redirected to the client portal (`/portal`).
- [ ] **Stop again**: Return to dev account via “Stop impersonating”.

**Pass**: Sudo page is accessible, impersonation and stop work for lawyer and client, redirects are correct.

---

## 4. No sudo in production

- [ ] Run the app with `NODE_ENV=production` (e.g. `npm run build && npm run start`), or use a production-like env.
- [ ] Sign in as the same dev sudo user. **“Dev Sudo”** should **not** appear in the sidebar.
- [ ] Navigate directly to `/dashboard/dev/sudo`. You should be redirected away (e.g. to dashboard or sign-in), not see the sudo page.
- [ ] POST to `/api/dev/impersonate` (with a valid session and userId). Response should be 403 Forbidden.

**Pass**: Sudo UI and impersonation are not reachable in production.

---

## 5. Public demo allowed in production

- [ ] In production (or production-like) build, open `/demo`. Sandbox loads without requiring `DEMO_LAWYER_*`.
- [ ] Confirm marketing/README still point at `/demo`, not session-based demo login.

**Pass**: Public demo remains available and sandboxed.
