# Pilot workflow walkthrough

Use this guide to evaluate whether the workspace supports a real estate matter team’s operational workflow. Record product friction, unclear wording, missing information, privacy concerns, and steps that may warrant future automation. The application remains an internal workflow tool and does not make legal, conflict, AML/FinCEN, title, escrow, recording, payoff, trust-account, or closing determinations.

## Purpose and scope

This package is for **internal pilot validation** of workflows that already ship in the interactive demo. It does not add product features, portal capabilities, tasks, reminders, automations, integrations, statuses, forms, pages, tabs, routes, persistence systems, or workflow engines.

**In scope**

- Five representative end-to-end walkthroughs using existing `/demo` surfaces and seed data
- Feedback capture prompts for friction, wording, gaps, privacy, and automation candidates

**Out of scope**

- Legal advice or determinations of any kind
- Production firm setup, billing, or live client data
- New engineering work beyond this document

## How to run the pilot

### Preferred surface: interactive demo

1. Start locally with `npm install` then `npm run dev` (see [README](../README.md) and [dev-setup](./dev-setup.md)), **or** open the hosted demo linked from the README.
2. Go to **`/demo`**.
3. Confirm the demo banner: data is fake; demo state may persist in the browser (`localStorage`) until site data is cleared.
4. Do **not** enter real client, party, or financial information.

### Optional: production-style demo firm

Prospective-firm “Try a demo firm” flow is documented in [demo-firm.md](./demo-firm.md) and [sudo-and-demo-concepts.md](./sudo-and-demo-concepts.md). That path is a shared sandboxed tenant (`is_demo_firm`), not developer sudo. Prefer `/demo` for these five walkthroughs so paths and seed names match this guide.

### Access boundaries (do not blur)

| Mechanism | Audience | Production | Cross-tenant / impersonation |
|-----------|----------|------------|------------------------------|
| `/demo` interactive seed | Internal pilot + product demos | Hosted demo OK | No — browser-local fake data |
| Demo law firm | Prospective lawyers | Allowed, labelled | No |
| Developer sudo | Explicit `is_dev_sudo` accounts | **Disabled** | Impersonation in non-production only |

See [sudo-and-demo-concepts.md](./sudo-and-demo-concepts.md) and [manual-sudo-and-demo-tests.md](./manual-sudo-and-demo-tests.md).

### Sample data standards

Seed parties use clearly fake Florida names, `+demo` / `example.com` emails, and file ids such as `FL-2026-001` … `FL-2026-004`. Treat everything as anonymized sample data. If anything looks like a real person or live matter, stop and report it.

### Suggested seed anchors

| File / party | Why it is useful for pilot |
|--------------|----------------------------|
| `FL-2026-001` — Noah Carter (individual financed purchase) | Intake → matter, Conflict Check Review, document requests |
| `FL-2026-002` — Palm Harbor Ventures LLC (cash condo / entity) | Condo Diligence, FinCEN / beneficial ownership |
| `FL-2026-003` — Mia Delgado | Earlier-stage matter / title search |
| `FL-2026-004` — Olivia Shaw (closed / post-closing condo) | Post-Closing Undertakings + worklist |
| Intake leads for Noah Carter | Client intake link + staff conflict screening |

Portal URLs follow `/demo/portal/{portal_token}` (copy from the matters list when available). Seed tokens include `demo-portal-matter-001` … `demo-portal-matter-004`.

---

## Feedback log (use on every walkthrough)

For each walkthrough, capture:

1. **Product friction** — clicks, dead ends, or unclear next steps  
2. **Unclear wording** — labels, disclaimers, status names, or empty states  
3. **Missing information** — data staff expect on screen but cannot find  
4. **Privacy concerns** — anything that feels over-exposed to portal or too easy to confuse with legal conclusions  
5. **Automation candidates** — repetitive steps that might deserve future automation (note only; do not implement here)

Keep notes operational. Do not treat UI status labels as legal, conflict, AML/FinCEN, title, escrow, recording, payoff, trust-account, or closing determinations.

---

## Walkthrough 1 — Intake, conflict screening, and Conflict Check Review

