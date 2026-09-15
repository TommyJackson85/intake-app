# Property-Tax Notice & VAB Triage — MVP coverage audit

**Audit date:** 2026-09-15  
**Baseline:** `origin/main` (branch `cursor/property-tax-vab-mvp-audit-fa67`)  
**Scope:** Read-only. Application code was not modified for this audit; this file is the only deliverable.  
**Product constraint:** Property-tax/VAB remains an **optional adjacent** demo workflow. Primary focus stays Florida RE intake, condo diligence, and AML/FinCEN.

**Checkout note:** An earlier agent branch (`feat/condo-diligence-core-doc-pack`) did **not** contain the property-tax modules. Coverage below is grounded in files present on `main`.

---

## A. Executive summary

- **Already covered:** Optional Florida property-tax / tax-deed branch on intake and matters (`DemoPropertyTaxIssue`), including Assessment/VAB issue typing (assessed value, exemption, classification, portability, other, unknown), TRIM notice + VAB petition filed flags, dated TRIM / VAB filing / hearing fields with verification sources, Matter Overview + Key Dates panels, staff-controlled document-request presets, demo scenarios/seeds, unit tests, E2E smoke, and boundary disclaimers that refuse legal advice and statutory deadline calculation.
- **Partially covered:** Jurisdiction/property facts (county, address, parcel/folio exist; tax year and prior address for portability do not); notice/date capture (TRIM received + dated fields exist; separate mailing vs received dates, dedicated notice-type enum, and filing-receipt metadata do not); safe urgency (Soon/Passed + verification banners exist; not a green/amber/red legal-risk model, and not a dedicated “deadline-review task” type); evidence organisation (strong presets/checklist for many VAB docs; POA, photos, repair invoices, proof of delivery, and DR-486 are not first-class); hand-off statuses (per-kind `ready_for_attorney_review` / `needs_more_info` exist; no referred-to-specialist / not-in-scope / withdrawn statuses).
- **Missing:** Tax-deferral as a classified issue type; tax year; prior property address; notice mailing date vs date received; DR-486-specific handling; representation/POA/referral access model; external specialist portal; authoritative deadline engine; auto-filing; merits/outcome scoring; county integrations; reminder notifications.
- **MVP recommendation:** **Do not rebuild.** Treat the existing `assessment_vab` track plus Overview / Key Dates / document presets as the Notice & VAB Triage baseline. Close only small, validated field gaps (e.g. optional tax year; optional `deferral` on reported issue type) without expanding into a VAB case-management platform.

---

## B. Evidence inventory

