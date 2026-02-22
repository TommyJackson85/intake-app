# LawIntake – Sandbox, Client Preview & Security Review

**Review date:** 2025-02-21  
**Focus:** Fake/sudo test firms, lawyer “see what clients see”, AML/GDPR, bugs, SQL schema.

---

## 1. Current Behaviour Summary

- **Firms/organisations**: `firms` table with `id`, `name`, `state`, `is_test_firm`, `is_demo_firm`. Users link via `profiles.firm_id` (single firm per profile).
- **Clients/matters/intakes**: `clients` (firm_id), `matters` (firm_id, client_id), `leads` (firm_id; intake/lead records with `portal_token_hash` for client-facing links).
- **Auth/tenant isolation**: Dashboard routes use `getCurrentUserServer()` → `current.profile.firm_id`. API routes filter by `firm_id`. RLS exists only for `profiles` and `firms` (see `20260221100000_rls_profiles_firms_for_auth_context.sql`); `clients`, `matters`, `leads`, `aml_checks`, `audit_logs` have no RLS in migrations.
- **Client intake form**: Public `/intake/[token]` page. URL token is raw UUID; API hashes it and looks up `leads` by `portal_token_hash`. No auth required. Client fills form; data saved to `leads` via PATCH/POST. Firm is resolved from `lead.firm_id`.
- **Lawyer view**: Lawyer logs in → dashboard. Intakes/leads and matters are scoped by `firm_id`. “Preview” links (`/dashboard/intakes/[id]/client-preview`, `/dashboard/matters/[id]/client-preview`) fetch data via `client-preview-data` API, which enforces same-firm (`eq('firm_id', firmId)`).
- **Demo/sandbox firm**: `firms.is_demo_firm = true` + `profiles.is_demo_guest` distinguish shared demo vs real user. Flow A: home “Explore demo firm” → sign in as shared demo lawyer. Flow B: firm-setup “Explore demo firm” → link current user to demo firm. Demo data is in same tables as real data, distinguished by `firm_id` and `is_demo_firm`.

---

## 2. Sandbox/Test-Firm Design

**Current state:** The app already has a demo firm (`is_demo_firm = true`) with seeded clients, matters, leads. Users can try it via Flow A (anonymous) or Flow B (logged-in). Separation is by `firm_id` and `firm.is_demo_firm`; data lives in the same tables. No separate `is_test` flag on clients/matters/leads.

**Recommendation:** The current design is mostly sound. Improve it by:

1. **Tagging related rows** – Add `is_demo_firm`-driven scoping where useful (e.g. retention excludes demo firms). Clients/matters/leads inherit demo status via `firm_id`; no new columns strictly required.
2. **Retention exclusion** – Cleanup and retention jobs should exclude `firms.is_demo_firm = true` (or delete demo data on a shorter cycle, e.g. 90 days).
3. **AML exclusion** – Exclude demo firms from AML checks/reporting (already implied by demo data being synthetic).
4. **Dev test firm** – Signup with “developer” checkbox creates `is_test_firm = true` (not `is_demo_firm`). Keep `is_test_firm` for dev-only, `is_demo_firm` for user-facing sandbox.

**Implementation checklist:**

1. ✅ Demo firm exists (`is_demo_firm`); Flow A/B implemented.
2. Ensure cleanup/retention logic skips or treats demo firms differently (e.g. 90-day purge).
3. Add RLS for `clients`, `matters`, `leads` using `profiles.firm_id` (same pattern as firms).
4. Document that demo data is synthetic and excluded from AML/retention.
5. Consider `leads.source = 'demo'` or similar for analytics exclusion (optional).

---

## 3. Lawyer “See What Clients See” Design

**Current state:** Client preview is implemented:

- Routes: `/dashboard/intakes/[id]/client-preview`, `/dashboard/matters/[id]/client-preview`.
- APIs: `GET /api/dashboard/intakes/[id]/client-preview-data`, `GET /api/dashboard/matters/[id]/client-preview-data`.
- Enforcement: Both APIs require auth, `firm_id`, and role ≠ client. They fetch by `id` and `eq('firm_id', firmId)`. Read-only; no token or client session exposed.

