import type {
  DemoClient,
  DemoConflictCheckReview,
  DemoConflictCheckReviewStatus,
  DemoConflictCheckStatus,
  DemoDocument,
  DemoGeneratedInternalSummaryMetadata,
  DemoIntakeLead,
  DemoMatter,
} from '@/lib/demo/types'
import { effectiveIntakeSnapshot } from '@/lib/demo/demoIntakeFlow'
import { parseOtherPartyInfo } from '@/lib/demo/matterPartyDisplay'
import type { AddDemoDocumentInput } from '@/lib/demo/demoDocument'

export const CONFLICT_CHECK_REVIEW_MEMO_SUBTYPE = 'conflict_check_review_memo'

export type ConflictScreenHitKind = 'person' | 'property' | 'other_party'

export type ConflictScreenHit = {
  kind: ConflictScreenHitKind
  label: string
  detail: string
  matchedAgainst: string
  sourceId?: string
  sourceType?: 'client' | 'matter' | 'intake'
}

export type ConflictScreeningResult = {
  status: Extract<DemoConflictCheckStatus, 'clear' | 'flagged'>
  hits: ConflictScreenHit[]
  summary: string
  screenedAt: string
}

export type ConflictCheckReviewDraft = {
  status: DemoConflictCheckReviewStatus
  informationGaps: string
  internalNote: string
}

export type ConflictCheckReviewStatusPresentation = {
  label: string
  bg: string
  color: string
  border: string
}

const EMPTY_REVIEW: DemoConflictCheckReview = {
  status: 'not_started',
  informationGaps: '',
  internalNote: '',
  reviewerId: null,
  reviewerName: null,
  reviewedAt: null,
  linkedMemoDocumentId: null,
  screeningSummary: null,
}

export function normalizeConflictCheckReview(
  review: DemoConflictCheckReview | null | undefined
): DemoConflictCheckReview {
  if (!review) return { ...EMPTY_REVIEW }
  return {
    status: review.status || 'not_started',
    informationGaps: review.informationGaps || '',
    internalNote: review.internalNote || '',
    reviewerId: review.reviewerId ?? null,
    reviewerName: review.reviewerName ?? null,
    reviewedAt: review.reviewedAt ?? null,
    linkedMemoDocumentId: review.linkedMemoDocumentId ?? null,
    screeningSummary: review.screeningSummary ?? null,
  }
}

export function conflictCheckReviewStatusLabel(status: DemoConflictCheckReviewStatus): string {
  switch (status) {
    case 'not_started':
      return 'Not started'
    case 'in_progress':
      return 'In progress'
    case 'completed':
      return 'Completed'
    case 'needs_more_info':
      return 'Needs more info'
    default:
      return status
  }
}

export function conflictCheckGateStatusLabel(status: DemoConflictCheckStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending'
    case 'clear':
      return 'Clear'
    case 'flagged':
      return 'Flagged'
    case 'confirmed_no_conflict':
      return 'Confirmed no conflict'
    default:
      return status
  }
}

export function conflictCheckReviewStatusPresentation(
  status: DemoConflictCheckReviewStatus
): ConflictCheckReviewStatusPresentation {
  switch (status) {
    case 'completed':
      return {
        label: conflictCheckReviewStatusLabel(status),
        bg: '#e8f5f0',
        color: '#2f855a',
        border: 'rgba(47,133,90,0.35)',
      }
    case 'needs_more_info':
      return {
        label: conflictCheckReviewStatusLabel(status),
        bg: '#fff8e6',
        color: '#b45309',
        border: 'rgba(180,83,9,0.35)',
      }
    case 'in_progress':
      return {
        label: conflictCheckReviewStatusLabel(status),
        bg: '#e8f4f8',
        color: '#208096',
        border: 'rgba(32,128,150,0.35)',
      }
    case 'not_started':
    default:
      return {
        label: conflictCheckReviewStatusLabel(status),
        bg: '#f5f5f5',
        color: '#627c71',
        border: 'rgba(94,82,64,0.2)',
      }
  }
}

