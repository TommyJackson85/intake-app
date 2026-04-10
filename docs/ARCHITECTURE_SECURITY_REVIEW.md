# LawIntake – Architecture & Security Review

**Review date:** 2025-02-21  
**Context:** Multi-tenant B2B SaaS for law firms; GDPR/AML obligations; Next.js + Supabase + Vercel.

---

## Architecture Summary

- **App structure**: Next.js 13+ App Router with client-side auth (Supabase Auth + `AuthProvider`), server-side API routes using service-role client for most data access. No middleware for auth/gating.
- **Multi-tenancy**: Single firm per user via `profiles.firm_id`. Tenant scoping is enforced in app code (`eq('firm_id', current.profile.firm_id)`), not consistently via Supabase RLS.
- **RLS**: `supabase-rls-policies.sql` references non-existent `firm_users`; only `20260221100000_rls_profiles_firms_for_auth_context.sql` (profiles/firms) is aligned with the current schema.
- **Retention**: `retention.config.json` and `legal/DATA_RETENTION_SCHEDULE.md` define rules; `app/api/internal/cleanup/route.ts` implements different, hard-coded rules (e.g. audit logs deleted at 1 year vs 7 years).
- **Observability**: Sentry for errors; `lib/auditLog.ts` for audit events; no correlation IDs or structured log schema for incident response.

---

## Top 10 Issues by Severity

| ID | Severity | File(s) | Description | Suggested fix |
|----|----------|---------|-------------|---------------|
| 1 | **High** | `supabase-rls-policies.sql` | All policies use `firm_users`, which does not exist; schema uses `profiles.firm_id`. Policies will fail if applied. | Replace with policies based on `profiles.firm_id` (e.g. `firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())`) and add RLS for clients, matters, leads, aml_checks, audit_logs. |
| 2 | **High** | `app/api/internal/cleanup/route.ts` | Audit logs deleted at 1 year (line 122); spec requires 7 years. AML/audit must be kept 7 years. | Change audit_logs cleanup to 7 years (2,555 days). Add retention config lookup instead of hard-coded values. |
| 3 | **High** | `app/api/gdpr/delete-my-data/route.ts` | References `users` table (lines 50–53, 294–295); app uses `profiles`. Will 404 or fail. | Switch to `profiles` and adjust deletion logic. |
| 4 | **High** | `app/api/external/leads/route.ts` | Inserts `first_name`, `last_name`, `budget`, `timeline`, `source` into `leads`; schema has `client_email`, `client_full_name`, no `budget`/`timeline`/`source`. Will cause DB errors. | Map API fields to schema: `client_email` = email, `client_full_name` = concat(firstName, lastName), drop unsupported columns or add migrations. |
| 5 | **Medium** | `lib/api-key-security.ts` | Top-level `await createSupabaseServerClientStrict()` (line 8) – may fail or behave inconsistently in Edge/serverless. | Initialize client inside `validateAPIKey` (or a lazy singleton) instead of top-level await. |
| 6 | **Medium** | Retention architecture | Cleanup uses hard-coded 90d/180d/365d; `retention.config.json` is not used. No marketing_leads (2y), no per-firm client/matter config. | Introduce a retention engine that reads from config or a `retention_policies` table; implement marketing_leads, per-firm overrides. |
| 7 | **Medium** | `app/api/debug/env/route.ts` | Exposes presence of env vars (including service role) to any caller. | Remove or restrict to non-production / internal IP only. |
| 8 | **Medium** | `app/api/internal/cleanup/route.ts` | Leads cleanup references `archived_at`; `leads` schema has no `archived_at`. | Add `archived_at` migration or use existing `status` + `updated_at` for retention logic. |
| 9 | **Low** | Audit logging | No correlation IDs; metadata varies by event; incident “who/what/when/which tables” is harder to reconstruct. | Define a standard audit payload (e.g. `correlationId`, `firm_id`, `user_id`, `resource_type`, `resource_id`, `action`, `timestamp`) and use it consistently. |
| 10 | **Low** | `docs/current-architecture.md` | Outdated (client portal, intake flow now exist). | Update docs to reflect `/intake/[token]`, `/portal`, and current auth flow. |

---

## Deep-Dive Notes

### 1. Multi-Tenancy, Data Isolation & Domain Model

