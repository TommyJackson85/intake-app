# Demo for lawyers (public)

Prospective law firms explore the product in a **browser sandbox** — no account required.

## How it works

1. **Entry**
   - Marketing / README / sample-workspace CTAs → **`/demo`**
   - Legacy bookmarks to `/api/auth/demo-login` or `/api/auth/use-demo-firm` also land on **`/demo`** (redirect only).

2. **What happens**
   - The visitor uses fictional seed matters, intakes, documents, and portals.
   - Edits stay in this browser (`localStorage`). Use **Reset demo data** to restore fixtures.
   - No real client data is sent to the server from the demo UI.

3. **Limits**
   - Not a real firm; not signed into the dashboard.
   - Do not enter real client information.
   - Optional deep link `/demo/dev/ai-payloads` is engineering tooling (hidden from nav outside development).

Canonical doc: [public-demo-sandbox.md](./public-demo-sandbox.md).

## Legacy Supabase “demo firm” (internal)

A separate `is_demo_firm` tenant and shared demo lawyer account may still exist in some environments for internal QA. It is **not** the public prospect path. See [demo-firm.md](./demo-firm.md) and seed notes in [public-demo-sandbox.md](./public-demo-sandbox.md#legacy-demo-firm-tenant-quarantined).
