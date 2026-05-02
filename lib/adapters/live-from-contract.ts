/**
 * Live environment adapter — **placeholder / metadata only**.
 *
 * - Stricter than demo: auth, firm scoping, server validation, RLS (see `systemContract.domains.*.live`).
 * - Does **not** import `lib/database.types.ts` or Supabase clients — avoids coupling and codegen churn here.
 * - Table and route names are **hints** for humans and future real adapters; authoritative schema remains Supabase + API code.
 *
 * Narrative and boundaries: always prefer `lib/domain/system-contract.ts`.
 */

import type { SystemContractDomainKey } from '@/lib/domain/system-contract'

export type LiveDomainPlaceholderRef = {
  /** Informative table names (string hints only). */
  tableHints?: string[]
  /** App router or API areas (string hints only). */
  routeHints?: string[]
  /** Future: server-only mutations, RLS, audit requirements. */
  notes: string
}

/**
 * Per-domain pointers toward the live stack. Expand as real mapping work proceeds.
 */
export const liveImplementationPlaceholderByDomain = {
  firmContext: {
    tableHints: ['firms'],
    routeHints: ['app/api/auth/*', 'app/dashboard/*'],
    notes: 'Tenant boundary; demo firm flags on `firms` — see live auth flows.',
  },
  usersAndRoles: {
    tableHints: ['profiles', 'sessions'],
    routeHints: ['app/api/auth/*'],
    notes: 'Roles and `firm_id` from Supabase auth + profiles.',
  },
  intakes: {
    tableHints: ['leads'],
    routeHints: ['app/api/dashboard/intakes/*', 'app/api/intake/[token]/route.ts'],
    notes: 'Firm-scoped leads; shapes differ from `DemoIntakeLead`.',
  },
  matters: {
    tableHints: ['matters'],
    routeHints: ['app/api/dashboard/matters/*', 'app/api/external/matters/route.ts'],
    notes: 'Live row is narrower than `DemoMatter`; many demo fields are UI-only until migrated.',
  },
  partiesAndContacts: {
    tableHints: ['clients'],
    routeHints: ['app/api/dashboard/*', 'app/api/clients/route.ts'],
    notes: 'CRM client vs matter party — see divergence `split-client-models` in `systemContract`.',
  },
  documentsAndUploads: {
    routeHints: ['app/dashboard/documents/*', 'app/api/external/export/*'],
    notes: 'Document storage model may differ; align when schema stabilizes.',
  },
  documentRequests: {
    routeHints: ['app/api/portal/home/route.ts', 'app/api/dashboard/matters/*/client-preview-data/*'],
    notes: 'Map to live request/fulfillment when parity exists.',
  },
  compliance: {
    tableHints: ['aml_checks'],
    routeHints: ['app/dashboard/aml/*', 'app/api/external/aml/checks/route.ts'],
    notes: 'FinCEN parity partial; AML checks table exists — see contract compliance domain.',
  },
  remindersAndChasers: {
    routeHints: ['app/dashboard/calendar/*'],
    notes: 'Jobs/notifications not modeled in demo; future server queues.',
  },
  timelineAndAudit: {
    tableHints: ['audit_logs'],
    routeHints: ['app/api/gdpr/*', 'app/api/external/export/audit-events/route.ts'],
    notes: 'Server-written audit; differs from demo matter `timeline` notes.',
  },
  portalViews: {
    routeHints: ['app/api/portal/home/route.ts', 'app/portal/*'],
    notes: 'Production portal auth differs from demo `portal_token` UX.',
  },
  aiWorkflows: {
    notes: 'No live AI runtime here. Future: server-enqueued jobs / webhooks; boundaries from `systemContract` + `ai-from-contract.ts`.',
  },
} as const satisfies Record<SystemContractDomainKey, LiveDomainPlaceholderRef>