| Capability | Status | Existing files/components | Evidence found | Reuse recommendation | Gaps / concerns |
|---|---|---|---|---|---|
| Optional PTX issue on lead/matter | Covered | `lib/demo/types.ts` (`DemoPropertyTaxIssue` ~267–285, on `DemoMatter` ~331, on `DemoIntakeSnapshot` ~793); `lib/demo/propertyTaxIssue.ts`; `PropertyTaxIntakeSection.tsx`; `NewIntakeDemoModal.tsx`; `NewMatterModal.tsx`; `store.tsx` matter create | Additive `propertyTaxIssue?`; involvement Yes/No/Unknown; multi-select kinds | Extend this object only | Do not invent a parallel `propertyTax` root |
| Issue classification (valuation / exemption / classification / portability / unknown) | Partially covered | `DemoPropertyTaxAssessmentReportedIssueType` (`types.ts` ~160–166); options in `propertyTaxIssue.ts` `PROPERTY_TAX_ASSESSMENT_REPORTED_ISSUE_OPTIONS` (~458–467); intake UI select in `PropertyTaxIntakeSection.tsx` | `assessed_value`, `exemption`, `classification`, `portability`, `other`, `unknown` under kind `assessment_vab` | Reuse reported-issue enum | **No `deferral`**; homestead is not a separate reported type (exemption covers it loosely; seller homestead is only on buyer-tax-estimate track) |
| Broader kind triage (VAB vs buyer estimate vs tax-deed) | Covered | `DemoPropertyTaxIssueKind` (`types.ts` ~130–134); scenarios in `propertyTaxDemoScenarios.ts` | Three kinds: `assessment_vab`, `ownership_change_tax_risk`, `delinquent_tax_deed_surplus` | Keep assessment_vab as VAB triage path | Adjacent kinds are out of narrow VAB MVP but already ship |
| Florida county | Covered | Shared `floridaCounty` on `DemoPropertyTaxIssue`; intake field in `PropertyTaxIntakeSection.tsx`; matter `property.county` | Optional county on PTX branch; matter county used as placeholder hint | Prefer shared field; avoid duplicate sources of truth | — |
| Property address | Covered | `DemoMatter.property.address`; intake snapshot `propertyAddress`; gating via `isFloridaPropertyAddress` / show-panel helpers | Address lives on matter/intake, not nested in PTX object (by design comment in types) | Keep address on matter/intake | — |
| Parcel / folio | Covered | `parcelOrFolio` shared + per-kind; intake labels “Parcel or folio ID” | Free-text string | Reuse | No validation against county formats |
| Tax year | Not found | — | No `taxYear` field in types/helpers/UI | Add only if firms ask | — |
| Prior property address (portability) | Not found | Portability is a reported-issue option only | No prior-address field | Optional free-text if validated | Do not imply portability eligibility |
| Notice type | Partially covered | `noticeReceived` + TRIM-oriented copy; delinquent situations enum; doc presets for notice titles | Operational “TRIM / similar” and situation tags, not a general notice-type taxonomy | Reuse TRIM flags for VAB triage | No inspection/financing-style notice enum; no DR-486 type |
| Notice mailing date | Not found | — | Only `trimNoticeDate` (generic notice date) | If needed, add dated value with verification source | Avoid calling it a statutory mailing deadline |
| Date received | Partially covered | `noticeReceived` boolean; `trimNoticeDate` dated value | Received yes/no + one date field | Clarify labels if adding mailing vs received | Two concepts collapsed today |
| Notice/denial upload | Partially covered | Document requests + presets (`ptx-trim-notice`, `ptx-assessment-other`, etc.); `availableDocumentIds` checklist | Staff create requests; client portal upload path exists for document requests generally | Reuse document-request system | No dedicated “denial letter” preset id |
| Hearing date | Covered | `vabHearingDate: DemoPropertyTaxDatedValue` | Intake + Key Dates | Reuse | Soft Soon/Passed only |
| Petition filed status | Covered | `vabPetitionFiled: boolean \| null`; `vabFilingDate` | Tri-state UI via nullable bool | Reuse | Not `not_filed \| filed \| unknown` enum (boolean+null equivalent) |
| Filing receipt / proof of submission | Partially covered | Preset/checklist `ptx-vab-petition` (“VAB petition and/or hearing notice”) | Combined title; no separate receipt preset | Split preset only if firms need it | — |
| Non-definitive deadline-review task | Partially covered | Matter `tasks[]`; status `ready_for_attorney_review`; next-step copy; Key Dates verify banners | Tasks are generic titles in seeds; no typed “deadline_review” task | Prefer Overview next-step + Key Dates verify; optional generic task | Do not add legal-deadline engine |
| Urgency states | Partially covered | `getPropertyTaxKeyDateUrgencyPill` → `Soon` \| `Passed` \| null; soft window `PROPERTY_TAX_SOFT_URGENCY_DAYS = 14`; stated-deadline banner | Calendar styling, not RAG legal risk | Reuse with “calendar only” labels (UI already says “Soon (calendar)” / “Past date”) | No green/amber/red; unknown is empty pill + verification label |
| Staff/lawyer confirmation | Covered | Date sources `client_reported` / `documented` / `firm_verified` / `unknown`; firm-verification banners; staff must create doc requests | Explicit non-goals in `propertyTaxIssue.ts` header | Keep verification semantics | — |
| Date display utilities | Covered | `formatPropertyTaxDateOnlyDisplay`, date-only parse/diff helpers | ISO date-only | Reuse | Time-of-day not modeled |
| Reminder notifications | Not found | Demo calendar kinds exist (`deadline`, etc.) but no PTX reminder sender | No outbound reminder for PTX dates | Out of scope for MVP | Aligns with “nothing auto-sends” positioning |
| Document presets for VAB evidence | Partially covered | `staffPropertyTaxDocumentRequestPresets.ts`; checklist in `getPropertyTaxDocumentChecklist` | TRIM, appraiser correspondence, VAB petition/hearing, appraisal/comps, exemption/classification/portability records, other | Extend preset arrays | Missing first-class: POA, photos alone, repair invoices, property record card, proof of delivery, filing receipt |
| Structured vs free-text docs | Covered | Presets are hard-coded typed ids; documents use category enum; requests are structured rows | Easy to extend preset lists | Prefer preset extension over new doc subsystem | — |
| Client vs staff roles | Partially covered | Staff demo store; client portal for document requests / intake tokens; FinCEN cert portal pattern | Staff create/request; client uploads on portal | Reuse portal upload for evidence | No VAB-representative role |
| Attorney assignment | Covered | `assignedAttorney`, `assignedParalegal` on matter | Displayed in MatterDetailModal | Reuse | Not PTX-specific assignee |
| External professional / referral access | Not found | — | No referral portal or external reviewer ACL | Do not build yet | Would need new permissions |
| Secure document visibility | Partially covered | Portal vs staff surfaces; internal visibility flags on generated memos/review tasks | Client requests don’t expose internal PTX notes by design of staff-only overview | Keep PTX overview staff-side | Confirm portal never shows internalNotes |
| Representation / POA | Not found | Probate/authority preset exists for tax-deed track only | No POA field on assessment_vab | Validate before adding | — |
| Internal-only notes | Covered | `internalNotes`, kind `notes`, timeline, specialNotes | Staff-oriented fields | Reuse | — |
| Matter hand-off statuses | Partially covered | `DemoPropertyTaxIssueStatus`: `not_started`, `in_progress`, `needs_more_info`, `ready_for_attorney_review`; matter statuses are closing-pipeline | Maps to needs review / awaiting info | Reuse PTX status; do not overload closing statuses | Missing: referred, not in scope, withdrawn/resolved as PTX-specific |
| Referral workflow | Not found | Seed tasks say “Route attorney review” (demo copy only) | No structured referral | Notes/tasks convention | — |
| UI placement | Covered | Intake section; Matter Overview panel; Key Dates subsection; demo landing scenarios card | Conditional show when Florida + involvement | Keep optional/conditional | Avoid new top-level tab |
| Demo persistence / fixtures / tests | Covered | Matters localStorage; scenarios; `tests/demo/propertyTax*.test.ts`; `e2e/demo-property-tax-scenarios.spec.ts`; pilot docs | Reset via `resetDemoData` | Keep tests green when extending | Branch drift risk if working off non-main branches |
| DR-486 | Not found | Search across repo | No matches for DR-486 | Do not hard-code form productization | — |
| Auto-filing / statutory calculator / outcome scoring | Not found (intentional) | Explicit non-goals in helpers + docs | — | Keep out | — |