**Risks checked:**

- Cross-firm: Blocked by `.eq('firm_id', firmId)` on lead/matter.
- Client role: Blocked by `role === 'client'` check.
- Matters preview: Fetches client by `client_id` but does not re-check `client.firm_id`; add defense-in-depth.

**Recommendation:** The pattern is solid. Strengthen it with:

1. **Defense-in-depth on client fetch** – In matters client-preview-data, add `.eq('firm_id', firmId)` when fetching the client.
2. **Audit logging** – Log `client_preview_viewed` (lead/matter id, firm_id, user_id) for AML/GDPR traceability.
3. **Preview banner** – Already present (“Preview of client view – read-only”).
4. **No signed token needed** – Same-firm, server-side auth is sufficient; no extra token flow.

**Checklist:**

1. ✅ Preview routes and APIs exist; firm scoping enforced.
2. Add `logAuditEvent` for client preview views.
3. Add `client.firm_id` check in matters client-preview-data.
4. Keep preview read-only (no PATCH/POST as client).

---

## 4. Top Issues and Bugs

| ID | Severity | File(s) | Description | Suggested fix |
|----|----------|---------|-------------|---------------|
| 1 | **High** | `app/api/dashboard/matters/[id]/client-preview-data/route.ts` | Client fetched by `client_id` only; no `firm_id` check. If matter.client_id pointed to wrong firm (corruption), could leak. | Add `.eq('firm_id', firmId)` to client query. |
| 2 | **Medium** | `app/api/dashboard/intakes/[id]/client-preview-data/route.ts`, `matters/.../client-preview-data/route.ts` | No audit logging when lawyer views client preview. GDPR/AML need “who viewed what, when”. | Call `logAuditEvent(firmId, userId, 'client_preview_viewed', 'lead'|'matter', id)` before returning. |
| 3 | **Medium** | Demo → real firm transition | User on demo firm clicks “Register your law firm”; `register-firm` API allows it. After creation, `profile.firm_id` switches to new firm. No explicit “leave demo” or firm switcher. | Document flow; consider “Switch to my firm” link post-registration. |
| 4 | **Medium** | `app/api/internal/cleanup/route.ts` | Cleanup treats demo and real firms the same. Demo data should be purgeable earlier or excluded from long retention. | Add `AND firm_id NOT IN (SELECT id FROM firms WHERE is_demo_firm = true)` to retention deletes, or separate demo purge. |
| 5 | **Low** | Expired intake links | Client visits `/intake/[token]` with invalid/expired token. API returns 404; page shows “invalid or expired”. | Already handled; ensure no sensitive info in error. |
| 6 | **Low** | Deleted firm, orphaned lead | If firm deleted but lead remains, intake API returns 404 for firm. | Already handled with `maybeSingle` and 404. |
| 7 | **Low** | Dev sudo in production | `isSudoEnabled()` returns false in production; `/dashboard/dev/sudo` redirects. | Verify `NODE_ENV` is set correctly on Vercel. |
| 8 | **Medium** | `supabase-rls-policies.sql` | References `firm_users` which does not exist. | Do not apply as-is; use `profiles.firm_id`-based policies (see SQL section). |

---

## 5. SQL Migration Snippets

### 5.1 RLS for clients (profiles.firm_id)

```sql
-- RLS: Users can access clients only for their own firm
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read clients for own firm" ON public.clients;
CREATE POLICY "Users can read clients for own firm"
  ON public.clients FOR SELECT TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles
      WHERE id = auth.uid() AND firm_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Users can insert clients for own firm" ON public.clients;
CREATE POLICY "Users can insert clients for own firm"
  ON public.clients FOR INSERT TO authenticated
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM public.profiles
      WHERE id = auth.uid() AND firm_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Users can update clients for own firm" ON public.clients;
CREATE POLICY "Users can update clients for own firm"
  ON public.clients FOR UPDATE TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles
      WHERE id = auth.uid() AND firm_id IS NOT NULL
    )
  )
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM public.profiles
      WHERE id = auth.uid() AND firm_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Users can delete clients for own firm" ON public.clients;
CREATE POLICY "Users can delete clients for own firm"
  ON public.clients FOR DELETE TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles
      WHERE id = auth.uid() AND firm_id IS NOT NULL
    )
  );
```