function normalizeToken(value: string | null | undefined): string {
  return (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function significantTokens(value: string | null | undefined): string[] {
  return normalizeToken(value)
    .split(' ')
    .filter((token) => token.length >= 3)
}

function personNameMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = significantTokens(a)
  const right = significantTokens(b)
  if (left.length === 0 || right.length === 0) return false
  if (normalizeToken(a) === normalizeToken(b)) return true
  const shared = left.filter((token) => right.includes(token))
  return shared.length >= 2 || (shared.length === 1 && (left.length === 1 || right.length === 1))
}

function propertyMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizeToken(a)
  const right = normalizeToken(b)
  if (!left || !right) return false
  if (left === right) return true
  if (left.includes(right) || right.includes(left)) return true
  const leftTokens = significantTokens(left)
  const rightTokens = significantTokens(right)
  const shared = leftTokens.filter((token) => rightTokens.includes(token))
  return shared.length >= 3
}

export function intakeDisplayName(lead: DemoIntakeLead): string {
  const snapshot = effectiveIntakeSnapshot(lead)
  return (snapshot.clientName || '').trim() || 'Unnamed lead'
}

export function intakePropertyAddress(lead: DemoIntakeLead): string {
  const snapshot = effectiveIntakeSnapshot(lead)
  return (snapshot.propertyAddress || '').trim()
}

function dedupeHits(hits: ConflictScreenHit[]): ConflictScreenHit[] {
  return hits.filter(
    (hit, index, all) =>
      all.findIndex(
        (candidate) =>
          candidate.kind === hit.kind &&
          candidate.detail === hit.detail &&
          candidate.matchedAgainst === hit.matchedAgainst &&
          candidate.sourceId === hit.sourceId
      ) === index
  )
}

/**
 * Demo heuristic screening across clients, matters, and other intakes.
 * Operational indicator only — not a legal conflict determination.
 */
