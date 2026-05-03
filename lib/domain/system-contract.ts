/**
 * Canonical system contract — reference-only documentation artifact.
 *
 * This module is the intended shared source-of-truth *description* of domains, relationships,
 * and environment boundaries. It does not replace `Demo*` types, the demo store, or generated DB types.
 *
 * Evolution:
 * - Update this file as demo features and live schema evolve; keep demo/live/AI notes honest.
 * - The demo app (`lib/demo/*`) is currently the closest *product-shaped* implementation of many flows.
 * - The live app is stricter: server auth, firm scoping, Supabase RLS, and audited mutations — adapters must enforce that.
 * - AI/automation must respect the readable/writable boundaries declared per domain; it must not invent writes
 *   outside those boundaries or bypass human confirmation where the contract says it is required.
 *
 * Mappings:
 * - Demo implementation types: primarily `lib/demo/types.ts`; persistence/API surface: `lib/demo/store.tsx`;
 *   seed vocabulary: `lib/demo/demoData.ts`.
 * - Live DB-oriented shapes: `lib/database.types.ts` (`Database['public']['Tables'][...]`) — do not hand-edit that file.
 * - Do not treat `types/database.ts` as authoritative; it is legacy/illustrative.
 */

/** One logical domain in the system (conceptual, not a DB table). */
export type SystemContractDomain = {
  canonicalName: string
  description: string
  /** Other domains or rows this domain links to (conceptual, not SQL). */
  relationships: string[]
  demo: {
    /** Primary TypeScript types / symbols (file references). */
    primaryTypes: string[]
    /** Store, context, localStorage — operational contract. */
    storeAndPersistence?: string[]
    /** Pure helpers and behavior. */
    helpers?: string[]
    /** Seed / static vocabulary. */
    seed?: string[]
    notes?: string
  }
  live: {
    /** Supabase tables or API areas; use names only — types live in `lib/database.types.ts`. */
    tablesOrRoutes: string[]
    notes: string
  }
  ai: {
    /** What an agent may load or summarize (IDs, redacted summaries, status). */
    readable: string[]
    /** What an agent may propose or directly persist — usually empty until explicitly allowed. */
    writable: string[]
    notes: string
  }
}

export type KnownDivergence = {
  id: string
  summary: string
  /** How adapters / future work should treat it. */
  mitigation: string
}

export type SystemContractMeta = {
  version: string
  purpose: string
  evolutionNotes: string[]
}

export type AiCrossCutting = {
  workflowStages: { id: string; description: string; typicalDemoAnchors: string[] }[]
  globalPrinciples: string[]
}

export type SystemContract = {
  meta: SystemContractMeta
  knownDivergences: KnownDivergence[]
  domains: {
    firmContext: SystemContractDomain
    usersAndRoles: SystemContractDomain
    intakes: SystemContractDomain
    matters: SystemContractDomain
    partiesAndContacts: SystemContractDomain
    documentsAndUploads: SystemContractDomain
    documentRequests: SystemContractDomain
    compliance: SystemContractDomain
    remindersAndChasers: SystemContractDomain
    timelineAndAudit: SystemContractDomain
    portalViews: SystemContractDomain
    aiWorkflows: SystemContractDomain
  }
  aiCrossCutting: AiCrossCutting
}

/**
 * Keys of the `domains` object on `systemContract`.
 * Alias only — stays aligned with `systemContract.domains` for adapters and UI that iterate without hardcoding strings.
 */
export type SystemContractDomainKey = keyof SystemContract['domains']

/**
 * Main export: structured contract for visual maps, adapters, and future payload builders.
 * Safe to import anywhere; it is static data only (no side effects).
 */
