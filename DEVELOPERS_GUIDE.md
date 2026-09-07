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

## Testing

### Unit tests (Vitest)
```bash
npm test
```
Runs pure/unit tests under `tests/` (Node by default; jsdom via `/** @vitest-environment jsdom */` where needed). No Supabase credentials required for demo unit suites.

### Demo matters E2E (Playwright)
Regression coverage for the public demo matters journey (client-local demo data only — no production data, no Supabase).

**Exact command (build + suite):**
```bash
npm run test:e2e
```
That runs `npm run build && playwright test` against `next start` on `http://127.0.0.1:4173`.

**If a production server is already running:**
```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npm run test:e2e:existing
```

**Install browser binaries once (CI / fresh machine):**
```bash
npx playwright install chromium
```

**Artifacts on failure:** screenshots, traces, and video under `test-results/`; HTML report in `playwright-report/`.

**CI expectations:** Compliance workflow remains required (`npm run check:compliance`). Playwright E2E is available locally and can be wired as an optional/required job; it must not call third-party network services and uses only seeded demo fixtures.

**Journeys covered (`e2e/demo-matters.spec.ts`):**
- Open `/demo/matters` and verify the list loads
- Search for a known matter and clear search
- Apply and clear a status filter
- Open a known matter detail from the list (modal) and Escape to close
- Load a known matter detail URL directly
- Load an invalid matter detail URL and recover via not-found
- Non-destructive row action (copy portal link) + Escape closes archive confirm without mutating

