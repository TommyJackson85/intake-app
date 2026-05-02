/**
 * Stable, inspectable matter summary object for future AI / workflow consumers.
 * Pure function — no store, no UI, no LLM calls. Callers pass demo domain rows explicitly.
 *
 * Schema: bump `schemaVersion` only when making breaking shape changes; keep keys predictable (camelCase).
 */

import type {
  DemoCondoDiligence,
  DemoDocument,
  DemoDocumentRequest,
  DemoMatter,
  DemoTaskStatus,
  FinCENReportStatus,
} from '@/lib/demo/types'
import { isCondoDiligenceEligible } from '@/lib/demo/condoDiligence'
import { isFincenEligibleMatter } from '@/lib/demo/fincenEligibility'
import { getMatterPartyDisplayRows } from '@/lib/demo/matterPartyDisplay'
import { deriveMatterStatus } from '@/lib/demo-utils'
import { systemContract } from '@/lib/domain/system-contract'

export const MATTER_SUMMARY_PAYLOAD_SCHEMA_VERSION = '1.0.0' as const

export type BuildMatterSummaryPayloadInput = {
  matter: DemoMatter
  documents: DemoDocument[]
  documentRequests: DemoDocumentRequest[]
  /** Store `getCondoDiligence(matter.id)` when available; omit if none. */
  condoDiligence?: DemoCondoDiligence | null
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
  matterStatusStored: DemoMatter['status']
  /** Derived from task checklist + closing date (see `deriveMatterStatus`). */
  matterStatusDerivedFromTasks: ReturnType<typeof deriveMatterStatus>
}

export type MatterSummaryPartyCore = {
  name: string
  partyType: DemoMatter['buyer']['type']
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
  items: Array<{ title: string; status: DemoTaskStatus }>
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
    reportStatus?: FinCENReportStatus
    completedFields?: number
    beneficialOwnerCount?: number
    certRequestPendingClient?: boolean
  }
  condoDiligence: {
    eligible: boolean
    rowPresent: boolean
    applicable?: boolean
    status?: DemoCondoDiligence['status']
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

function matterDocuments(matterId: string, documents: DemoDocument[]): DemoDocument[] {
  return documents.filter((d) => d.matter_id === matterId && !d.deletedAt)
}

function matterDocumentRequests(matterId: string, rows: DemoDocumentRequest[]): DemoDocumentRequest[] {
  return rows.filter((r) => r.matter_id === matterId)
}

function buildTimeline(events: DemoMatter['timeline']): MatterSummaryTimeline {
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
  const { matter, documents, documentRequests, condoDiligence = null } = input
  const generatedAtIso = input.generatedAtIso ?? new Date().toISOString()

  const docs = matterDocuments(matter.id, documents)
  const reqs = matterDocumentRequests(matter.id, documentRequests)

  const byReview = { draft: 0, reviewed: 0, final: 0 }
  for (const d of docs) {
    if (d.status === 'draft') byReview.draft += 1
    else if (d.status === 'reviewed') byReview.reviewed += 1
    else byReview.final += 1
  }

  const tasksActive = matter.tasks.filter((t) => !t.deletedAt)
  const counts = {
    notStarted: tasksActive.filter((t) => t.status === 'not_started').length,
    inProgress: tasksActive.filter((t) => t.status === 'in_progress').length,
    completed: tasksActive.filter((t) => t.status === 'completed').length,
  }

  const condoEligible = isCondoDiligenceEligible(matter)
  const fincenEligible = isFincenEligibleMatter(matter)
  const fincen = matter.fincen

  let condoRequired: MatterSummaryCompliance['condoDiligence'] = {
    eligible: condoEligible,
    rowPresent: condoDiligence != null,
  }

  if (condoDiligence) {
    const rd = condoDiligence.requiredDocuments
    condoRequired = {
      ...condoRequired,
      applicable: condoDiligence.applicable,
      status: condoDiligence.status,
      requiredDocumentsTotal: rd.length,
      requiredDocumentsOutstanding: rd.filter((x) => x.status === 'outstanding').length,
      requiredDocumentsRequested: rd.filter((x) => x.status === 'requested').length,
      requiredDocumentsReceived: rd.filter((x) => x.status === 'received').length,
      findingsCount: condoDiligence.findings.length,
    }
  }

  return {
    schemaVersion: MATTER_SUMMARY_PAYLOAD_SCHEMA_VERSION,
    payloadKind: 'matter_summary',
    generatedAtIso,
    systemContractVersion: systemContract.meta.version,
    identity: {
      matterId: matter.id,
      fileId: matter.file_id,
      matterType: matter.matter_type,
      hasPortalToken: Boolean(matter.portal_token?.trim()),
    },
    property: {
      address: matter.property.address,
      county: matter.property.county,
      propertyType: matter.property.property_type,
    },
    transaction: {
      transactionType: matter.transactionType,
      purchasePrice: matter.purchasePrice,
      financingType: matter.financingType,
      hoaFlag: matter.hoaFlag,
      keyDates: {
        effectiveDate: matter.key_dates.effective_date,
        inspectionDeadline: matter.key_dates.inspection_deadline,
        loanApprovalDeadline: matter.key_dates.loan_approval_deadline,
        closingDate: matter.key_dates.closing_date,
      },
    },
    status: {
      matterStatusStored: matter.status,
      matterStatusDerivedFromTasks: deriveMatterStatus(matter.tasks, matter.key_dates.closing_date),
    },
    parties: {
      buyer: { name: matter.buyer.name, partyType: matter.buyer.type },
      seller: { name: matter.seller.name, partyType: matter.seller.type },
      displayRows: getMatterPartyDisplayRows(matter),
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
        eligible: fincenEligible,
        reportStatus: fincen?.reportStatus,
        completedFields: fincen?.completedFields,
        beneficialOwnerCount: fincen?.beneficialOwners?.length,
        certRequestPendingClient: fincen?.certRequest?.status === 'pending_client',
      },
      condoDiligence: condoRequired,
    },
    timeline: buildTimeline(matter.timeline),
  }
}
