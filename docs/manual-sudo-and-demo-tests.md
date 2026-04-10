# Manual tests: sudo and demo

Use this checklist to verify demo and developer sudo behaviour.

## Prerequisites

- Local (or non-production) run with migrations applied.
- Demo firm seeded (`npx ts-node scripts/seed-demo-firm.ts`).
- Env: `DEMO_LAWYER_EMAIL`, `DEMO_LAWYER_PASSWORD` set if using demo login.
- At least one profile with `is_dev_sudo = true` (e.g. `npx ts-node scripts/set-dev-sudo.ts your@email.com`).

---

## 1. Lawyer demo (“Try a demo firm”)

- [ ] **Home**: On `/`, click “Try a demo firm”. You are signed in and redirected to the dashboard.
- [ ] **Sign-in**: Sign out, go to `/auth/signin`, click “Try a demo firm”. Same: signed in, dashboard.
- [ ] **Dashboard**: You see the **Demo** badge in the sidebar and the banner: *“Demo firm – for testing only. Do not enter real client data. Data may be reset regularly.”*
- [ ] **Data**: Dashboard shows the demo firm’s data (e.g. sample clients, matters, intakes). You cannot see any other firm’s data.
- [ ] **No sudo**: There is no “Dev Sudo” link or impersonation UI for the demo lawyer account.

**Pass**: Demo flow works and is clearly labelled; no cross-tenant or sudo access.

---

## 2. Developer sudo (non-production)

- [ ] Sign in as a user with `is_dev_sudo = true`.
- [ ] In the dashboard sidebar, **“Dev Sudo”** is visible. Open it (`/dashboard/dev/sudo`).
- [ ] **User list**: Users are listed grouped by firm; demo and test firms are labelled (e.g. “Demo firm”, “Test”).
- [ ] **Impersonate lawyer**: Click “Impersonate” for another lawyer (with a firm). You are redirected to the dashboard as that user (their firm, their data).
- [ ] **Stop**: Go to “Dev Sudo” again (sidebar or `/dashboard/dev/sudo`). Click “Stop impersonating / return to my dev account”. You return to `/dashboard/dev/sudo` as yourself.
- [ ] **Impersonate client**: If you have a client-role user, impersonate them. You are redirected to the client portal (`/portal`).
- [ ] **Stop again**: Return to dev account via “Stop impersonating”.

**Pass**: Sudo page is accessible, impersonation and stop work for lawyer and client, redirects are correct.

---

## 3. No sudo in production

- [ ] Run the app with `NODE_ENV=production` (e.g. `npm run build && npm run start`), or use a production-like env.
- [ ] Sign in as the same dev sudo user. **“Dev Sudo”** should **not** appear in the sidebar.
- [ ] Navigate directly to `/dashboard/dev/sudo`. You should be redirected away (e.g. to dashboard or sign-in), not see the sudo page.
- [ ] POST to `/api/dev/impersonate` (with a valid session and userId). Response should be 403 Forbidden.

**Pass**: Sudo UI and impersonation are not reachable in production.

---

## 4. Demo allowed in production

- [ ] In production (or production-like) build, open the home page. “Try a demo firm” is present.
- [ ] Click it: you are signed in as the demo lawyer and see the demo dashboard and banner. No sudo options.

**Pass**: Demo remains available and safe in production.
