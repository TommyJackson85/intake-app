# Assessment / VAB Demo Readiness Audit

**Audit date:** 2026-09-20  
**Baseline:** `origin/main` @ `5e391ab` (`feat(demo): split Assessment/VAB notice mailing and received dates (#107)`)  
**Branch for this report only:** `cursor/assessment-vab-demo-readiness-fa67`  
**Scope:** Read-only. No application code, dependencies, migrations, demo data, or UI components were changed for this audit. This file is the only deliverable.  
**Prior coverage audit:** `PROPERTY_TAX_VAB_MVP_AUDIT.md` (merged #103) — field gaps called out there for tax year and notice mailing/received dates are **closed on current main** (#105–#107). Open draft PRs #104 (deferral type) and #108 (specialist-review status) are **not** on main and are treated as absent.

**Product constraint:** LawIntake is a Florida RE legal-intake / matter-workflow demo. Assessment/VAB is an optional adjacent triage track for notice intake, document collection, factual dates, verification, and staff/lawyer review. It must not give legal advice, calculate authoritative deadlines, determine eligibility/timeliness, predict outcomes, generate petitions, or auto-file with a VAB.

---

## 1. Executive verdict

**Verdict: `Ready for customer-demo validation`**

Top three reasons:

1. **End-to-end demo path exists on main.** `/demo` ships a seeded Assessment/VAB scenario (`Assessment Review — Bayview Residence`, file `FL-2026-007`) with intake link + matter open, Overview, Key Dates, suggested document requests, and reset-safe fixtures (`lib/demo/propertyTaxDemoScenarios.ts` ~63–79, ~122–149, ~245–320; `app/demo/_components/PropertyTaxDemoScenariosCard.tsx`; `app/demo/page.tsx` ~279).
2. **Bounded triage fields lawyers need for a notice conversation are implemented and framed as review support.** On `assessment_vab`: reported issue type, optional tax year, TRIM received flag, notice mailing/issue date, notice received date, VAB petition filed flag, petition filed date, hearing date, per-date verification sources (`client_reported` | `documented` | `firm_verified` | `unknown`) — `lib/demo/types.ts` ~159–203; intake UI `app/demo/_components/PropertyTaxIntakeSection.tsx` ~359–449; helpers `lib/demo/propertyTaxIssue.ts`.
3. **Safety copy and tests already constrain the demo.** Boundary disclaimers deny advice, appeal rights, filing deadlines, and entitlements (`PROPERTY_TAX_ISSUE_BOUNDARY_DISCLAIMER` / overview / Key Dates footers in `propertyTaxIssue.ts` ~945–950, ~1284–1288). Unit suites under `tests/demo/propertyTax*.test.ts` plus E2E smoke `e2e/demo-property-tax-scenarios.spec.ts` cover Florida gating, verification wording, presets, Overview, Key Dates, and scenario seeds.

---

## 2. Demonstrable user journey

Click-by-click path using **only** surfaces that exist in the repository. Prefer the seeded Bayview matter for a short customer demo; the intake path is available when you want to show capture.

### A. Reset and open demo (recommended start)

1. Open `/demo`.
2. If prior local edits may have polluted seeds, use the demo reset control (`DemoResetControls` via `DemoPersistenceNotice` in `app/demo/layout.tsx` / `app/demo/_components/DemoResetControls.tsx`) so Bayview rehydrates from `buildPropertyTaxDemoScenarioMatters()`.
3. On the dashboard, find **Property-Tax & Tax-Deed Demo Scenarios** (`PropertyTaxDemoScenariosCard`, `data-testid="property-tax-demo-scenarios"`). Confirm fictional disclaimer text.
4. Under **Assessment Review — Bayview Residence**, click **Open matter** (`property-tax-demo-matter-assessment_vab`) → opens `MatterDetailModal` for `FL-2026-007` / `matter-005`.

### B. Matter Overview — Assessment/VAB facts

5. Stay on **Overview**. When Florida address + active PTX involvement are present, `PropertyTaxMatterOverviewPanel` renders (`MatterDetailModal.tsx` ~1158; panel `data-testid="matter-property-tax-overview"`).
6. Show the Assessment/VAB kind row (`matter-property-tax-kind-assessment_vab`): status badge **Information needed** (seed `needs_more_info` in `buildAssessmentVabDemoPropertyTaxIssue()` ~136), factual lines for assessed value, tax year `2026`, TRIM received, notice mailed/issued `2026-08-18`, notice received `2026-08-20`, VAB petition unknown (`getPropertyTaxKindFactualSummaryLines` ~1241–1253).
7. Point at verification on the most relevant date (seed hearing `2026-10-22` / `documented`) and the **Next** line (unverified dates drive “Verify the date stated in the notice for attorney review.” — `getPropertyTaxKindNextStep` ~1117–1124).
8. Optionally click **View tracked dates** (`ptx-view-tracked-dates`) to jump to Key Dates tab wiring in the modal.

### C. Suggested documents (staff-controlled)

9. In Overview, open **Suggested Property-Tax & Tax-Deed Documents** (`matter-property-tax-suggested-docs`). Safe copy states suggestions are not legal requirements (`PROPERTY_TAX_SUGGESTED_DOCS_SAFE_COPY` in `staffPropertyTaxDocumentRequestPresets.ts` ~25–26).
10. Review Assessment presets (TRIM, Property Appraiser correspondence, VAB petition/hearing notice, appraisal/comps, exemption/classification/portability records, other — `ASSESSMENT_PRESETS` ~62–105). Staff must select and click **Create selected requests** (`ptx-create-selected-docs`) — nothing auto-sends.

### D. Key Dates

11. Switch to the matter **Key Dates** tab. `PropertyTaxKeyDatesSection` appears (`MatterDetailModal.tsx` ~3397; `data-testid="matter-property-tax-key-dates"`).
12. Show Assessment/VAB date rows (mailing, received, VAB filing, hearing — including empty slots where unset). Verification labels + optional **Soon (calendar)** / **Past date** pills (`PropertyTaxKeyDatesSection.tsx` ~166–169). Footer denies statutory calculation (`PROPERTY_TAX_KEY_DATES_SAFE_FOOTER` ~1287–1288).

### E. Optional: intake capture path

13. From `/demo` scenario card, click **Open intake** (`property-tax-demo-intake-assessment_vab`) → `/demo/intake/<token>`.
14. Confirm `client-intake-property-tax-section` / `PropertyTaxIntakeSection`: involvement question, kind `assessment_vab`, TRIM received, reported issue type, tax year helper, VAB petition filed, dated fields with source selects, document checklist toggles, boundary disclaimer at section top (~235–237, ~359–449).
15. Alternate staff path: **New intake** modal also mounts `PropertyTaxIntakeSection` (`NewIntakeDemoModal.tsx` ~666, ~796). Opening a lead as a matter preserves PTX via `mapIntakeLeadToNewMatterInitialValues` (`demoIntakeFlow.ts` ~121). **Note:** `NewMatterModal.tsx` carries `propertyTaxIssue` from lead initial values only — it does **not** currently mount `PropertyTaxIntakeSection` for blank matter creation.

### F. Safe endpoint (what the demo ends on)

16. Endpoint is **internal staff/lawyer review**: status badges (`not_started` | `in_progress` | `needs_more_info` | `ready_for_attorney_review`), Overview next-step copy, seed task “Collect assessment / TRIM records for attorney review (demo)” (`propertyTaxDemoScenarios.ts` ~305–310), and document requests for firm review.  
17. **Not in the app:** filing a VAB petition, deadline calculation, eligibility determination, specialist portal, referred/not-in-scope status, DR-486 generation, or outbound agency send.

---

## 3. Current feature coverage

| Customer need | Current implementation | Exact evidence | Demo-ready? | Known limitation |
|---|---|---|---|---|
| Issue classification (valuation / exemption / classification / portability / other / unknown) | `reportedIssueType` enum on `assessment_vab`; intake select | `types.ts` ~160–166; `PROPERTY_TAX_ASSESSMENT_REPORTED_ISSUE_OPTIONS` `propertyTaxIssue.ts` ~472–482; `PropertyTaxIntakeSection.tsx` ~374–396 | Yes | No `deferral` type on main (draft #104 only). Homestead not a separate reported type. |
| County / property identification | Shared `floridaCounty`, `parcelOrFolio`; matter `property.address` / `property.county`; Florida gating | `types.ts` ~299–301; intake shared fields in `PropertyTaxIntakeSection`; `shouldShowPropertyTaxIntakeSection` / `isFloridaPropertyAddress` | Yes | Free-text folio; no county format validation. |
| Tax year | Optional string `taxYear` on assessment branch; Overview summary when non-blank | `types.ts` ~173–178; intake ~399–419; seed `'2026'` scenarios ~139; summary ~1243–1248 | Yes | Free text; explicitly not a filing-year determination. |
| Notice mailing / issue date | `noticeMailingDate` dated value + intake label/hint; legacy `trimNoticeDate` mirrored | `types.ts` ~184–198; date fields ~714–715; intake hints ~446–448; seed ~143 | Yes | Not a statutory mailing deadline; mirrored with legacy TRIM field for older rows. |
| Notice received date | `noticeReceivedDate` dated value + TRIM received tri-state | `types.ts` ~189–193, ~180; seed ~144; summary ~1251 | Yes | Boolean “TRIM received” is separate from received **date**. |
| TRIM / petition / hearing | `noticeReceived`, `vabPetitionFiled`, `vabFilingDate`, `vabHearingDate` | `types.ts` ~180–200; intake radios ~361–432; Key Dates fields | Yes | Petition is `boolean \| null`, not a richer filing-receipt model. |
| Verification source | Per-date `source` + labels / banners | `DemoPropertyTaxDateSource` `types.ts` ~136–140; `getPropertyTaxDateVerificationLabel` ~896–900; stated-deadline banner ~905–910 | Yes | `documented` still needs firm verification before firm-recorded treatment. |
| Documents / evidence checklist | Kind checklist + availableDocumentIds toggles on intake | `getPropertyTaxDocumentChecklist` `propertyTaxIssue.ts`; intake checklist UI | Yes | Checklist ≠ created requests; no first-class POA / DR-486 / proof-of-delivery ids. |
| Staff document requests | Presets → staff select → create `DemoDocumentRequest` | `staffPropertyTaxDocumentRequestPresets.ts`; Overview suggested-docs UI | Yes | Staff-gated; not auto-sent; no denial-letter-specific preset id. |
| Overview visibility | Conditional Florida + involvement panel | `shouldShowPropertyTaxMatterOverviewPanel`; `PropertyTaxMatterOverviewPanel.tsx` | Yes | Hidden for non-Florida / involvement No / missing PTX object. |
| Key Dates visibility | Parallel subsection; shows all field slots for selected kinds | `shouldShowPropertyTaxKeyDatesSection`; `buildPropertyTaxKeyDatesModel` ~1434–1492; `PropertyTaxKeyDatesSection.tsx` | Yes | Empty date rows still listed (by design); soft Soon/Passed are calendar-only (≤3 days Soon in `getPropertyTaxKeyDateUrgencyPill` ~1392–1399; soft window constant 14 days used elsewhere ~51). |
| Internal review / urgency | Per-kind status badges; next-step strings; calendar Soon/Passed | Statuses `types.ts` ~153–157; presentation ~967+; next-step ~1117–1136; Key Dates pills | Partial | Status is **display-only** on Overview (no staff status select on main). No specialist-review / referred / not-in-scope statuses (draft #108 not merged). |
| Representation / authorisation | Not modeled on `assessment_vab` | Repo search: no Assessment/VAB POA field; “POA” only as contact-role placeholders (`NewIntakeDemoModal.tsx` ~570, intake token page ~304) | No | Tax-deed track has probate/authority **document preset**, not VAB representation. |
| Referral / not-in-scope handling | Operational next-step + seed tasks only | Seed task copy; `ready_for_attorney_review` status; no referral ACL/portal | Partial | No structured referral, specialist access, or “not in scope” status. |

---

## 4. Demo script (≈5–7 minutes)

**Audience:** Florida real-estate lawyer (or RE closing counsel who occasionally sees TRIM/assessment notices).  
**Setup:** `/demo`, reset demo data if needed, browser wide enough for matter modal.

| Minute | Say | Click / show | Ask the lawyer |
|---|---|---|---|
| 0:00–0:45 | “This is a Florida closing-matter demo. Property tax is optional triage — we organize what the client brought in so your team can review. It does not calculate appeal deadlines or file with the VAB.” | `/demo` → scenario card disclaimer (`property-tax-demo-scenarios-disclaimer`) | “When a client brings you a TRIM or assessment notice mid-transaction, where does that information live today?” |
| 0:45–2:00 | “Here’s a fictional Bayview residence where the client reports the assessment looks high and has a TRIM.” | **Open matter** on Assessment Review — Bayview | “Is ‘assessment looks high + TRIM in hand’ a realistic first signal you get, or do you usually see something else first?” |
| 2:00–3:15 | “Overview keeps the track facts together: issue type, tax year on the notice, mailing vs received dates, petition unknown — all for review, not a determination.” | Overview panel; point at tax year `2026`, notice mailed/issued, notice received, status **Information needed**, **Next** verify copy | “Which of these fields would your paralegal insist on capturing at intake?” |
| 3:15–4:15 | “Staff can request missing records without the system declaring them legally required.” | Suggested docs → show TRIM vs Property Appraiser correspondence defaults; do **not** claim auto-email | “Which document is missing most often when you first see an assessment issue?” |
| 4:15–5:15 | “Key Dates is a tracking board. ‘Soon’ / ‘Past date’ are calendar cues. Verification still says firm review is required.” | Key Dates tab; hearing date + verification label + footer | “Do you calendar notice dates inside the closing file, a separate tax file, or not at all today?” |
| 5:15–6:15 | “Safe endpoint: route for attorney review and collect records. We stop before petition drafting, deadline engines, or VAB filing.” | Point at seed task / next-step language; optionally peek intake link to show client-facing capture | “Would you handle this in-house, refer to a property-tax specialist, or decline — and what would you need before deciding?” |
| 6:15–7:00 | “We’re validating whether this triage saves time before we build deeper tax features.” | Stay on Overview; do not open condo/FinCEN unless asked | “If this shipped as an optional module on closing matters, would your firm turn it on?” |

---

## 5. Customer discovery questions

1. At intake for a Florida purchase or sale, how often do clients already mention a property-tax or assessment notice?
2. When a TRIM or Property Appraiser notice arrives, which documents are most often still missing a week later?
3. Who in your firm first reviews those notices — attorney, paralegal, or someone else?
4. Which dates do you actually write down (mailing, received, hearing, petition filed, something else)?
5. How do you currently prove or document that a notice was received or delivered?
6. For assessment / VAB issues that appear during a closing, do you typically handle them, refer them, or decline?
7. Have existing workflows caused missed follow-ups on tax notices in the last year? What broke down?
8. Looking at this triage-only demo (facts + docs + review — no filing), what would make it worth using on a live matter?
9. What would make you **not** want this feature next to the closing file?
10. Aside from assessed value, which classification (exemption, portability, deferral, other) do you see often enough that it should be a first-class intake choice?

---

## 6. Gap triage

### Must fix before a customer demo

_None identified in application code on current main for a founder-led demo that uses the seeded Bayview path._

Operational (not code) checklist only:

- Reset demo data before the meeting so `FL-2026-007` matches seeds.
- Stay on Assessment/VAB (or clearly label if you open buyer-tax / tax-deed scenarios — they are adjacent demos, not VAB filing).
- Do not improvise claims about deadline calculation, petition generation, or VAB e-filing — those features are not present.

### Validate with lawyers before building

| Item | Why (repo evidence) |
|---|---|
| Tax-deferral as reported issue type | Absent on main (`PROPERTY_TAX_ASSESSMENT_REPORTED_ISSUE_OPTIONS` has no `deferral`; draft PR #104 only). Prior audit flagged it; do not merge without demand signal. |
| Editable internal status / “needs property-tax specialist review” | Statuses exist but Overview shows badges only (`PropertyTaxMatterOverviewPanel.tsx` ~157–163). Draft #108 adds specialist status + select — **not on main**. Ask whether referral hand-off needs a dedicated status vs notes/tasks. |
| Prior property address for portability | Portability is a reported-issue option only (`types.ts` ~164); no prior-address field. |
| Representation / POA / authorisation capture | No Assessment/VAB POA field; POA only as generic contact-role placeholder elsewhere. |
| Referred / not-in-scope / withdrawn statuses | Only `not_started` \| `in_progress` \| `needs_more_info` \| `ready_for_attorney_review` (`types.ts` ~153–157). |
| Split filing-receipt vs petition/hearing document presets | Combined preset `ptx-vab-petition` (“VAB petition and/or hearing notice”) in `staffPropertyTaxDocumentRequestPresets.ts` ~71–82. |
| Stronger E2E on Assessment Overview (tax year + mailing/received) | E2E opens Assessment **intake** and Tax-deed **matter** firm-verification copy (`e2e/demo-property-tax-scenarios.spec.ts` ~42–55); does not assert Bayview Overview tax-year/notice lines. |
| Whether blank-matter creation should expose PTX intake | `NewMatterModal` maps lead PTX but does not mount `PropertyTaxIntakeSection`. |

### Do not build in the MVP

| Item | Why (repo evidence / product constraint) |
|---|---|
| Authoritative Florida statutory deadline engine | Explicit non-goal in `propertyTaxIssue.ts` header ~3–9; soft urgency only (~51, ~1392–1399). |
| VAB petition generation / DR-486 productization | Repo-wide search: **no** `DR-486` / `DR486` matches in demo PTX modules. |
| Auto-filing with VAB or county systems | Non-goal; no integrations in PTX helpers. |
| Outcome scoring / comparable-sales analysis as advice | Appraisal/comps exist only as **optional document request** title (~84–89), not analysis. |
| County-specific procedure engines / reminder auto-send | No PTX reminder sender; presets explicitly do not auto-send (`staffPropertyTaxDocumentRequestPresets.ts` ~3–6). |
| External specialist portal / new ACL product | Not found; would expand beyond optional adjacent triage. |
| Standalone property-tax product surface | Keep nested optional `propertyTaxIssue` on intake/matter (`types.ts` ~283–305, ~351). |

**Completed since `PROPERTY_TAX_VAB_MVP_AUDIT.md` (confirm on main):** optional `taxYear` (#105/#106); split `noticeMailingDate` / `noticeReceivedDate` (#107). **Not completed on main:** deferral type (#104 draft); specialist-review status (#108 draft).

---

## 7. Recommended next action

**Choice: `Stop coding and begin customer interviews`**

The Assessment/VAB track on `main` already supports a bounded, disclaimer-backed customer demo: seeded Bayview matter, intake capture, tax year, mailing/received dates, verification sources, Overview, Key Dates, and staff document-request presets. Remaining gaps (deferral type, specialist status, POA, DR-486, referral portal, deadline engines) are either open drafts or explicitly out of MVP. Further coding without lawyer feedback risks building the wrong hand-off model. Use section 4’s script and section 5’s questions; reopen build only after validation.

---

## 8. Safety check

### User-facing Assessment/VAB / property-tax copy and behaviours (main)

| Surface | Wording / behaviour | File (approx.) | Safe? |
|---|---|---|---|
| Intake section title + boundary | Collect for staff/lawyer review; does **not** provide tax/legal advice, determine appeal rights, establish a filing deadline, redemption, liens, or proceeds | `PROPERTY_TAX_ISSUE_BOUNDARY_DISCLAIMER` `propertyTaxIssue.ts` ~945–946; rendered `PropertyTaxIntakeSection.tsx` ~235–237 | Yes |
| Involvement question | May this matter involve Florida property-tax / assessment / delinquent / tax-deed / surplus issues? | `PROPERTY_TAX_INVOLVEMENT_QUESTION` ~956–957 | Yes — triage gate |
| Tax year helper | Optional; collected for staff/lawyer review; verify before action | `PropertyTaxIntakeSection.tsx` ~415–418 | Yes |
| Dates preamble | Dates collected for staff/lawyer review; verify before action | same ~434–436 | Yes |
| Notice mailing / received hints | Optional enter date on notice / date client reports receiving | ~446–449 | Yes |
| TRIM / VAB petition questions | Fact radios (“Has a TRIM notice been received?”, “Has a VAB petition been filed?”) | ~361–432 | Yes as fact capture — do not narrate as filing instruction in demos |
| Overview title + kind badges | Status labels Not started / In review / Information needed / Ready for attorney review | `propertyTaxIssueStatusPresentation` ~967+; panel badges | Yes — operational, not clearance |
| Overview next steps | Verify date / request TRIM & appraiser correspondence for attorney review | `getPropertyTaxKindNextStep` ~1117–1131 | Yes |
| Overview / suggested-docs disclaimers | Panel disclaimer + suggested docs not legal requirements | `PROPERTY_TAX_MATTER_OVERVIEW_DISCLAIMER` ~949–950; `PROPERTY_TAX_SUGGESTED_DOCS_SAFE_COPY` | Yes |
| Key Dates footer + pills | Not calculated statutory deadlines; Soon **(calendar)** / Past date | `PROPERTY_TAX_KEY_DATES_SAFE_FOOTER`; `PropertyTaxKeyDatesSection.tsx` | Yes |
| Stated-deadline banner (tax-deed primarily) | “Deadline reported or documented — firm verification required.” | `getPropertyTaxStatedDeadlineBanner` ~905–910 | Yes — watch live narration so “deadline” is always “as stated on notice” |
| Scenario card disclaimer | Organizes intake facts and review; no legal/tax advice | `propertyTaxDemoScenarios.ts` ~58; card testid disclaimer | Yes |
| Bayview seed notes | Demo sample only — not a legal claim; not a validity determination | scenarios ~129–133 | Yes |
| Document preset descriptions | “Request if available — suggested for firm review”; petition preset “(not a filing instruction)” | `staffPropertyTaxDocumentRequestPresets.ts` ~62–82 | Yes |
| Helper module non-goals | Does not advise, calculate, file, or judge notice sufficiency | `propertyTaxIssue.ts` ~1–9 | Yes (developer-facing; reinforces product boundary) |

### Flags / watch-outs (not blockers)

1. **Word “deadline”** appears in surplus stated-deadline UI and Key Dates field label “Deadline exactly as stated in the relevant notice” (`getPropertyTaxDateFieldsForKind` delinquent ~729). Always pair with “as stated / firm verification” in demos — Assessment/VAB mailing/received fields are **not** marked `isStatedDeadline` (~1079–1080).
2. **“Ready for attorney review”** is an operational status, not legal clearance — say so if asked.
3. **Draft PRs #104 / #108** must not be demoed as shipped until merged; current main does not include deferral or specialist-review status UI.
4. No user-facing copy was found that claims the app files a petition, calculates a statutory VAB deadline, or determines eligibility. **No mandatory copy revision** is required before customer-demo validation.

---

## Appendix — Files inspected

- `PROPERTY_TAX_VAB_MVP_AUDIT.md`
- `lib/demo/types.ts`
- `lib/demo/propertyTaxIssue.ts`
- `lib/demo/propertyTaxDemoScenarios.ts`
- `lib/demo/staffPropertyTaxDocumentRequestPresets.ts`
- `lib/demo/demoIntakeFlow.ts`
- `lib/demo/store.tsx` (PTX persistence / matter create paths referenced via prior coverage)
- `app/demo/_components/PropertyTaxIntakeSection.tsx`
- `app/demo/_components/PropertyTaxDemoScenariosCard.tsx`
- `app/demo/_components/NewIntakeDemoModal.tsx`
- `app/demo/_components/NewMatterModal.tsx`
- `app/demo/_components/DemoResetControls.tsx`
- `app/demo/page.tsx`
- `app/demo/intake/[token]/page.tsx` (POA placeholder / PTX section presence)
- `components/demo/PropertyTaxMatterOverviewPanel.tsx`
- `components/demo/PropertyTaxKeyDatesSection.tsx`
- `components/demo/MatterDetailModal.tsx` (Overview + Key Dates mount points)
- `tests/demo/propertyTaxIssue.test.ts`
- `tests/demo/propertyTaxIntake.test.ts`
- `tests/demo/propertyTaxMatterOverview.test.ts`
- `tests/demo/propertyTaxKeyDates.test.ts`
- `tests/demo/propertyTaxDocumentRequestPresets.test.ts`
- `tests/demo/propertyTaxDemoScenarios.test.ts`
- `e2e/demo-property-tax-scenarios.spec.ts`
- GitHub PR list for property-tax / Assessment-VAB related PRs (#71–#79, #103–#108) to distinguish merged vs draft

**Case-insensitive search terms used:** `assessment_vab`, `propertyTax`, `VAB`, `TRIM`, `taxYear`, `noticeMailingDate`, `noticeReceivedDate`, `petition`, `hearing`, `verification`, `deadline`, `deferral`, `portability`, `DR-486`, `POA`, `referral`, `not in scope`, `evidence`, `document request`.