export function runConflictCheckScreening(input: {
  lead: DemoIntakeLead
  matters: DemoMatter[]
  clients: DemoClient[]
  intakeLeads?: DemoIntakeLead[]
  nowIso?: string
}): ConflictScreeningResult {
  const { lead, matters, clients } = input
  const intakeLeads = input.intakeLeads || []
  const screenedAt = input.nowIso || new Date().toISOString()
  const subjectName = intakeDisplayName(lead)
  const subjectProperty = intakePropertyAddress(lead)
  const hits: ConflictScreenHit[] = []

  for (const client of clients) {
    if (client.deletedAt) continue
    if (lead.linkedClientId && client.id === lead.linkedClientId) continue
    if (!personNameMatch(subjectName, client.full_name)) continue
    hits.push({
      kind: 'person',
      label: 'Person match',
      detail: `Lead name matches existing client ${client.full_name}`,
      matchedAgainst: client.full_name,
      sourceId: client.id,
      sourceType: 'client',
    })
  }

  for (const matter of matters) {
    if (matter.deletedAt) continue
    if (lead.linkedMatterFileId && matter.file_id === lead.linkedMatterFileId) continue

    const matterLabel = matter.file_id || matter.id
    const buyerName = matter.buyer?.name?.trim() || ''
    const sellerName = matter.seller?.name?.trim() || ''
    const otherPartyName = parseOtherPartyInfo(matter.specialNotes || '').name.trim()
    const matterProperty = (matter.property?.address || '').trim()

    if (personNameMatch(subjectName, buyerName)) {
      hits.push({
        kind: 'person',
        label: 'Person match',
        detail: `Lead name matches buyer on ${matterLabel}`,
        matchedAgainst: buyerName,
        sourceId: matter.id,
        sourceType: 'matter',
      })
    }

    if (personNameMatch(subjectName, sellerName)) {
      hits.push({
        kind: 'person',
        label: 'Person match',
        detail: `Lead name matches seller on ${matterLabel}`,
        matchedAgainst: sellerName,
        sourceId: matter.id,
        sourceType: 'matter',
      })
    }

    if (otherPartyName && personNameMatch(subjectName, otherPartyName)) {
      hits.push({
        kind: 'other_party',
        label: 'Other-party overlap',
        detail: `Lead name matches other party on ${matterLabel}`,
        matchedAgainst: otherPartyName,
        sourceId: matter.id,
        sourceType: 'matter',
      })
    }

    if (propertyMatch(subjectProperty, matterProperty)) {
      hits.push({
        kind: 'property',
        label: 'Property match',
        detail: `Property address overlaps ${matterLabel}`,
        matchedAgainst: matterProperty,
        sourceId: matter.id,
        sourceType: 'matter',
      })
    }
  }

  for (const other of intakeLeads) {
    if (other.id === lead.id) continue
    const otherName = intakeDisplayName(other)
    const otherProperty = intakePropertyAddress(other)

    if (personNameMatch(subjectName, otherName)) {
      hits.push({
        kind: 'person',
        label: 'Person match',
        detail: `Lead name matches other intake ${other.fileReference || other.id}`,
        matchedAgainst: otherName,
        sourceId: other.id,
        sourceType: 'intake',
      })
    }

    if (propertyMatch(subjectProperty, otherProperty)) {
      hits.push({
        kind: 'property',
        label: 'Property match',
        detail: `Property address overlaps other intake ${other.fileReference || other.id}`,
        matchedAgainst: otherProperty,
        sourceId: other.id,
        sourceType: 'intake',
      })
    }
  }

  const uniqueHits = dedupeHits(hits)

  if (uniqueHits.length === 0) {
    return {
      status: 'clear',
      hits: [],
      summary: `No obvious person/property overlaps found for ${subjectName}.`,
      screenedAt,
    }
  }

  return {
    status: 'flagged',
    hits: uniqueHits,
    summary: `Possible conflict indicators for ${subjectName}: ${uniqueHits
      .map((hit) => hit.detail)
      .join('; ')}`,
    screenedAt,
  }
}

export function createConflictCheckGatePatch(input: {
  status: DemoConflictCheckStatus
  note?: string | null
  screening?: ConflictScreeningResult | null
  existingReview?: DemoConflictCheckReview | null
  nowIso?: string
}): Partial<
  Pick<
    DemoIntakeLead,
    | 'conflict_check_status'
    | 'conflict_check_completed_at'
    | 'conflict_check_note'
    | 'conflictCheckReview'
  >
> {
  const nowIso = input.nowIso || input.screening?.screenedAt || new Date().toISOString()
  const review = normalizeConflictCheckReview(input.existingReview)
  const screeningSummary = input.screening?.summary || review.screeningSummary
  const note =
    input.note !== undefined && input.note !== null
      ? input.note
      : input.screening?.summary || null

  return {
    conflict_check_status: input.status,
    conflict_check_completed_at: nowIso,
    conflict_check_note: note,
    conflictCheckReview: {
      ...review,
      status: review.status === 'not_started' ? 'in_progress' : review.status,
      screeningSummary: screeningSummary || null,
    },
  }
}

export function createConflictCheckReviewPatch(input: {
  draft: ConflictCheckReviewDraft
  actor: { staffId: string; staffName: string }
  existing?: DemoConflictCheckReview | null
  screeningSummary?: string | null
  linkedMemoDocumentId?: string | null
  nowIso?: string
}): DemoConflictCheckReview {
  const existing = normalizeConflictCheckReview(input.existing)
  const nowIso = input.nowIso || new Date().toISOString()
  return {
    ...existing,
    status: input.draft.status,
    informationGaps: input.draft.informationGaps.trim(),
    internalNote: input.draft.internalNote.trim(),
    reviewerId: input.actor.staffId,
    reviewerName: input.actor.staffName,
    reviewedAt: nowIso,
    screeningSummary:
      input.screeningSummary !== undefined ? input.screeningSummary : existing.screeningSummary,
    linkedMemoDocumentId:
      input.linkedMemoDocumentId !== undefined
        ? input.linkedMemoDocumentId
        : existing.linkedMemoDocumentId,
  }
}