---

## C. Search findings

Grouped matches for the prescribed terms (case-insensitive). Status: **demo functionality** unless noted.

### Domain model / types

| Match | Location | Nature |
|---|---|---|
| `DemoPropertyTaxIssue*` family, `propertyTaxIssue?` | `lib/demo/types.ts` | Demo domain model on intake + matter |
| Assessment reported types incl. exemption/classification/portability | `lib/demo/types.ts` | Demo |
| `sellerHomesteadStatus` | ownership-change kind in types | Demo (buyer tax-estimate track, not VAB petition) |
| `parcelOrFolio`, TRIM/VAB dated fields | types + `propertyTaxIssue.ts` | Demo |
| Condo “special assessment” | `DemoCondoEstoppelSpecialAssessmentStatus`, condo diligence | **Naming coincidence** — HOA/condo assessment, not ad valorem VAB |
| `risk_assessment` | `lib/database.types.ts` / AML docs | **Unrelated** AML/privacy, not property tax |
| GDPR “portability” marketing row | `app/page.tsx` | **Naming coincidence** — data portability, not Save Our Homes |

### Intake UI

| Match | Location | Nature |
|---|---|---|
| `PropertyTaxIntakeSection` | `app/demo/_components/PropertyTaxIntakeSection.tsx` | Demo intake/matter form section |
| Wired into new intake demo modal | `NewIntakeDemoModal.tsx` | Demo |
| Client intake token page shows PTX section | `app/demo/intake/[token]/page.tsx` + E2E | Demo |
| `propertyTaxIssueForIntakeSnapshot` | `propertyTaxIssue.ts`, `demoIntakeFlow.ts`, store create matter | Demo persistence mapping |

