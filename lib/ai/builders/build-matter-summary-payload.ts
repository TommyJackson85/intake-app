/**
 * Stable, inspectable matter summary object for future AI / workflow consumers.
 * Pure function — no store, no UI, no LLM calls. Callers pass a neutral
 * `MatterSummarySource` (map demo/product rows at the boundary via adapters).
 *
 * Schema: bump `schemaVersion` only when making breaking shape changes; keep keys predictable (camelCase).
 */

import type { MatterSummarySource } from '@/lib/ai/matter-summary-source'
import { systemContract } from '@/lib/domain/system-contract'

export const MATTER_SUMMARY_PAYLOAD_SCHEMA_VERSION = '1.0.0' as const

export type BuildMatterSummaryPayloadInput = {
  source: MatterSummarySource
  /** Override clock for tests; defaults to `new Date().toISOString()`. */
  generatedAtIso?: string
}

export type MatterSummaryIdentity = {
  matterId: string
  fileId: string
  matterType: string
  hasPortalToken: boolean
}

export type MatterSummaryProperty = {
  address: string
  county: string
  propertyType: string
}

export type MatterSummaryTransaction = {
  transactionType: string
  purchasePrice: number
  financingType: string
  hoaFlag: boolean
  keyDates: {
    effectiveDate: string
    inspectionDeadline: string
    loanApprovalDeadline: string
    closingDate: string
  }
}

export type MatterSummaryStatus = {
  /** Stored pipeline label on the matter. */
  matterStatusStored: string
  /** Derived from task checklist + closing date (adapter-owned). */
  matterStatusDerivedFromTasks: string
}

export type MatterSummaryPartyCore = {
  name: string
  partyType: string
}

export type MatterSummaryParties = {
  buyer: MatterSummaryPartyCore
  seller: MatterSummaryPartyCore
  /** Same rows as lawyer-facing party strip; stable labels for summarization. */
  displayRows: Array<{ label: string; value: string }>
}

export type MatterSummaryTasks = {
  counts: {
    notStarted: number
    inProgress: number
    completed: number
  }
  /** Non-deleted tasks, titles + status, capped for payload size. */
  items: Array<{ title: string; status: string }>
}

export type MatterSummaryDocuments = {
  matterDocumentCount: number
  byReviewStatus: {
    draft: number
    reviewed: number
    final: number
  }
  documentRequestsOpen: number
  documentRequestsFulfilled: number
}

export type MatterSummaryCompliance = {
  fincen: {
    eligible: boolean
    reportStatus?: string
    completedFields?: number
    beneficialOwnerCount?: number
    certRequestPendingClient?: boolean
  }
  condoDiligence: {
    eligible: boolean
    rowPresent: boolean
    applicable?: boolean
    status?: string
    requiredDocumentsTotal?: number
    requiredDocumentsOutstanding?: number
    requiredDocumentsRequested?: number
    requiredDocumentsReceived?: number
    findingsCount?: number
  }
}

export type MatterSummaryTimeline = {
  activeEventCount: number
  /** Most recent first; text capped per entry. */
  recentNotes: Array<{ at: string; note: string }>
}

export type MatterSummaryPayload = {
  schemaVersion: typeof MATTER_SUMMARY_PAYLOAD_SCHEMA_VERSION
  payloadKind: 'matter_summary'
  generatedAtIso: string
  /** Traceability to documentation contract (version string only). */
  systemContractVersion: string
  identity: MatterSummaryIdentity
  property: MatterSummaryProperty
  transaction: MatterSummaryTransaction
  status: MatterSummaryStatus
  parties: MatterSummaryParties
  tasks: MatterSummaryTasks
  documents: MatterSummaryDocuments
  compliance: MatterSummaryCompliance
  timeline: MatterSummaryTimeline
}

const MAX_TASK_ITEMS = 40
const MAX_TIMELINE_NOTES = 10
const MAX_NOTE_CHARS = 400

function capText(s: string, max: number): string {
  const t = s.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}

function matterDocuments(matterId: string, documents: MatterSummarySource['documents']) {
  return documents.filter((d) => d.matterId === matterId && !d.deletedAt)
}

function matterDocumentRequests(matterId: string, rows: MatterSummarySource['documentRequests']) {
  return rows.filter((r) => r.matterId === matterId)
}

function buildTimeline(events: MatterSummarySource['timeline']): MatterSummaryTimeline {
  const active = events.filter((e) => !e.deletedAt)
  const sorted = [...active].sort((a, b) => a.at.localeCompare(b.at))
  const tail = sorted.slice(-MAX_TIMELINE_NOTES).reverse()
  return {
    activeEventCount: active.length,
    recentNotes: tail.map((e) => ({
      at: e.at,
      note: capText(e.note, MAX_NOTE_CHARS),
    })),
  }
}

/**
 * Assemble a normalized matter summary for downstream prompts or tools.
 */
export function buildMatterSummaryPayload(input: BuildMatterSummaryPayloadInput): MatterSummaryPayload {
  const { source } = input
  const generatedAtIso = input.generatedAtIso ?? new Date().toISOString()

  const docs = matterDocuments(source.identity.matterId, source.documents)
  const reqs = matterDocumentRequests(source.identity.matterId, source.documentRequests)

  const byReview = { draft: 0, reviewed: 0, final: 0 }
  for (const d of docs) {
    if (d.status === 'draft') byReview.draft += 1
    else if (d.status === 'reviewed') byReview.reviewed += 1
    else byReview.final += 1
  }

  const tasksActive = source.tasks.filter((t) => !t.deletedAt)
  const counts = {
    notStarted: tasksActive.filter((t) => t.status === 'not_started').length,
    inProgress: tasksActive.filter((t) => t.status === 'in_progress').length,
    completed: tasksActive.filter((t) => t.status === 'completed').length,
  }

  const fincen = source.compliance.fincen
  const condo = source.compliance.condoDiligence

  return {
    schemaVersion: MATTER_SUMMARY_PAYLOAD_SCHEMA_VERSION,
    payloadKind: 'matter_summary',
    generatedAtIso,
    systemContractVersion: systemContract.meta.version,
    identity: { ...source.identity },
    property: { ...source.property },
    transaction: {
      ...source.transaction,
      keyDates: { ...source.transaction.keyDates },
    },
    status: {
      matterStatusStored: source.matterStatusStored,
      matterStatusDerivedFromTasks: source.matterStatusDerivedFromTasks,
    },
    parties: {
      buyer: { ...source.parties.buyer },
      seller: { ...source.parties.seller },
      displayRows: source.parties.displayRows.map((r) => ({ ...r })),
    },
    tasks: {
      counts,
      items: tasksActive.slice(0, MAX_TASK_ITEMS).map((t) => ({ title: t.title, status: t.status })),
    },
    documents: {
      matterDocumentCount: docs.length,
      byReviewStatus: byReview,
      documentRequestsOpen: reqs.filter((r) => r.status === 'open').length,
      documentRequestsFulfilled: reqs.filter((r) => r.status === 'fulfilled').length,
    },
    compliance: {
      fincen: {
        eligible: fincen.eligible,
        reportStatus: fincen.reportStatus,
        completedFields: fincen.completedFields,
        beneficialOwnerCount: fincen.beneficialOwnerCount,
        certRequestPendingClient: fincen.certRequestPendingClient,
      },
      condoDiligence: { ...condo },
    },
    timeline: buildTimeline(source.timeline),
  }
}