**Goal:** Move from a client intake lead into staff conflict screening and internal Conflict Check Review / memo history without treating the UI as a conflict clearance opinion.

### Entry points

- Staff: `/demo/intakes`
- Client-style intake form: `/demo/intake/[token]` (seed tokens on intake leads)
- Matter workspace: `/demo/matters` → open matter → **Overview** (Conflict Check Review + Conflict Check Memo History)

### Suggested path

1. Open `/demo/intakes` and locate a Noah Carter seed lead (pending or submitted).
2. Open the client intake link for a pending lead; submit or review intake fields.
3. Return to staff intakes; record conflict screening status/note as the product allows.
4. Open or create the related matter from the staff flow (or open `FL-2026-001` on `/demo/matters`).
5. On **Overview**, complete **Conflict Check Review** fields and generate/save an **internal** conflict memo if offered.
6. Confirm **Conflict Check Memo History** is staff-visible and not presented as portal/client advice.
7. Skim disclaimers: internal operational review only — not a conflict waiver or ethical clearance.

### What “good” looks like

- Staff can find intake → screening → review → memo history without guessing routes.
- Client vs internal surfaces are visually distinct.
- Wording does not claim the matter is “cleared” as a legal conclusion.

### Feedback prompts

- Where did conflict language feel like a legal determination?
- Was memo history discoverable?
- Any PII or party data that seemed over-shared?

---

## Walkthrough 2 — Florida Condo Diligence

**Goal:** Exercise the condo diligence workspace on a condo matter (checklist through summary / review task / lawyer checkpoint), as operational tracking only.

A Florida condo purchase includes association documents, SIRS/Milestone materials, reserve/financial information, disclosure package review, lender questionnaire, and unit/closing dependency review.

### Entry points

- `/demo/matters` → `FL-2026-002` (Palm Harbor Ventures LLC, condo) or `FL-2026-004`
- Matter detail tab: **Condo Diligence**
- Matters list filters/badges for condo summary review tasks when present

### Suggested path

1. Open `FL-2026-002` from `/demo/matters`.
2. Open **Condo Diligence**.
3. Walk each area as shown: association documents, SIRS/Milestone materials, reserve/financial information, disclosure package review, lender questionnaire, and unit/closing dependency review.
4. Add or edit a finding if the UI allows; create a condo diligence summary review task if offered.
5. Open lawyer checkpoint / dashboard / internal summary or memo history if present.
6. Confirm portal copy (if any) does not expose internal findings as client advice.

### What “good” looks like

- Condo-only surfaces appear on condo matters and stay hidden or muted on non-condo files.
- Statuses read as internal tracking, not title/association legal conclusions.
- Summary review tasks are reachable from both the matter and any list filter.

### Feedback prompts

- Which subsection was hardest to find or complete?
- Any label that implied legal or association determination?
- What would you automate first (requests, checklists, reminders)?

---

## Walkthrough 3 — FinCEN reportability and beneficial ownership

**Goal:** Review AML / FinCEN reportability and beneficial ownership capture for an entity buyer, including cert/request flows if seeded, without treating the UI as a filing decision.

### Entry points

- `/demo/matters` → `FL-2026-002` (entity buyer with FinCEN seed)
- Matter detail tab: **FinCEN / AML**
- Overview cards for FinCEN reportability / beneficial ownership review when shown
- Cert link routes under `/demo/fincen-cert/[token]` when a cert request exists

### Suggested path

1. Open `FL-2026-002`.
2. From Overview, note AML / FinCEN readiness cues; open **FinCEN / AML**.
3. Review reportability sections and beneficial ownership / reporting party fields.
4. If a beneficial-ownership certification request is available, open the cert link in a separate browser profile/window and submit sample (fake) owner data.
5. Return to staff matter view; confirm staff can see receipt of cert data.
6. Compare with an individual cash matter (e.g. `FL-2026-003`) where FinCEN may be out of scope — note how eligibility is communicated.

### What “good” looks like

- Entity vs individual eligibility is understandable.
- Cert/portal-style collection is clearly not a government filing.
- Staff can tell what is complete vs still needed without assuming “reportable” means “must file.”

