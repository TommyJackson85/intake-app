# Demo firm for lawyers

Prospective law firms can explore the product without creating a real account.

## How it works

1. **Entry points**
   - **Home page**: “Try a demo firm” button in the header (next to Sign In).
   - **Sign-in page**: “Try a demo firm” link/button below the sign-in form.

2. **What happens**
   - The user clicks “Try a demo firm”.
   - The app signs them in as a shared demo lawyer account for a pre-configured **demo firm** (e.g. “Demo Conveyancing LLP”).
   - They land on the dashboard with access to that firm’s demo data only (sample clients, matters, intakes).

3. **Limits**
   - Demo users see only the demo firm’s data. They cannot see or access any other firm’s data.
   - No impersonation or sudo; the demo account has no special privileges.
   - Data may be reset periodically; the UI shows a banner:  
     *“Demo firm – for testing only. Do not enter real client data. Data may be reset regularly.”*

## Setup (admin)

1. **Database**
   - Run migrations so that `firms` has `is_demo_firm` (and optionally keep `is_test_firm` for the demo firm).
   - Ensure the demo firm row exists with `is_demo_firm = true`.

2. **Seed data**
   - Run the demo seed script to create/update the demo firm, demo lawyer user, and sample data:
     ```bash
     npx ts-node scripts/seed-demo-firm.ts
     ```
   - Script creates/updates:
     - Firm: “Demo Conveyancing LLP” (`is_demo_firm`, `is_test_firm`).
     - Demo lawyer user (e.g. `demo.lawyer@demo.test`) linked to that firm.
     - Sample clients, matters, and leads for that firm.

3. **Environment**
   - Set for the demo login API (and optionally for the seed script):
     - `DEMO_LAWYER_EMAIL` – email of the demo lawyer (e.g. `demo.lawyer@demo.test`).
     - `DEMO_LAWYER_PASSWORD` – password for that account.

4. **Security**
   - Demo is safe in production: one shared account, one tenant, no cross-tenant access and no sudo. Ensure RLS and app code scope all data by `firm_id` so the demo user only ever sees the demo firm.

## User flow summary

- Visitor → “Try a demo firm” → signed in as demo lawyer → dashboard with demo data and demo banner.
- They can explore the app; when done, they sign out. They can later create a real account via Sign Up.
