# Demo Firm System

Demo firms let prospective users try the product without creating their own firm or entering real client data. They are normal tenants with `is_demo_firm = true`, fully isolated by RLS.

## Data Model

- **`firms.is_demo_firm`** – Boolean; true for shared demo tenants.
- **`profiles.is_demo_guest`** – True for the shared demo-lawyer account used by anonymous visitors (Flow A). False for real users who explore demo via Flow B.
- **`profiles.firm_id`** – Active firm (demo or real). No separate `current_firm_id`; one firm per profile.

## Entry Flows

### Flow A: Home Page (Anonymous)

1. Visitor on public landing page clicks **"Explore demo firm"**.
2. App signs them in as the shared demo lawyer (credentials from `DEMO_LAWYER_EMAIL` / `DEMO_LAWYER_PASSWORD`).
3. Profile is linked to the demo firm with `is_demo_guest = true`.
4. User is redirected to the dashboard.
5. No real firm or account is created.

**API:** `POST /api/auth/demo-login` (form post from home page)

### Flow B: In-App (Logged In, No Firm)

1. User has signed up but has no firm yet.
2. They see the firm-setup page with **"Explore demo firm"**.
3. On click, `POST /api/auth/use-demo-firm` links their profile to the demo firm.
4. `is_demo_guest` stays `false` (they use their own account).
5. Redirect to dashboard.

**API:** `POST /api/auth/use-demo-firm`

## Demo Banner and CTAs

When `currentFirm.is_demo_firm = true`:

- A banner appears at the top of the dashboard: *"You are using a demo firm with dummy data. Do not enter real client information."*

- **Anonymous (Flow A):** Banner CTA is **"Create your account"** → `/auth/signup`.

- **Logged-in (Flow B):** Banner CTA is **"Register your law firm"** → `/dashboard/register-firm`.

After registering a real firm, users switch to it via the normal profile update (their `firm_id` is updated).

## Feature Gating for Demo Firms

| Feature            | Demo firms |
|--------------------|------------|
| Matters, intakes   | Allowed    |
| Tasks, timelines   | Allowed    |
| Calendar, clients  | Allowed    |
| Billing            | Hidden in nav |
| Settings           | Limited; full config only for real firms |
| Send intake link   | Disabled (no real emails) |
| Dev sudo/impersonation | Never exposed |

- Billing link is hidden in the sidebar for demo firms.
- `POST /api/dashboard/intakes/[id]/send-link` returns 403 for demo firms.
- Intakes page shows "Demo – send disabled" instead of the Send link button.

## Tenant Isolation and Security

- Demo firms are standard tenants; RLS applies the same way.
- Users only see data for their current firm (demo or real).
- Flow A cannot access real firms or clients.
- No path from demo context into dev-only sudo or impersonation.
- Dev sudo is only shown to users with `profiles.is_dev_sudo = true` in non-production.

## Seed Data

1. **Migration** – `supabase/migrations/20260221000000_add_is_demo_guest.sql` adds `profiles.is_demo_guest`.

2. **Demo firm + data** – `supabase/migrations/20260219100000_seed_demo_firm.sql` or `supabase/seed-demo-firm.sql` creates:
   - Demo firm: "Demo Conveyancing LLP"
   - Clients, matters, leads
   - The `create_or_get_demo_firm()` RPC (for the seed script to bypass RLS)

3. **Demo lawyer auth user** – `scripts/seed-demo-firm.ts`:
   - Creates the demo firm via RPC
   - Creates the demo lawyer Supabase Auth user (`demo.lawyer@demo.test` / `DemoLawyer2025!`)
   - Links profile to demo firm with `is_demo_guest = true`

   Run: `npx ts-node scripts/seed-demo-firm.ts`

## Environment Variables

| Variable                  | Required for | Purpose |
|---------------------------|--------------|---------|
| `DEMO_LAWYER_EMAIL`       | Flow A       | Shared demo account email |
| `DEMO_LAWYER_PASSWORD`    | Flow A       | Shared demo account password |
| `SUPABASE_SERVICE_ROLE_KEY` | Flow A, Flow B | Create/link profile, find demo firm |

## Demo → Real Firm Flow

When a user is in a demo firm (Flow B) and wants to create their own law firm:

1. **Entry** – User is logged in and viewing the dashboard with demo data.
2. **CTA** – Banner shows **"Register your law firm"** linking to `/dashboard/register-firm`.
3. **Form** – User enters firm name, state, and optional contact email.
4. **API** – `POST /api/auth/register-firm` validates the session and:
   - Ensures profile exists and either has no firm or has a demo firm (`is_demo_firm = true`).
   - Creates a new firm row (non-demo).
   - Updates `profiles.firm_id` to the new firm.
   - Logs a `firm_registered` audit event.
5. **Redirect** – Page redirects to `/dashboard`; auth context refetches profile with the new `firm_id`.
6. **Result** – User is now in their real firm. Demo firm data is no longer visible.

### Returning to Demo

Once a user registers a real firm, they cannot switch back to the demo firm from the normal UI. The demo firm remains a separate tenant; returning would require an explicit “Explore demo firm” action (e.g. on firm-setup) and is only available when the user has no firm or is in a demo context.

## Manual Test Steps

### Flow A: Home-page anonymous demo

1. Sign out if needed. Go to home page.
2. Click **"Explore demo firm"**.
3. You should land on the dashboard with demo data.
4. Banner should say *"You are using a demo firm..."* with **"Create your account"** CTA.
5. Click **"Create your account"** → should go to `/auth/signup`.

### Flow B: Logged-in user, no firm

1. Sign up as a new user (or use one with no firm).
2. You should be redirected to `/dashboard/firm-setup`.
3. Click **"Explore demo firm"**.
4. You should land on the dashboard with demo data.
5. Banner should show **"Register your law firm"** CTA.
6. Click it → go to `/dashboard/register-firm`, create your firm.
7. After creating, you should be on your real firm’s dashboard.

### Feature gating

1. In demo firm, confirm Billing is hidden in the sidebar.
2. On Intakes page, confirm "Send link" is replaced with "Demo – send disabled".
3. Attempt `POST /api/dashboard/intakes/[id]/send-link` for a demo-firm intake → expect 403.