export function canCompleteConflictCheckReview(draft: ConflictCheckReviewDraft): {
  ok: boolean
  reason?: string
} {
  if (draft.status !== 'completed') return { ok: true }
  if (!draft.internalNote.trim()) {
    return {
      ok: false,
      reason: 'Add an internal note before marking the conflict check review completed.',
    }
  }
  return { ok: true }
}

export function findIntakeLeadForMatter(
  intakeLeads: DemoIntakeLead[],
  matter: Pick<DemoMatter, 'file_id'>
): DemoIntakeLead | null {
  const fileId = matter.file_id?.trim()
  if (!fileId) return null
  return intakeLeads.find((lead) => lead.linkedMatterFileId === fileId) || null
}

export function buildConflictCheckReviewMemoContent(input: {
  lead: DemoIntakeLead
  matter?: DemoMatter | null
  client?: DemoClient | null
  review?: DemoConflictCheckReview | null
  screening?: ConflictScreeningResult | null
  generatedAt?: string
}): string {
  const review = normalizeConflictCheckReview(input.review || input.lead.conflictCheckReview)
  const generatedAt = input.generatedAt || new Date().toISOString()
  const subjectName = intakeDisplayName(input.lead)
  const property = intakePropertyAddress(input.lead)
  const matterRef = input.matter?.file_id || input.lead.fileReference || '—'
  const snapshot = effectiveIntakeSnapshot(input.lead)
  const screeningSummary =
    input.screening?.summary ||
    review.screeningSummary ||
    input.lead.conflict_check_note ||
    'No screening summary recorded.'
  const hits = input.screening?.hits || []

  const lines = [
    'INTERNAL CONFLICT CHECK REVIEW MEMO',
    '===================================',
    '',
    'Operational internal record only. This is not a legal opinion, ethical clearance, or conflict waiver.',
    '',
    `Generated: ${generatedAt}`,
    `Matter: ${matterRef}`,
    `Lead / client: ${subjectName}`,
    `Linked client record: ${input.client?.full_name || '—'}`,
    `Property: ${property || '—'}`,
    `Side / matter type: ${snapshot.transactionRole || '—'} / ${snapshot.matterType || '—'}`,
    '',
    'GATE STATUS',
    '-----------',
    `Conflict gate: ${conflictCheckGateStatusLabel(input.lead.conflict_check_status || 'pending')}`,
    `Gate completed at: ${input.lead.conflict_check_completed_at || '—'}`,
    `Gate note: ${input.lead.conflict_check_note || '—'}`,
    '',
    'LAWYER REVIEW RECORD',
    '--------------------',
    `Review status: ${conflictCheckReviewStatusLabel(review.status)}`,
    `Reviewed by: ${review.reviewerName || '—'}`,
    `Reviewed at: ${review.reviewedAt || '—'}`,
    `Information gaps: ${review.informationGaps || 'None recorded.'}`,
    `Internal note: ${review.internalNote || 'None recorded.'}`,
    '',
    'SCREENING SUMMARY',
    '-----------------',
    screeningSummary,
  ]

  if (hits.length > 0) {
    lines.push('', 'SCREENING HITS', '--------------')
    for (const hit of hits) {
      lines.push(`- [${hit.kind}] ${hit.detail} (matched: ${hit.matchedAgainst})`)
    }
  }

  lines.push(
    '',
    'DISCLAIMER',
    '----------',
    'This memo is an internal operational artifact for demo workflow tracking. It does not constitute legal advice, an ethics opinion, or formal conflict clearance.'
  )

  return lines.join('\n')
}