### Feedback prompts

- Did any copy sound like a FinCEN determination or filing instruction?
- Was beneficial ownership privacy handling clear enough for a pilot firm?
- Missing fields a compliance coordinator would expect?

---

## Walkthrough 4 — Client document requests, portal upload, receipt, and follow-up

**Goal:** Run the staff ↔ client document-request loop: create/edit/cancel/reactivate, client upload, staff receipt queue, receipt review, Needs follow-up list/clear.

### Entry points

- Staff queues: `/demo/documents`
- Matter **Documents** tab inside matter detail
- Client portal: `/demo/portal/{portal_token}` (copy from matters list for `FL-2026-001` / others)

### Suggested path

1. Open `/demo/documents`. Note **Client upload receipt queue** and **Document requests needing follow-up**.
2. Create a client document request on `FL-2026-001` (or use a seed open request).
3. Edit the request; optionally cancel and reactivate to confirm lifecycle gates.
4. Open the matter’s portal link; as the “client,” upload against an awaiting request.
5. Return to `/demo/documents`; process the receipt queue and complete receipt review.
6. Mark **Needs follow-up** with an internal note; confirm it appears on the follow-up list.
7. Clear follow-up and confirm list/empty states update.
8. Spot-check that internal follow-up notes are not shown on the portal.

### What “good” looks like

- Staff can complete create → portal upload → receipt → follow-up without leaving demo.
- Cancelled requests are not uploadable; reactivate restores client visibility appropriately.
- Portal vs staff language stays distinct.

### Feedback prompts

- Where did lifecycle status confuse staff or “clients”?
- Any privacy leak of internal notes into the portal?
- Which queue step feels most automation-ready?

---

## Walkthrough 5 — Post-Closing Undertakings and outstanding follow-up worklist

**Goal:** Record post-closing undertakings on a closed matter and confirm cross-matter visibility on the Post-Closing worklist for outstanding follow-up only.

### Entry points

- Matter: `/demo/matters` → `FL-2026-004` (Closed/Post-Closing) → **Overview** / **Post-Closing Undertakings**
- Worklist: `/demo/post-closing-undertakings` (nav label **Post-Closing**)

### Suggested path

1. Open `FL-2026-004` and the Post-Closing Undertakings panel.
2. Read the internal disclaimer (operational tracking only; not obligation/closing/title/escrow/recording/payoff/trust-account completion).
3. Set applicability / internal review as the UI allows; add a **Recorded item** with outstanding follow-up status (`outstanding`, `received_for_review`, or `follow_up_needed`).
4. Set a target date and follow-up note; save.
5. Open `/demo/post-closing-undertakings` and confirm the item appears with matter file id, status, responsible party, and target date.
6. Mark the item internally recorded/complete (or equivalent) and confirm it leaves the outstanding worklist.
7. Confirm the worklist disclaimer matches the “visibility only / not a determination” standard.

### What “good” looks like

- Worklist shows only outstanding follow-up items; completed / not-recorded rows stay off the list.
- Deleted or non-applicable matters do not pollute the list.
- Labels such as “Internally recorded” do not read as legal completion.

### Feedback prompts

- Is “Recorded item” / status wording clear to closers and paralegals?
- Missing columns or filters for a real post-closing desk?
- Any confusion with title recording or payoff tracking?

---

## After the pilot session

1. Consolidate feedback logs from all five walkthroughs.
2. Tag each note: friction / wording / missing info / privacy / automation candidate.
3. Separate **pilot blockers** from **nice-to-haves**.
4. Do not invent new workflow engines or portal features from this document alone — feed validated gaps into normal product prioritization.

## Related docs

- [dev-setup.md](./dev-setup.md) — local environment
- [demo-firm.md](./demo-firm.md) — shared demo tenant
- [sudo-and-demo-concepts.md](./sudo-and-demo-concepts.md) — demo vs developer sudo
- [client-preview.md](./client-preview.md) — read-only client preview safeguards
- [manual-sudo-and-demo-tests.md](./manual-sudo-and-demo-tests.md) — manual demo/sudo checks