### Matter UI

| Match | Location | Nature |
|---|---|---|
| `PropertyTaxMatterOverviewPanel` | `components/demo/PropertyTaxMatterOverviewPanel.tsx`; mounted in `MatterDetailModal.tsx` Overview | Demo |
| `PropertyTaxKeyDatesSection` | Key Dates tab in `MatterDetailModal.tsx` | Demo |
| Scenario landing card | `PropertyTaxDemoScenariosCard.tsx` on `/demo` | Demo |
| FinCEN / condo “assessment” strings | MatterDetailModal condo findings | **Coincidence** |

### Documents

| Match | Location | Nature |
|---|---|---|
| Assessment/VAB/ownership/delinquent presets | `lib/demo/staffPropertyTaxDocumentRequestPresets.ts` | Demo staff-controlled suggestions |
| Checklist titles (TRIM, VAB petition, appraisal/comps, exemption docs) | `getPropertyTaxDocumentChecklist` in `propertyTaxIssue.ts` | Demo capture checklist (not auto requests) |
| Generic document request/upload/receipt/follow-up | `lib/demo/demoDocumentRequest.ts`, staff* helpers, portal upload | Demo — reusable for evidence |

### Tasks and deadlines

| Match | Location | Nature |
|---|---|---|
| Soft urgency + Soon/Passed pills | `propertyTaxIssue.ts` (`PROPERTY_TAX_SOFT_URGENCY_DAYS`, `getPropertyTaxKeyDateUrgencyPill`) | Demo UI hints — **not** legal deadlines |
| Stated-deadline banner | `getPropertyTaxStatedDeadlineBanner` | Demo — “firm verification required” |
| Surplus `surplusNoticeDeadlineDate` | delinquent kind | Demo — entered-as-stated, not calculated |
| Matter `key_dates` / inspection/financing deadlines | `DemoMatter` | Ordinary closing deadlines — **reuse carefully**, not VAB statutory logic |
| Seed tasks “Collect assessment / TRIM…”, “Route attorney review” | `propertyTaxDemoScenarios.ts` | Demo fixtures |
| AI sample “Confirm all deadlines are calendared” | `lib/ai/schemas/matter-summary-response.ts` | Assistive draft copy — **watch wording** if shown near PTX |

### Tests / fixtures / demo data

| Match | Location | Nature |
|---|---|---|
| Unit tests | `tests/demo/propertyTaxIssue.test.ts`, `propertyTaxIntake.test.ts`, `propertyTaxKeyDates.test.ts`, `propertyTaxMatterOverview.test.ts`, `propertyTaxDocumentRequestPresets.test.ts`, `propertyTaxDemoScenarios.test.ts` | Test |
| E2E | `e2e/demo-property-tax-scenarios.spec.ts` | Test |
| Scenarios FL-2026-007/008/009 | `propertyTaxDemoScenarios.ts` | Demo fixtures |
| Pilot docs | `docs/PILOT_WORKFLOW_WALKTHROUGH.md`, `PILOT_OUTREACH_MATERIALS.md`, `FLORIDA_PROPERTY_TAX_PILOT_PROSPECTING.md` | Docs / go-to-market — not runtime |

### APIs / persistence

| Match | Location | Nature |
|---|---|---|
| Demo localStorage matters/intake leads | `lib/demo/demoPersistence.ts`, `store.tsx` | Demo-only persistence; PTX nested on matter/lead JSON |
| No dedicated Supabase property-tax schema | `supabase/` / `database.types.ts` | **Not found** for PTX — live backend not used for this feature |
| No DR-486 / DOR form API | repo-wide search | **Not found** |

---

## D. Current data model map