### 5.2 RLS for matters

```sql
ALTER TABLE public.matters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read matters for own firm" ON public.matters;
CREATE POLICY "Users can read matters for own firm"
  ON public.matters FOR SELECT TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles
      WHERE id = auth.uid() AND firm_id IS NOT NULL
    )
  );

-- Similar INSERT/UPDATE/DELETE policies using firm_id IN (SELECT firm_id FROM profiles...)
```

### 5.3 RLS for leads

```sql
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read leads for own firm" ON public.leads;
CREATE POLICY "Users can read leads for own firm"
  ON public.leads FOR SELECT TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles
      WHERE id = auth.uid() AND firm_id IS NOT NULL
    )
  );

-- INSERT/UPDATE/DELETE: same pattern. Note: anon/public intake API uses service role, bypasses RLS.
```

### 5.4 RLS for aml_checks

```sql
ALTER TABLE public.aml_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read aml_checks for own firm" ON public.aml_checks;
CREATE POLICY "Users can read aml_checks for own firm"
  ON public.aml_checks FOR SELECT TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles
      WHERE id = auth.uid() AND firm_id IS NOT NULL
    )
  );

-- INSERT/UPDATE: same pattern. DELETE typically restricted.
```

### 5.5 RLS for audit_logs (read-only for users)

```sql
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read audit_logs for own firm" ON public.audit_logs;
CREATE POLICY "Users can read audit_logs for own firm"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (
    (firm_id IN (
      SELECT firm_id FROM public.profiles
      WHERE id = auth.uid() AND firm_id IS NOT NULL
    ))
    OR (user_id = auth.uid())
  );

-- No INSERT/UPDATE/DELETE for authenticated; service role does inserts.
```

### 5.6 Optional: exclude demo firms from retention (conceptual)

```sql
-- In cleanup job logic, not raw SQL - add to WHERE:
-- AND firm_id NOT IN (SELECT id FROM firms WHERE is_demo_firm = true)
-- Or: delete demo firm data on 90-day cycle separately.
```

---

## 6. Final Checklist (Prioritised)

### Week 1 – Critical

1. **[P0]** Add `.eq('firm_id', firmId)` to client fetch in `app/api/dashboard/matters/[id]/client-preview-data/route.ts`.
2. **[P0]** Add `logAuditEvent` for both client-preview-data routes (`client_preview_viewed`, resource_type lead/matter).
3. **[P1]** Apply RLS migrations for `clients`, `matters`, `leads`, `aml_checks`, `audit_logs` (profiles.firm_id-based). Test that service-role and intake API still work (they bypass RLS).
4. **[P1]** Do not apply `supabase-rls-policies.sql` as-is; replace with the snippets above.

### Week 2 – Hardening

5. **[P1]** Update cleanup to exclude demo firms from long retention, or add a separate 90-day demo purge.
6. **[P2]** Document demo → real firm transition and “Register your law firm” flow in `docs/demo-firm.md`.
7. **[P2]** Verify dev sudo is disabled in production (`NODE_ENV` check).

### Ongoing

8. Add integration tests for: (a) lawyer cannot preview another firm’s intake/matter, (b) client role cannot access preview APIs.
9. Consider correlation IDs in audit logs for incident response.
10. Ensure no `NEXT_PUBLIC_*` leaks service role or other secrets.

---

*Assumptions: Schema uses `profiles.firm_id` (no `firm_users`). Intake API uses service-role. Demo and dev-test firms are distinct (`is_demo_firm` vs `is_test_firm`).*