export const systemContract = {
  meta: {
    version: '0.1.0',
    purpose:
      'Single editable reference for demo data shape, future live alignment, and AI integration boundaries.',
    evolutionNotes: [
      'Bump `version` when domains or divergence list materially change.',
      'Prefer adding new optional notes over breaking key names once adapters depend on them.',
      'When live schema gains a table, update `live.tablesOrRoutes` here — not the other way around.',
    ],
  },

  knownDivergences: [
    {
      id: 'naming-mixed-case',
      summary:
        'Demo matter-shaped objects mix snake_case (`file_id`, `portal_token`, `key_dates`) and camelCase (`transactionType`, `purchasePrice`). Intake snapshots use camelCase field names that map to different keys on create-matter input.',
      mitigation:
        'Adapters must document field mappings explicitly; a future canonical API layer should normalize casing per environment.',
    },
    {
      id: 'multiple-status-concepts',
      summary:
        'Several independent "status" concepts exist: `DemoMatter.status` (UI pipeline), task-derived status via `deriveMatterStatus` in `lib/demo-utils.ts`, optional milestone logs (`MatterMilestoneStatus`) for portal narrative, document/request statuses, condo diligence matter/doc statuses, FinCEN report/cert statuses.',
      mitigation:
        'Do not collapse these in the contract; name them by domain. Adapters map each to the closest canonical concept.',
    },
    {
      id: 'split-client-models',
      summary:
        '`DemoClient` in the demo store differs from live `clients` rows (`lib/database.types.ts`) in fields and lifecycle (e.g. `linked_matter_ids` vs firm-scoped CRM).',
      mitigation:
        'Treat "party on matter" (`DemoParty` buyer/seller) separately from "client record" until unified.',
    },
    {
      id: 'split-fincen-storage',
      summary:
        'FinCEN reporting payload is nested on `DemoMatter.fincen` while tokenized beneficial-owner certification requests also live in `fincenCertRequests` / dedicated storage keys in the demo store.',
      mitigation:
        'Compliance domain lists both; adapters joining matter + cert request must preserve this split until consolidated.',
    },
    {
      id: 'demo-data-context-wording',
      summary:
        '`context/DemoDataContext.tsx` comments suggest ephemeral state but the implementation delegates to `useDemoStore`, which persists slices to localStorage.',
      mitigation:
        'Treat the store as the persistence source; DemoDataContext as a narrow UI facade — not a second truth.',
    },
  ],

  domains: {
    firmContext: {
      canonicalName: 'Firm context',
      description: 'Tenant boundary: firm identity and branding used in demo and live.',
      relationships: ['usersAndRoles', 'matters', 'intakes', 'clients', 'documentsAndUploads'],
      demo: {
        primaryTypes: ['`DemoFirm` in `lib/demo/types.ts`'],
        storeAndPersistence: ['In-memory + seed via `lib/demo/store.tsx` from `lib/demo/demoData.ts`'],
        seed: ['`demoSeedData.demoFirm` in `lib/demo/demoData.ts`'],
        notes: 'Demo firm is static seed; not multi-tenant.',
      },
      live: {
        tablesOrRoutes: ['`firms`', '`app/api/auth/*`', '`app/dashboard/*`'],
        notes: 'Live firms are authoritative tenant keys; demo login may use dedicated demo firm flows.',
      },
      ai: {
        readable: ['Firm name, jurisdiction, public-facing contact hints when already in context'],
        writable: [],
        notes: 'No AI writes to firm master data unless product explicitly adds an admin workflow.',
      },
    },

    usersAndRoles: {
      canonicalName: 'Users and roles',
      description: 'Staff/lawyer identities, permissions, and attribution for actions (who requested a doc, uploaded, etc.).',
      relationships: ['firmContext', 'matters', 'documentsAndUploads', 'documentRequests', 'timelineAndAudit'],
      demo: {
        primaryTypes: ['`DemoStaffProfile` in `lib/demo/types.ts`'],
        storeAndPersistence: ['Staff list from seed; IDs referenced on documents/requests in `lib/demo/store.tsx`'],
        seed: ['`demoSeedData.staff` in `lib/demo/demoData.ts`'],
        notes: 'Demo has no real auth; profiles are illustrative.',
      },
      live: {
        tablesOrRoutes: ['`profiles`', '`sessions`', '`app/api/auth/*`'],
        notes: 'Live roles and firm_id scoping come from Supabase auth + profiles.',
      },
      ai: {
        readable: ['Role labels for explaining permissions in copy', 'Staff display names on artifacts'],
        writable: [],
        notes: 'AI must not create users or elevate roles.',
      },
    },

    intakes: {
      canonicalName: 'Intakes / leads',
      description: 'Pre-matter capture: secure link, client submission, conflict check gate, mapping to matter creation.',
      relationships: ['firmContext', 'matters', 'partiesAndContacts', 'compliance'],
      demo: {
        primaryTypes: ['`DemoIntakeLead`', '`DemoIntakeSnapshot` in `lib/demo/types.ts`'],
        storeAndPersistence: ['`registerIntakeLead`, `submitDemoIntakeLead`, intake lead storage keys in `lib/demo/store.tsx`'],
        helpers: [
          '`lib/demo/demoIntakeFlow.ts` (e.g. `effectiveIntakeSnapshot` for intake-derived names)',
          '`app/demo/intakes/page.tsx` — staff Intake / Leads list: demo conflict check gate (modal, name matching, outcomes via `patchIntakeLead`); matching logic is page-local today, not a shared `lib/demo` module',
        ],
        notes:
          'Demo tokens are browser-local; not production security model. Client pseudo-form: `app/demo/intake/[token]/page.tsx` (submission only; no conflict UI there). Staff conflict review and “open as matter” readiness: `app/demo/intakes` (`app/demo/intakes/page.tsx`).',
      },
      live: {
        tablesOrRoutes: ['`leads`', '`app/api/dashboard/intakes/*`', '`app/api/intake/[token]/route.ts`'],
        notes: 'Live leads are firm-scoped and server-validated; naming overlaps demo "intake" concept but shapes differ.',
      },
      ai: {
        readable: ['Submitted field summaries', 'Conflict check status if present', 'Matter type / property hints'],
        writable: [],
        notes: 'Draft assistance may propose text; persisting intake is human/server-gated.',
      },
    },

    matters: {
      canonicalName: 'Matters / files',
      description: 'Core transaction file: property, milestones, tasks, key dates, portal token, and matter-level flags.',
      relationships: [
        'firmContext',
        'partiesAndContacts',
        'documentsAndUploads',
        'documentRequests',
        'compliance',
        'timelineAndAudit',
        'portalViews',
      ],
      demo: {
        primaryTypes: ['`DemoMatter`', '`DemoTask`', '`DemoTimelineEvent`', '`key_dates` in `lib/demo/types.ts`'],
        storeAndPersistence: ['`matters`, mutations in `lib/demo/store.tsx`; localStorage key `lawintake-demo-matters-v1`'],
        helpers: ['`deriveMatterStatus` in `lib/demo-utils.ts`'],
        seed: ['`demoSeedData.matters`', 'milestone logs in `lib/demo/demoData.ts`'],
        notes: 'Archive/deleted matter slices also exist in store state for demo UX.',
      },
      live: {
        tablesOrRoutes: ['`matters`', '`app/api/dashboard/matters/*`', '`app/api/external/matters/route.ts`'],
        notes: 'Live matter rows are narrower than `DemoMatter`; many demo fields are UI-only until migrated.',
      },
      ai: {
        readable: [
          'Matter id/file reference, matter type, key dates, task checklist status summaries',
          'Compliance eligibility flags derived from matter (not raw PII unless policy allows)',
        ],
        writable: [],
        notes: 'Structured "suggested task updates" may be proposed off-record; applying them uses explicit store/API paths later.',
      },
    },

    partiesAndContacts: {
      canonicalName: 'Parties, contacts, entities',
      description: 'Buyers, sellers, agents, lenders, and entity vs individual distinctions used for intake and compliance.',
      relationships: ['matters', 'intakes', 'clients', 'compliance'],
      demo: {
        primaryTypes: ['`DemoParty`', '`DemoPartyType`', '`DemoTransactionRole` in `lib/demo/types.ts`'],
        helpers: ['`lib/demo/matterPartyDisplay.ts`'],
        notes: 'Parties are embedded on `DemoMatter`; separate `DemoClient` records link by file id.',
      },
      live: {
        tablesOrRoutes: ['`clients`', 'matter-party linkage via API/dashboard as implemented'],
        notes: 'Live CRM client is firm-scoped; demo "party" may not equal one client row.',
      },
      ai: {
        readable: ['Names and roles when already in authenticated context; mask as required by policy'],
        writable: [],
        notes: 'Beneficial ownership details are high sensitivity — see compliance domain.',
      },
    },

    documentsAndUploads: {
      canonicalName: 'Documents and uploads',
      description: 'Stored file metadata, categories, review state, linkage to matter and uploader.',
      relationships: ['matters', 'documentRequests', 'portalViews', 'usersAndRoles'],
      demo: {
        primaryTypes: ['`DemoDocument` in `lib/demo/types.ts`'],
        storeAndPersistence: ['`documents`, `addDemoDocument`, `fulfillDemoDocumentRequest` in `lib/demo/store.tsx`'],
        helpers: ['`lib/demo/demoDocument.ts`', '`lib/demo/documentPreviewPresentation.ts`', '`lib/demo/engagementLetterPreview.ts`'],
        notes: 'Demo documents are metadata + simulated uploads; binary storage is not modeled here.',
      },
      live: {
        tablesOrRoutes: ['Dashboard documents surfaces', 'external export routes under `app/api/external/export/*`'],
        notes: 'Exact live document table naming may differ; align contract when schema stabilizes.',
      },
      ai: {
        readable: ['Titles, categories, review status, dates — not file bytes unless explicitly integrated'],
        writable: [],
        notes: 'AI may propose checklist labels; creating real documents stays server-side.',
      },
    },

    documentRequests: {
      canonicalName: 'Document requests',
      description: 'Lawyer-initiated asks fulfilled via portal or staff upload; open vs fulfilled lifecycle.',
      relationships: ['matters', 'documentsAndUploads', 'portalViews', 'compliance'],
      demo: {
        primaryTypes: ['`DemoDocumentRequest`', '`DemoDocumentRequestStatus` in `lib/demo/types.ts`'],
        storeAndPersistence: ['`documentRequests`, `addDemoDocumentRequest` in `lib/demo/store.tsx`'],
        helpers: ['`lib/demo/demoDocumentRequest.ts`'],
        notes: 'Condo diligence UI derives linkage to requests via `lib/demo/condoDiligence.ts` without changing request shapes.',
      },
      live: {
        tablesOrRoutes: ['Portal/home APIs', 'dashboard matter client preview routes'],
        notes: 'Map to live request/fulfillment tables when present; contract lists conceptual role first.',
      },
      ai: {
        readable: ['Open vs fulfilled counts', 'Titles/categories for missing-doc narratives'],
        writable: [],
        notes: 'Creating requests is a staff action; AI may suggest wording only.',
      },
    },

    compliance: {
      canonicalName: 'Compliance (AML, FinCEN, condo diligence)',
      description: 'Regulatory and transaction-type workflows: AML checks, FinCEN reporting & certification, Florida condo diligence.',
      relationships: ['matters', 'partiesAndContacts', 'documentsAndUploads', 'documentRequests'],
      demo: {
        primaryTypes: [
          '`DemoFinCEN`',
          '`DemoFinCENCertRequest`',
          '`FinCENBeneficialOwner`',
          '`DemoCondoDiligence*` in `lib/demo/types.ts`',
        ],
        storeAndPersistence: [
          '`fincen*` mutations, `condoDiligenceByMatterId`, related localStorage keys in `lib/demo/store.tsx`',
        ],
        helpers: [
          '`lib/demo/fincenEligibility.ts`',
          '`lib/demo/condoDiligence.ts`',
          '`components/demo/DemoFinCENTab.tsx` (UI binding reference)',
        ],
        notes: 'FinCEN nested on matter plus separate cert-request collection — see knownDivergences.split-fincen-storage.',
      },
      live: {
        tablesOrRoutes: ['`aml_checks`', 'FinCEN-related live flows as added to schema/API'],
        notes: 'Live AML rows exist; FinCEN may be partially demo-only until parity.',
      },
      ai: {
        readable: [
          'Eligibility booleans',
          'Completion counts',
          'Non-attorney conclusions phrased as checklist prompts — not legal determinations',
        ],
        writable: [],
        notes: 'Strict boundary: AI does not file reports or mark regulatory fields "filed" without human + server validation.',
      },
    },

    remindersAndChasers: {
      canonicalName: 'Reminders and document chasers',
      description: 'Scheduled nudges, deadlines, and follow-ups tied to matters or requests.',
      relationships: ['matters', 'documentRequests', 'portalViews'],
      demo: {
        primaryTypes: ['`DemoCalendarEvent` in `lib/demo/types.ts`'],
        storeAndPersistence: ['`calendarEvents` in `lib/demo/store.tsx`'],
        notes: 'Demo calendar covers closings/deadlines/calls; dedicated "chaser" queue is not fully modeled.',
      },
      live: {
        tablesOrRoutes: ['Calendar/dashboard routes as implemented', 'future notifications service'],
        notes: 'Contract reserves this domain for parity work; live may use jobs/webhooks not in demo.',
      },
      ai: {
        readable: ['Upcoming deadline list summaries when exposed by API'],
        writable: [],
        notes: 'AI may draft reminder copy; sending is out of scope until integrated.',
      },
    },

    timelineAndAudit: {
      canonicalName: 'Timeline notes and audit events',
      description: 'Append-only or append-mostly narrative on matters; firm-level audit trail for compliance.',
      relationships: ['matters', 'usersAndRoles', 'firmContext'],
      demo: {
        primaryTypes: ['`DemoTimelineEvent` on `DemoMatter.timeline` in `lib/demo/types.ts`'],
        storeAndPersistence: ['`addTimelineNote` in `lib/demo/store.tsx`'],
        helpers: ['`components/demo/DemoTimelineNotes.tsx` uses `DemoDataContext` → store'],
        seed: ['`MatterMilestoneStatus`, `DEMO_MILESTONE_LOGS` in `lib/demo/demoData.ts` (portal milestone narrative)'],
        notes: 'Milestone logs are seed/static per matter in demo portal; not the same object as `timeline` notes.',
      },
      live: {
        tablesOrRoutes: ['`audit_logs`', 'GDPR/export routes under `app/api/gdpr/*` and `app/api/external/export/audit-events`'],
        notes: 'Live audit is server-written; demo timeline is local and editable.',
      },
      ai: {
        readable: ['Timeline snippets when policy allows', 'Audit event types — not impersonation secrets'],
        writable: [],
        notes: 'AI should not fabricate audit_log rows.',
      },
    },

    portalViews: {
      canonicalName: 'Client portal views',
      description: 'Token-scoped client experience: matter summary, open requests, simulated fulfillment, milestones display.',
      relationships: ['matters', 'documentRequests', 'documentsAndUploads'],
      demo: {
        primaryTypes: ['`portal_token` on `DemoMatter` in `lib/demo/types.ts`'],
        storeAndPersistence: ['`fulfillDemoDocumentRequest` in `lib/demo/store.tsx`'],
        seed: ['Milestone labels/order in `lib/demo/demoData.ts`'],
        notes: 'Reference UI: `app/demo/portal/[token]/page.tsx` (orchestrator — do not change in this contract step).',
      },
      live: {
        tablesOrRoutes: ['`app/api/portal/home/route.ts`', 'production portal routes as deployed'],
        notes: 'Live portal auth model differs; token semantics must not be assumed identical to demo.',
      },
      ai: {
        readable: ['What the client sees after redaction rules'],
        writable: [],
        notes: 'Portal is client-facing; AI agents default to no direct writes.',
      },
    },

    aiWorkflows: {
      canonicalName: 'AI workflows (cross-matter orchestration)',
      description: 'High-level stages agents use to reason about work without bypassing domain boundaries.',
      relationships: [
        'intakes',
        'matters',
        'documentsAndUploads',
        'documentRequests',
        'compliance',
        'portalViews',
        'timelineAndAudit',
      ],
      demo: {
        primaryTypes: ['Conceptual only — no dedicated AI types yet'],
        helpers: [],
        notes: 'See `aiCrossCutting.workflowStages` for ordered stages; map each stage to demo files in future adapters.',
      },
      live: {
        tablesOrRoutes: [],
        notes: 'Future: server-enqueued jobs, webhooks, or message bus — not in demo.',
      },
      ai: {
        readable: ['All domains per their `readable` lists', 'Workflow stage metadata below'],
        writable: [],
        notes: 'Writable subsets are empty by default; product must whitelist per integration.',
      },
    },
  },

  aiCrossCutting: {
    workflowStages: [
      {
        id: 'intake_capture',
        description:
          'Lead created; client completes intake on the token page; staff runs the demo conflict check and records outcome on Intake / Leads (`patchIntakeLead`) before opening as matter.',
        typicalDemoAnchors: [
          '`lib/demo/types.ts` (`DemoIntakeLead`, conflict gate fields)',
          '`app/demo/intake/[token]/page.tsx` — client-facing intake submission',
          '`app/demo/intakes/page.tsx` — staff conflict check gate and lead list',
        ],
      },
      {
        id: 'matter_opened',
        description: 'Matter/file created from intake or manually; parties and key dates populated.',
        typicalDemoAnchors: ['`createDemoMatter` in `lib/demo/store.tsx`', '`lib/demo/demoIntakeFlow.ts`'],
      },
      {
        id: 'document_collection',
        description: 'Requests issued, portal or staff fulfillment, documents categorized and reviewed.',
        typicalDemoAnchors: ['`lib/demo/demoDocumentRequest.ts`', '`lib/demo/demoDocument.ts`'],
      },
      {
        id: 'compliance_review',
        description: 'AML/FinCEN/condo diligence per eligibility; human review before filing or clearance.',
        typicalDemoAnchors: ['`lib/demo/fincenEligibility.ts`', '`lib/demo/condoDiligence.ts`'],
      },
      {
        id: 'closing_readiness',
        description: 'Tasks and milestones toward closing; status derivations may disagree — see divergences.',
        typicalDemoAnchors: ['`lib/demo-utils.ts`', '`lib/demo/demoData.ts` (milestones)'],
      },
    ],
    globalPrinciples: [
      'Prefer reading from explicit adapter outputs over scraping UI components.',
      'Never persist PII or regulatory conclusions that are not allowed by the target environment.',
      'When demo and live disagree, adapters translate — the contract documents intent, not every column.',
      'Expand `writable` only with explicit product/security review.',
    ],
  },
} as const satisfies SystemContract

export type SystemContractVersion = typeof systemContract.meta.version