### Flow (demo)

1. **Lead intake (staff):** `NewIntakeDemoModal` holds optional `propertyTaxIssue` via `PropertyTaxIntakeSection` → normalized with `propertyTaxIssueForIntakeSnapshot` → stored on `DemoIntakeLead.intake` / submitted snapshot (`DEMO_INTAKE_LEADS_STORAGE_KEY`).
2. **Client intake link:** `/demo/intake/[token]` can show the same section (`client-intake-property-tax-section` in E2E).
3. **Open as matter:** Store matter-create path copies `propertyTaxIssue` onto `DemoMatter` (`DEMO_MATTERS_STORAGE_KEY`).
4. **New matter modal:** Can also capture PTX via the same section (`NewMatterModal.tsx`).
5. **Render:** If Florida address + active involvement, `PropertyTaxMatterOverviewPanel` (Overview) and `PropertyTaxKeyDatesSection` (Key Dates) appear inside `MatterDetailModal`.
6. **Documents:** Overview suggests presets; staff explicitly creates `DemoDocumentRequest` rows; client portal fulfills uploads; receipt/follow-up reuse existing staff helpers.
7. **Reset:** `resetDemoData` restores seeds including PTX scenarios.

**Safest extension point:** nested fields on existing optional `propertyTaxIssue` / `byKind.assessment_vab` — already additive and conditionally shown.

### Actual current shape (exists — do not re-implement)

```ts
// From lib/demo/types.ts (abridged)
type DemoPropertyTaxIssue = {
  enabled: boolean
  involvement: 'yes' | 'no' | 'unknown'
  kinds: Array<'assessment_vab' | 'ownership_change_tax_risk' | 'delinquent_tax_deed_surplus'>
  byKind: {
    assessment_vab?: {
      kind: 'assessment_vab'
      status: 'not_started' | 'in_progress' | 'needs_more_info' | 'ready_for_attorney_review'
      notes: string
      parcelOrFolio: string
      noticeReceived: boolean | null
      reportedIssueType:
        | 'assessed_value'
        | 'exemption'
        | 'classification'
        | 'portability'
        | 'other'
        | 'unknown'
      vabPetitionFiled: boolean | null
      trimNoticeDate: { date: string | null; source: DemoPropertyTaxDateSource }
      vabFilingDate: { date: string | null; source: DemoPropertyTaxDateSource }
      vabHearingDate: { date: string | null; source: DemoPropertyTaxDateSource }
      availableDocumentIds: string[]
    }
    // ... ownership_change_tax_risk, delinquent_tax_deed_surplus
  }
  floridaCounty: string
  parcelOrFolio: string
  clientIssueDescription: string
  opposingPartyOrAgency: string
  internalNotes: string
}

type DemoPropertyTaxDateSource =
  | 'client_reported'
  | 'documented'
  | 'firm_verified'
  | 'unknown'
```

### Proposed — do not implement in this audit

Only if firm validation confirms gaps; each field maps to an existing pattern:

```ts
// Proposed — do not implement in this audit
type AssessmentVabGapFill = {
  /** Connects to free-text optional fields like floridaCounty / parcelOrFolio */
  taxYear?: string
  /** Extends DemoPropertyTaxAssessmentReportedIssueType */
  // add: 'deferral'
  /**
   * Optional second dated value beside trimNoticeDate
   * (reuse DemoPropertyTaxDatedValue + verification labels)
   */
  noticeMailingDate?: { date: string | null; source: DemoPropertyTaxDateSource }
  /** Free-text; only when reportedIssueType === 'portability' — like clientIssueDescription */
  priorPropertyAddress?: string
  /** New document preset id only — reuse DemoDocumentRequest, not a new store */
  // e.g. preset 'ptx-vab-filing-receipt'
}
```

Do **not** replace `DemoPropertyTaxIssue` with the flatter sample `PropertyTaxIssue` from the prompt; the repository already has a richer nested shape.

---

## E. UI reuse plan

**Smallest addition path:** keep feature optional and conditional (already true).

