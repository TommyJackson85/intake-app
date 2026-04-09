# Security Test Cases

Manual and automated tests for security-sensitive flows.

## 1. Lawyer Cannot Preview Another Firm's Intake or Matter

### Behavior
- `GET /api/dashboard/matters/[id]/client-preview-data` and `GET /api/dashboard/intakes/[id]/client-preview-data` enforce `firm_id` matching.
- If the matter/lead belongs to a different firm than the logged-in lawyer's `profile.firm_id`, the API returns 404 (not 403), to avoid leaking existence of resources.

### Manual Test
1. Create two firms (Firm A, Firm B) and a lawyer in each.
2. Create a matter or lead in Firm B.
3. Sign in as the Firm A lawyer.
4. Call `GET /api/dashboard/matters/{firm-b-matter-id}/client-preview-data` with the Firm A lawyer's session.
5. **Expected:** 404 (or empty/not found), never the actual client data.

### Automated Test
Run: `npm test` (see `tests/security/client-preview.test.ts`).

---

## 2. Demo → Real Firm Registration Flow

### Behavior
- User in a demo firm can call `POST /api/auth/register-firm` to create a real firm.
- `profile.firm_id` is updated to the new firm.
- User is redirected to dashboard and sees the new firm's (empty) data.

### Manual Test
1. Sign in as a user with no firm, or use "Explore demo firm" to enter a demo firm.
2. Go to `/dashboard/register-firm`.
3. Submit firm name and state.
4. Confirm redirect to `/dashboard` and that `profile.firm_id` points to the new firm (not the demo firm).

### Automated Test
Run: `npm test` (see `tests/security/register-firm.test.ts`).
