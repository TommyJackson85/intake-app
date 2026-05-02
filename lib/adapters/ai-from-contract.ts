/**
 * AI environment adapter — **placeholder / policy hints only**.
 *
 * - Does **not** call LLM or tool providers. Declarative metadata for future integrations.
 * - Authoritative readable/writable lists: `systemContract.domains[domain].ai` and `systemContract.aiCrossCutting`.
 * - This file may summarize cross-cutting rules without duplicating every bullet.
 */

import type { SystemContractDomainKey } from '@/lib/domain/system-contract'

export type AiDomainPlaceholderRef = {
  /** Contract domain keys an agent may reason about together (hint only). */
  readableDomains?: SystemContractDomainKey[]
  /** Domains where any automated persistence might be allowed after explicit product whitelisting (usually empty). */
  writableDomains?: SystemContractDomainKey[]
  /** Default posture for demo/live until product defines automation. */
  approvalRequired: boolean
  notes: string
}

/**
 * Per-domain AI posture placeholders. Refine when integrations ship.
 */
export const aiImplementationPlaceholderByDomain = {
  firmContext: {
    approvalRequired: true,
    notes: 'No agent writes to firm master; see `systemContract.domains.firmContext.ai`.',
  },
  usersAndRoles: {
    approvalRequired: true,
    notes: 'No user/role creation by agents; see `systemContract.domains.usersAndRoles.ai`.',
  },
  intakes: {
    readableDomains: ['intakes', 'partiesAndContacts', 'matters'],
    approvalRequired: true,
    notes: 'Draft-only assistance unless server gates persistence; see `systemContract.domains.intakes.ai`.',
  },
  matters: {
    readableDomains: ['matters', 'compliance', 'documentsAndUploads', 'documentRequests'],
    approvalRequired: true,
    notes: 'Summaries and suggestions only by default; see `systemContract.domains.matters.ai`.',
  },
  partiesAndContacts: {
    approvalRequired: true,
    notes: 'PII/BOI sensitivity; see `systemContract.domains.partiesAndContacts.ai`.',
  },
  documentsAndUploads: {
    readableDomains: ['documentsAndUploads', 'documentRequests'],
    approvalRequired: true,
    notes: 'Metadata-level read; bytes via explicit pipelines only.',
  },
  documentRequests: {
    readableDomains: ['documentRequests', 'portalViews'],
    approvalRequired: true,
    notes: 'Staff creates requests; see `systemContract.domains.documentRequests.ai`.',
  },
  compliance: {
    readableDomains: ['compliance', 'matters', 'partiesAndContacts'],
    approvalRequired: true,
    notes: 'No autonomous regulatory filing; see `systemContract.domains.compliance.ai`.',
  },
  remindersAndChasers: {
    readableDomains: ['remindersAndChasers', 'matters'],
    approvalRequired: true,
    notes: 'Draft reminder copy only until send pipeline exists.',
  },
  timelineAndAudit: {
    approvalRequired: true,
    notes: 'No fabricated audit events; see `systemContract.domains.timelineAndAudit.ai`.',
  },
  portalViews: {
    readableDomains: ['portalViews', 'documentRequests'],
    approvalRequired: true,
    notes: 'Client-facing surface; default no agent writes.',
  },
  aiWorkflows: {
    readableDomains: [
      'intakes',
      'matters',
      'documentsAndUploads',
      'documentRequests',
      'compliance',
      'portalViews',
      'timelineAndAudit',
    ],
    approvalRequired: true,
    notes: 'Stage ordering: `systemContract.aiCrossCutting.workflowStages`. Principles: `globalPrinciples`.',
  },
} as const satisfies Record<SystemContractDomainKey, AiDomainPlaceholderRef>
