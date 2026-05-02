/**
 * Demo environment adapter — maps each `SystemContractDomainKey` to **reference paths only**.
 *
 * - Does **not** replace `lib/domain/system-contract.ts` (names, relationships, AI/live narrative live there).
 * - Does **not** import or wrap `useDemoStore`; no runtime wiring. Safe for docs, tooling, and future codegen.
 *
 * Keep entries concise; extend paths when new demo files appear. See `systemContract.knownDivergences` for casing/status/FinCEN split.
 */

import type { SystemContractDomainKey } from '@/lib/domain/system-contract'

/** Pointers to the current demo implementation (files / areas). All fields optional where a domain has no single anchor. */
export type DemoDomainImplementationRef = {
  /** Module where primary `Demo*` types for this area live (often shared `lib/demo/types.ts`). */
  typesPath?: string
  /** `DemoProvider` / `useDemoStore` — persistence keys and mutations are defined here only. */
  storePath?: string
  /** Pure helpers, builders, eligibility. */
  helperPaths?: string[]
  /** `demoSeedData`, milestone logs, static labels. */
  seedPaths?: string[]
  /** Representative UI (reference only; large orchestrators stay untouched by this adapter). */
  uiAnchorPaths?: string[]
  /** Demo-only caveats; do not duplicate full contract text. */
  notes?: string
}

/**
 * Canonical domain key → demo repo locations. Keys must stay in sync with `systemContract.domains`.
 */
export const demoImplementationByDomain = {
  firmContext: {
    typesPath: 'lib/demo/types.ts',
    storePath: 'lib/demo/store.tsx',
    seedPaths: ['lib/demo/demoData.ts'],
    uiAnchorPaths: ['app/demo/page.tsx', 'app/demo/layout.tsx'],
    notes: 'Single seeded `DemoFirm`; not multi-tenant. Narrative: `systemContract.domains.firmContext`.',
  },

  usersAndRoles: {
    typesPath: 'lib/demo/types.ts',
    storePath: 'lib/demo/store.tsx',
    seedPaths: ['lib/demo/demoData.ts'],
    notes: '`DemoStaffProfile` seed list; demo has no real auth. Narrative: `systemContract.domains.usersAndRoles`.',
  },

  intakes: {
    typesPath: 'lib/demo/types.ts',
    storePath: 'lib/demo/store.tsx',
    helperPaths: ['lib/demo/demoIntakeFlow.ts'],
    seedPaths: ['lib/demo/demoData.ts'],
    uiAnchorPaths: ['app/demo/intakes/page.tsx', 'app/demo/intake/[token]/page.tsx', 'app/demo/_components/NewIntakeDemoModal.tsx'],
    notes: 'Browser-local tokens; shapes differ from live `leads`. Narrative: `systemContract.domains.intakes`.',
  },

  matters: {
    typesPath: 'lib/demo/types.ts',
    storePath: 'lib/demo/store.tsx',
    helperPaths: ['lib/demo-utils.ts'],
    seedPaths: ['lib/demo/demoData.ts'],
    uiAnchorPaths: ['app/demo/matters/page.tsx', 'app/demo/page.tsx', 'components/demo/MatterDetailModal.tsx'],
    notes: '`DemoMatter.status` vs `deriveMatterStatus` vs milestones — see divergence `multiple-status-concepts`.',
  },

  partiesAndContacts: {
    typesPath: 'lib/demo/types.ts',
    helperPaths: ['lib/demo/matterPartyDisplay.ts', 'lib/demo/demoIntakeFlow.ts'],
    storePath: 'lib/demo/store.tsx',
    notes: 'Parties embedded on matter; `DemoClient` is separate. Narrative: `systemContract.domains.partiesAndContacts`.',
  },

  documentsAndUploads: {
    typesPath: 'lib/demo/types.ts',
    storePath: 'lib/demo/store.tsx',
    helperPaths: [
      'lib/demo/demoDocument.ts',
      'lib/demo/documentPreviewPresentation.ts',
      'lib/demo/engagementLetterPreview.ts',
    ],
    seedPaths: ['lib/demo/demoData.ts'],
    uiAnchorPaths: ['app/demo/documents/page.tsx', 'app/demo/_components/UploadDemoDocumentModal.tsx', 'app/demo/_components/DocumentPreviewModal.tsx'],
    notes: 'Metadata + simulated uploads only. Narrative: `systemContract.domains.documentsAndUploads`.',
  },

  documentRequests: {
    typesPath: 'lib/demo/types.ts',
    storePath: 'lib/demo/store.tsx',
    helperPaths: ['lib/demo/demoDocumentRequest.ts', 'lib/demo/condoDiligence.ts'],
    seedPaths: ['lib/demo/demoData.ts'],
    uiAnchorPaths: ['app/demo/_components/RequestDemoDocumentModal.tsx'],
    notes: 'Condo tab links checklist to requests via `condoDiligence` helpers only. Narrative: `systemContract.domains.documentRequests`.',
  },

  compliance: {
    typesPath: 'lib/demo/types.ts',
    storePath: 'lib/demo/store.tsx',
    helperPaths: ['lib/demo/fincenEligibility.ts', 'lib/demo/condoDiligence.ts'],
    uiAnchorPaths: ['components/demo/DemoFinCENTab.tsx', 'app/demo/fincen-cert/[token]/page.tsx'],
    notes: 'FinCEN: `matter.fincen` vs `fincenCertRequests` — divergence `split-fincen-storage`. Condo: `condoDiligenceByMatterId`.',
  },

  remindersAndChasers: {
    typesPath: 'lib/demo/types.ts',
    storePath: 'lib/demo/store.tsx',
    seedPaths: ['lib/demo/demoData.ts'],
    uiAnchorPaths: ['app/demo/calendar/page.tsx'],
    notes: '`DemoCalendarEvent` covers closings/deadlines; no dedicated chaser queue. Narrative: `systemContract.domains.remindersAndChasers`.',
  },

  timelineAndAudit: {
    typesPath: 'lib/demo/types.ts',
    storePath: 'lib/demo/store.tsx',
    seedPaths: ['lib/demo/demoData.ts'],
    helperPaths: ['context/DemoDataContext.tsx'],
    uiAnchorPaths: ['components/demo/DemoTimelineNotes.tsx', 'app/demo/portal/[token]/page.tsx'],
    notes: 'Matter `timeline` notes vs seed `DEMO_MILESTONE_LOGS` (portal). Facade: `DemoDataContext` → store. Narrative: `systemContract.domains.timelineAndAudit`.',
  },

  portalViews: {
    typesPath: 'lib/demo/types.ts',
    storePath: 'lib/demo/store.tsx',
    seedPaths: ['lib/demo/demoData.ts'],
    uiAnchorPaths: ['app/demo/portal/[token]/page.tsx', 'app/demo/portal/[token]/layout.tsx'],
    notes: 'Resolve matter by `portal_token`; fulfillment via store. Narrative: `systemContract.domains.portalViews`.',
  },

  aiWorkflows: {
    typesPath: 'lib/domain/system-contract.ts',
    notes:
      'No dedicated `Demo*` workflow type. Stages and principles: `systemContract.aiCrossCutting` + per-domain `systemContract.domains.*.ai`. This row links demo files only where stages touch product UI.',
    uiAnchorPaths: ['app/demo/_components/SystemContractMapCard.tsx'],
    helperPaths: ['lib/adapters/ai-from-contract.ts'],
  },
} as const satisfies Record<SystemContractDomainKey, DemoDomainImplementationRef>