| Item | Recommendation |
|---|---|
| Components likely to change (if any tiny gap fill) | `lib/demo/types.ts`, `lib/demo/propertyTaxIssue.ts`, `PropertyTaxIntakeSection.tsx`, tests under `tests/demo/propertyTax*.test.ts`; optionally one preset row in `staffPropertyTaxDocumentRequestPresets.ts` |
| Patterns to reuse | Involvement gating; dated value + source select; Overview panel; Key Dates Soon/Passed; staff-controlled suggested docs; safe disclaimer constants |
| Lead vs matter | **Both** already supported — keep both; do not add a third surface |
| Optional inputs | All PTX fields should remain optional; involvement `no` hides branch |
| Avoid clutter | Continue `shouldShowPropertyTaxMatterOverviewPanel` / Key Dates gates (Florida + enabled involvement). Do **not** add a permanent top-level “VAB” tab. Do not surface PTX on pure condo/AML matters when involvement is no/absent |

**Placement verdict:** Matter Overview compliance-style panel + Key Dates subsection + intake section — **already the least disruptive placement.** Prefer that over a new drawer/tab/app.

---

## F. Legal/product boundary checklist

### Already safe (keep)

- Helper header non-goals: no legal/tax advice; no statutory deadline computation; no filing; no notice-sufficiency judgment (`propertyTaxIssue.ts` lines 1–10).
- Disclaimers: `PROPERTY_TAX_ISSUE_BOUNDARY_DISCLAIMER`, `PROPERTY_TAX_MATTER_OVERVIEW_DISCLAIMER`, suggested-docs safe copy, demo scenarios disclaimer.
- Verification labels: “Firm-verified (**not a legal determination**)”; stated banner: “Deadline reported or documented — **firm verification required**.”
- Key Dates UI: “Soon (**calendar**)” / “Past date”; soft urgency documented as non-statutory.
- Pilot docs: explicit “does not calculate a deadline…”.

### Wording / surfaces to watch before expanding

| Risk | Location | Concern |
|---|---|---|
| Status label “Ready for attorney review” | `propertyTaxIssueStatusPresentation` | Fine if operational; avoid implying legal readiness/clearance |
| Seed task titles | `propertyTaxDemoScenarios.ts` | Keep “demo” / “for attorney review”; avoid “file VAB petition by …” |
| AI matter-summary sample about calendaring deadlines | `lib/ai/schemas/matter-summary-response.ts` | Could read as deadline authority if mixed into PTX narratives — keep assistive disclaimer |
| Condo “cleared” / assessment language | Condo diligence | Separate domain; don’t reuse “cleared” for VAB eligibility |
| Marketing/pilot claims | Outreach materials | Already warn against compliance/deadline-prevention claims — preserve |

### Required safe language for any new copy

- “Potential time-sensitive issue — staff or lawyer review required.”
- “Date shown is based on information entered and must be verified.”
- “This tool organises information for legal review; it does not determine eligibility or legal deadlines.”
- “Confirm county-specific procedure before filing or submitting evidence.”

---

## G. Prioritised implementation backlog

### 1. Ship in current MVP

*(Very small, high-confidence — only if still needed after treating current `main` as baseline.)*

| Item | Why it matters | Effort | Main files | Risks / deps |
|---|---|---|---|---|
| Treat existing assessment_vab + Overview/Key Dates/presets as the shipped triage MVP; no redesign | Avoid duplicate platform | S | Docs/pilot wording only if clarifying | None if no code |
| Optional: add `deferral` to `DemoPropertyTaxAssessmentReportedIssueType` + intake option + label helper + unit test | Closes one classification gap called out in MVP concept | S | `types.ts`, `propertyTaxIssue.ts`, `PropertyTaxIntakeSection.tsx`, `propertyTaxIssue.test.ts` | Keep as reported fact, not eligibility |
| Optional: add optional `taxYear` string on assessment branch + intake field | Common triage fact; matches free-text county/parcel pattern | S | types, helpers normalize/createEmpty, intake section, tests | Do not derive deadlines from tax year |

### 2. Validate with firms before building