export function isConflictCheckReviewMemoDocument(
  document: Pick<DemoDocument, 'document_subtype' | 'generatedInternalSummary' | 'name' | 'deletedAt'>
): boolean {
  if (document.deletedAt) return false
  if (document.generatedInternalSummary?.generatedType === 'conflict_check_review_memo') return true
  const subtype = (document.document_subtype ?? '').toLowerCase()
  if (
    subtype.includes('conflict check review memo') ||
    subtype === CONFLICT_CHECK_REVIEW_MEMO_SUBTYPE
  ) {
    return true
  }
  const name = document.name.toLowerCase()
  return (
    name.includes('internal conflict check review memo') ||
    name.includes('conflict check review memo')
  )
}

export function conflictCheckReviewMemoSortTime(
  document: Pick<DemoDocument, 'uploaded_at' | 'generatedInternalSummary'>
): number {
  const iso = document.generatedInternalSummary?.generatedAt?.trim() || document.uploaded_at
  const t = new Date(iso).getTime()
  return Number.isFinite(t) ? t : 0
}

export function listConflictCheckReviewMemoDocuments<
  T extends Pick<
    DemoDocument,
    | 'id'
    | 'name'
    | 'deletedAt'
    | 'uploaded_at'
    | 'document_subtype'
    | 'generatedInternalSummary'
    | 'matter_id'
  >,
>(documents: readonly T[], matterId?: string): T[] {
  return documents
    .filter(
      (doc) =>
        !doc.deletedAt &&
        isConflictCheckReviewMemoDocument(doc) &&
        (!matterId || doc.matter_id === matterId)
    )
    .slice()
    .sort((a, b) => conflictCheckReviewMemoSortTime(b) - conflictCheckReviewMemoSortTime(a))
}

export function createConflictCheckReviewMemoDocumentInput(input: {
  matter: DemoMatter
  lead: DemoIntakeLead
  uploadedByStaffId: string
  client?: DemoClient | null
  review?: DemoConflictCheckReview | null
  screening?: ConflictScreeningResult | null
  content?: string
  generatedAt?: string
  id?: string
}): AddDemoDocumentInput | null {
  const matter_id = input.matter.id.trim()
  const uploaded_by_staff_id = input.uploadedByStaffId.trim()
  if (!matter_id || !uploaded_by_staff_id) return null

  const generatedAt = input.generatedAt || new Date().toISOString()
  const matterRef = input.matter.file_id || input.matter.id
  const content =
    input.content?.trim() ||
    buildConflictCheckReviewMemoContent({
      lead: input.lead,
      matter: input.matter,
      client: input.client,
      review: input.review,
      screening: input.screening,
      generatedAt,
    }).trim()
  if (!content) return null

  const metadata: DemoGeneratedInternalSummaryMetadata = {
    generatedType: 'conflict_check_review_memo',
    generatedAt,
    sourceMatterId: matter_id,
    content,
    visibility: 'internal',
  }

  return {
    matter_id,
    name: `Internal Conflict Check Review Memo — ${matterRef}`,
    category: 'Compliance',
    document_subtype: CONFLICT_CHECK_REVIEW_MEMO_SUBTYPE,
    description:
      'Internal conflict check review memo snapshot — not shared to the client portal. Operational work product only. Not a legal opinion, ethical clearance, or conflict waiver.',
    document_date: generatedAt.slice(0, 10),
    source: 'Conflict Check Review (demo) — internal memo',
    status: 'draft',
    uploaded_by_staff_id,
    uploaded_at: generatedAt,
    ...(input.id ? { id: input.id } : {}),
    generatedInternalSummary: metadata,
  }
}

export function conflictCheckReviewMemoRequiresLinkedMatter(lead: DemoIntakeLead): boolean {
  return !lead.linkedMatterFileId
}