**Current enforcement**

- **Dashboard API routes** (e.g. `app/api/dashboard/intakes/route.ts`, `app/api/dashboard/matters/route.ts`): Use `getCurrentUserServer()` → `current.profile.firm_id` and apply `.eq('firm_id', ...)` in queries.
- **External API routes** (`/api/external/*`): Use API key validation → `keyValidation.firmId`; inserts/filters scoped by firm.
- **Intake API** (`/api/intake/[token]`): Uses service-role client; looks up by token hash, then `lead.firm_id`. No direct tenant leakage.

**RLS gaps**

- `supabase-rls-policies.sql` references `firm_users`, which does not exist. The app uses `profiles.firm_id`. If RLS is enabled without correct policies, data access can fail or be overly permissive.
- Only `20260221100000_rls_profiles_firms_for_auth_context.sql` applies `profiles.firm_id` correctly for profiles and firms.
- ** clients, matters, leads, aml_checks, audit_logs** – No migrations apply RLS policies. Access control relies on app-level `firm_id` filtering and service-role, which bypasses RLS. A mistake in app code could expose cross-tenant data.

**Recommendation**

1. Add RLS policies for clients, matters, leads, aml_checks, audit_logs using `profiles.firm_id`:
   ```sql
   -- Example for clients
   CREATE POLICY "Users can read clients for own firm"
   ON clients FOR SELECT TO authenticated
   USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid() AND firm_id IS NOT NULL));
   ```
2. Keep service-role for background jobs and internal APIs; ensure they always pass `firm_id` from validated context.
3. Add tests that assert cross-tenant access returns no rows.

**Domain model**

- `matters.deletion_due_date` exists but is not used by cleanup.
- `marketing_leads` has no `last_interaction_at`; retention spec requires “2 years from last interaction”.
- Consider adding `firms.retention_client_matters_years` for per-firm overrides.

---

### 2. Retention and Deletion Architecture

**What exists**

- `app/api/internal/cleanup/route.ts`: Archive rejected leads (90d), delete archived leads (180d), delete audit_logs (1y), expire sessions, delete expired API keys.
- `retention.config.json`: Defines P2Y, P7Y, etc. – not used by cleanup.
- `legal/DATA_RETENTION_SCHEDULE.md`: Documents the intended schedule.

**Gaps**

| Category | Spec | Current implementation |
|----------|------|------------------------|
| Marketing leads | 2 years from last interaction | Not implemented |
| User/firm accounts | Subscription term + 1 year | Not implemented |
| Client/matter | 6 years after closure, per-firm configurable | Not implemented; `deletion_due_date` unused |
| AML/audit logs | 7 years | Cleanup deletes at 1 year (violation) |
| Backups | ~90 days | N/A (Supabase-managed) |

**Recommendation**

1. Fix audit_logs retention: change 365 to 2,555 (7 years).
2. Add marketing_leads cleanup: delete/anonymise where `created_at` (or new `last_interaction_at`) &lt; 2 years ago.
3. Introduce a retention engine (e.g. `lib/retention-engine.ts`) that reads from `retention.config.json` or a DB table.
4. Implement client/matter retention: run jobs that set `deletion_due_date` from `closed_at` + policy, then hard-delete when past due.
5. Ensure cleanup results (counts, table names, timestamps) are logged for incident response.

---

### 3. Security, Auth & Least-Privilege

**Auth flows**

- **UI**: Supabase Auth via browser client; `AuthProvider` loads session and profile; dashboard routes redirect unauthenticated users.
- **Server routes**: `getCurrentUserServer()` / `getCurrentUserAndFirm()` use server Supabase client + `auth.getUser()`; no middleware.
- **External API**: API key in `Authorization: Bearer`; validated via `validateAPIKey` with constant-time comparison.

**Issues**

1. **`app/api/debug/env/route.ts`** – Exposes which env vars are set. Restrict or remove in production.
2. **`lib/api-key-security.ts`** – Top-level await on `createSupabaseServerClientStrict()` can cause Edge/serverless issues.
3. **GDPR delete** – Uses `users` instead of `profiles`; will fail.
4. **Dev sudo** – Gated by `NODE_ENV !== 'production'` and `is_dev_sudo`; ensure it is never reachable in production.

**Recommendation**

