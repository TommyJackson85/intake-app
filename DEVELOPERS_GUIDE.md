INTERNAL:
- app/api/leads/route.ts
- app/api/gdpr/export/route.ts
- app/api/clients/route.ts
- app/api/matters/route.ts
- app/api/aml/route.ts

EXTERNAL:
- app/api/external/leads/route.ts           (new)
- app/api/external/gdpr/export/route.ts     (new / moved)

REGISTRATION
- Users can sign up with only email/password (no firm). They land on the dashboard and are prompted to register a law firm to unlock clients, matters, AML, and firm data export (MLR/data privacy compliance).
- Optional: "Register with a law firm now" on signup to add firm name + state at account creation.
- Developer test user: set NEXT_PUBLIC_ALLOW_DEV_SIGNUP=true to show "Sign up as developer (test law firm, full access)" on the signup page. That creates a "Test Law Firm (Dev)" and links the user for full feature access.
- Apply migrations in order:
  - supabase/migrations/20250208000000_allow_profile_without_firm.sql (profiles.firm_id nullable)
  - supabase/migrations/20250208000001_add_is_test_firm_to_firms.sql (firms.is_test_firm for dev badge)
- Email confirmation: When Supabase has "Confirm email" enabled, signup redirects to /auth/confirm-email. Signin returns 403 with code EMAIL_NOT_CONFIRMED if user hasn't confirmed; signin page shows link to /auth/confirm-email to resend.

BACKFILL PASSWORD command example
npm run backfill:password -- user@firm.com "TempP@ssw0rd!"