| Item | Why it matters | Effort | Main files | Risks / deps |
|---|---|---|---|---|
| Split notice mailing date vs date received | Firms may need both for review queues | M | types, intake, Key Dates model, tests | Labeling as legal deadline |
| Prior property address when portability selected | Supports fact collection only | S–M | types, conditional intake UI | Implies portability rights if copy is careless |
| Separate presets: denial letter, filing receipt, property record card, POA, photos, repair invoices, proof of delivery | Evidence organisation completeness | S–M | `staffPropertyTaxDocumentRequestPresets.ts`, checklist helper, tests | Preset sprawl; still staff-controlled |
| PTX-specific hand-off values: referred / not in scope / withdrawn | Clearer routing between transaction and tax counsel | M | status enums, Overview badges, tests | Collides with matter closing statuses |
| Dedicated “verify entered date” checklist task auto-suggest (not auto-create) | Stronger hand-off without legal engine | S–M | Overview next-step / optional task template | Becoming a second task system |
| Representation/POA capture | Needed for some VAB representative practices | M | new fields + doc preset + permissions review | Access-control expansion |

### 3. Do not build yet

| Item | Why | Effort | Files (if forced) | Risks |
|---|---|---|---|---|
| Authoritative statutory deadline calculation | Violates product boundary | L | — | UPL / incorrect county rules |
| Auto-file VAB / DR-486 generation-submission | Out of scope | L | — | Filing liability |
| Merits / outcome / valuation scoring; comps AI analysis | Turns product into appeals engine | L | AI schemas | Legal advice appearance |
| Green/amber/red “legal risk” scoring from dates | Implies legal urgency | M | Key Dates UI | Misread as filing deadline |
| Statewide county procedure integrations / DOR feeds | Ongoing legal-data maintenance | L | APIs, schema | Stale law; backend scope |
| External specialist referral portal ACLs | New permission model | L | auth, RLS, portal | Security surface |
| Reminder emails/SMS for VAB dates | Conflicts with “nothing auto-sends” | M | mail routes | Compliance + spam |
| Standalone VAB app / top-level tab always visible | Dilutes RE intake thesis | L | navigation | Product drift |

---

## H. Recommended next Cursor prompt

```text
Read-only context: PROPERTY_TAX_VAB_MVP_AUDIT.md on branch cursor/property-tax-vab-mvp-audit-fa67 (baseline origin/main).

Implement ONLY this S-sized gap fill for the existing optional Florida property-tax Assessment/VAB track — do not redesign or add new tabs/apps:

1) Add `deferral` to `DemoPropertyTaxAssessmentReportedIssueType` in lib/demo/types.ts.
2) Extend PROPERTY_TAX_ASSESSMENT_REPORTED_ISSUE_OPTIONS, type guards, and assessmentIssueTypeLabel in lib/demo/propertyTaxIssue.ts (label: "Tax deferral" or "Deferral"; treat as reported fact only).
3) Ensure PropertyTaxIntakeSection select options come from the shared options constant (no hard-coded duplicate list).
4) Add/adjust unit tests in tests/demo/propertyTaxIssue.test.ts (and intake test if options are asserted) for normalize/createEmpty accepting `deferral` and for the label helper.

Hard requirements:
- No statutory deadline logic, no filing, no eligibility determination, no new document system, no copy that says the app calculates legal deadlines.
- Preserve existing behavior for other issue types and kinds.
- Do not modify condo diligence, FinCEN, or unrelated matter statuses.
- Run the affected vitest files and fix failures you introduce.

Out of scope: taxYear field, mailing-vs-received dates, presets expansion, UI redesign, commits beyond these files unless required for the enum wiring.
```

---

## Appendix — Architecture snapshot

| Layer | Stack / location |
|---|---|
| App | Next.js demo under `/demo` (`package.json` name `intake-app`) |
| PTX domain | `lib/demo/propertyTaxIssue.ts` + types |
| UI | Intake section; MatterDetailModal Overview + Key Dates; `/demo` scenario cards |
| Persistence | Browser localStorage/sessionStorage demo keys — not live Supabase PTX tables |
| Quality | Vitest property-tax suite + Playwright `e2e/demo-property-tax-scenarios.spec.ts` |
| Positioning | Pilot docs explicitly keep PTX as optional adjacent workflow |

**End of audit.**
