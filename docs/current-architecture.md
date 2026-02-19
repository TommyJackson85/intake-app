## Current architecture (as-is)

### Tech stack
- **Framework**: Next.js App Router (`app/`), TypeScript, React 18
- **Data/auth**: Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- **UI**: Mostly inline styles (Tailwind is installed but not consistently used)
- **Other**: Stripe + Sentry packages present, Upstash rate limiting present

### Auth mechanism (observed)
- **Primary (actively used by UI)**: Supabase Auth via browser client (`supabase.auth.signInWithPassword()` in `app/auth/signin/page.tsx`) + `AuthProvider` reads session/profile in the browser (`lib/auth-context.tsx`).
- **Secondary (partially implemented / inconsistent)**: Custom cookie + `sessions` table utilities (`lib/session.ts`) referenced by some API routes (e.g. `app/api/auth/accept-terms/route.ts`, `app/auth/logout/route.ts`), but the current login UI does **not** set the custom cookies (`user_id`, `firm_id`, `session_token`), so those routes are likely broken as-written.

### Multi-tenant model (observed)
- **Tenant**: `firms` table.
- **User-to-tenant link**: `profiles.firm_id` (nullable to support “sign up first, register firm later”).
- **Note**: A separate RLS design referencing `firm_users` exists in `supabase-rls-policies.sql`, but the repo’s generated Supabase types (`lib/database.types.ts`) and app code primarily use `profiles.firm_id` and do not consistently implement `firm_users`.

### Main routes/pages (App Router)
- **Public**
  - `/`: marketing landing page (`app/page.tsx`)
  - `/terms`, `/privacy`, `/portal-agreement`
- **Auth**
  - `/auth/signin`, `/auth/signup`, `/auth/logout`
  - `/auth/confirm-email`
  - `/auth/accept-terms`
  - `/auth/firm-registration` (informational landing page)
- **Law-firm (dashboard)**
  - `/dashboard` (basic stats + quick actions)
  - `/dashboard/clients`
  - `/dashboard/matters`
  - `/dashboard/aml`
  - `/dashboard/settings`
  - `/dashboard/firm-setup` (onboarding when `profiles.firm_id` is null)
  - `/dashboard/register-firm` (older/simple firm registration page; overlaps with `/dashboard/firm-setup`)
- **Client intake/portal**
  - **Not clearly implemented** as a distinct, client-only experience in `app/` at present (client-facing content is limited to policy pages; auth pages are written as generic “portal” copy).

### Data models (from `lib/database.types.ts` + usage)
- **`profiles`**: user profile with `id`, `email`, `full_name`, `role` (string|null), `firm_id` (nullable), plus terms/privacy acceptance fields added via migrations
- **`firms`**: `name`, `state`, `email_contact`, `is_test_firm`
- **`clients`**: firm-scoped clients (`firm_id`, `full_name`, `email`, `phone`, address fields, KYC status fields)
- **`matters`**: firm-scoped matters (`firm_id`, `client_id`, `matter_type`, `property_address`, `expected_closing_date`, `status`, etc.)
- **`aml_checks`**: firm-scoped AML checks
- **`audit_logs`**: firm-scoped audit logging
- **`marketing_leads`**: public marketing lead capture (landing page)
- **`sessions`**: custom session records (present, but not consistently wired to the active UI login flow)

### Key inconsistencies / risks (high-level)
- **Auth/session split-brain**: browser-based Supabase auth is used for UI gating, while several server routes assume a separate cookie/session system.
- **Role model mismatch**: multiple “role” definitions exist (`lib/types.ts` vs `types/database.ts` vs `profiles.role` in Supabase types), and role-based routing/layout separation is not enforced.
- **Client portal missing**: no dedicated `/portal` or `/intake/*` flow that cleanly separates client UX from dashboard UX.