1. Add middleware to protect `/api/dashboard/*`, `/api/gdpr/*`, and similar routes (redirect 401 if no session).
2. Fix GDPR delete to use `profiles` and cascade correctly.
3. Use Zod (or similar) on all API inputs; `lib/validation-schemas.ts` exists but is not used everywhere.
4. Ensure `NEXT_PUBLIC_*` only contains truly public values; keep service role and secrets server-only.

---

### 4. Observability & Incident Response Readiness

**Current state**

- Sentry for errors.
- `lib/auditLog.ts` writes to `audit_logs` (firm_id, user_id, event_type, resource_type, resource_id, metadata).
- No correlation IDs or standard schema for “who did what, when, on which record”.

**Incident questions** (from `legal/INCIDENT_RESPONSE.md`)

- Which tables/records/fields?
- How many subjects/firms?
- For how long?

**Gaps**

- Audit metadata is free-form; reconstructing impact requires parsing varied structures.
- No correlation ID passed through request lifecycle.
- Cleanup job logs counts but not which IDs were deleted.
- Error logs often lack firm_id/user_id.

**Recommendation**

1. Add `x-request-id` (or similar) in middleware; pass through to audit logs and Sentry.
2. Standardise audit payload: `{ correlationId, firmId, userId, action, resourceType, resourceId, timestamp }`.
3. For deletions: log table name, count, and date range (not full IDs) for incident analysis.
4. Ensure AML and GDPR operations always call `logAuditEvent` with consistent fields.

---

### 5. Performance, Scalability & Maintainability

**Findings**

- Dashboard intakes limited to 50 rows; pagination would help for large firms.
- Auth context fetches profile + firm on each mount; consider short-lived caching.
- `getCurrentUserServer` is used in many routes; acceptable but duplicated.
- No shared “require firm” or “require scope” helper; each route implements checks.

**Recommendation**

1. Introduce `withFirmAuth(handler)` (or similar) to centralise auth and firm checks.
2. Add pagination for intakes, matters, clients.
3. Index `profiles(firm_id)`, `leads(firm_id)`, `matters(firm_id)`, `clients(firm_id)` if not present.
4. Consider read replicas or caching for audit log exports if usage grows.

---

### 6. Structural / Modularisation

**Current layout**

- `app/api/` – dashboard, auth, gdpr, external, internal, dev, debug.
- `lib/` – auth, Supabase clients, audit, validation, API key security.

**Recommendation**

- Group by domain: `lib/auth/`, `lib/retention/`, `lib/audit/`, `lib/firms/`.
- Extract tenant filtering into `lib/tenant.ts` (e.g. `assertFirmAccess(firmId, profile)`).
- Consolidate Supabase client creation in one place with clear naming (browser vs server vs service-role).

---

## Concrete Next Steps (Prioritised)

### Week 1 – Critical fixes

1. **[P0]** Fix `app/api/gdpr/delete-my-data/route.ts`: Use `profiles` instead of `users`; fix `getAuthenticatedUser` and deletion steps.
2. **[P0]** Fix `app/api/external/leads/route.ts`: Align insert fields with `leads` schema (client_email, client_full_name, etc.).
3. **[P0]** Fix `app/api/internal/cleanup/route.ts`: Change audit_logs retention to 7 years; remove or adapt logic that assumes `archived_at` on leads.
4. **[P1]** Add RLS policies for clients, matters, leads, aml_checks, audit_logs using `profiles.firm_id`; update or remove `supabase-rls-policies.sql` so it matches the schema.
5. **[P1]** Fix `lib/api-key-security.ts`: Replace top-level await with lazy init.

### Week 2 – Retention & observability

6. **[P1]** Implement marketing_leads retention (2 years from last interaction; add `last_interaction_at` if needed).
7. **[P1]** Introduce retention engine that reads from `retention.config.json`; wire cleanup to it.
8. **[P2]** Add correlation IDs to audit logging; define standard payload shape.
9. **[P2]** Restrict or remove `app/api/debug/env/route.ts` in production.

### Ongoing

10. Add middleware for dashboard/gdpr route protection.
11. Use Zod validation on all API route inputs.
12. Update `docs/current-architecture.md` with intake, portal, and auth flow.
13. Add integration tests for tenant isolation and retention behaviour.

---

*End of review*
