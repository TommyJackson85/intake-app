/**
 * Post-Closing Undertakings — internal operational record helpers.
 *
 * Records internal post-closing items and follow-up context for a matter.
 * Does not determine whether an obligation is satisfied, whether closing is
 * complete, or whether any legal, title, escrow, recording, payoff, or
 * trust-account requirement has been met.
 */
import type {
  DemoPostClosingUndertaking,
  DemoPostClosingUndertakingResponsibleParty,
  DemoPostClosingUndertakingStatus,
  DemoPostClosingUndertakingsApplicability,
  DemoPostClosingUndertakingsInternalReviewStatus,
  DemoPostClosingUndertakingsReview,
} from '@/lib/demo/types'

export const POST_CLOSING_UNDERTAKINGS_DISCLAIMER =
  'Record internal post-closing items and follow-up context for this matter. This workspace does not determine whether an obligation is satisfied, whether closing is complete, or whether any legal, title, escrow, recording, payoff, or trust-account requirement has been met.'

/** Canonical product alias for the review record. */
export type PostClosingUndertakingsReview = DemoPostClosingUndertakingsReview
/** Canonical product alias for a single undertaking. */
export type PostClosingUndertaking = DemoPostClosingUndertaking

export type PostClosingUndertakingsStatusPresentation = {
  label: string
  bg: string
  color: string
  border: string
}

export type PostClosingUndertakingsReviewDraft = {
  applicability: DemoPostClosingUndertakingsApplicability
  internalReviewStatus: DemoPostClosingUndertakingsInternalReviewStatus
  reviewNote: string
  undertakings: DemoPostClosingUndertaking[]
}

const EMPTY_REVIEW: DemoPostClosingUndertakingsReview = {
  applicability: 'unknown',
  internalReviewStatus: 'not_started',
  reviewNote: '',
  reviewedById: null,
  reviewedByName: null,
  reviewedAt: null,
  undertakings: [],
}

export function buildDefaultPostClosingUndertakingsReview(): DemoPostClosingUndertakingsReview {
  return { ...EMPTY_REVIEW, undertakings: [] }
}

/** @deprecated Prefer buildDefaultPostClosingUndertakingsReview. */
export function buildDefaultPostClosingUndertakings(): DemoPostClosingUndertakingsReview {
  return buildDefaultPostClosingUndertakingsReview()
}

export function buildDefaultPostClosingUndertaking(input?: {
  id?: string
  title?: string
  nowIso?: string
}): DemoPostClosingUndertaking {
  const nowIso = input?.nowIso || new Date().toISOString()
  return {
    id: input?.id?.trim() || `pcu-${Date.now()}`,
    title: (input?.title || '').trim(),
    responsibleParty: 'unknown',
    status: 'not_recorded',
    targetDate: null,
    details: '',
    followUpNote: '',
    recordedCompletionDate: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  }
}

/** @deprecated Prefer buildDefaultPostClosingUndertaking. */
export function buildDefaultPostClosingUndertakingItem(input?: {
  id?: string
  title?: string
  description?: string
}): DemoPostClosingUndertaking {
  return buildDefaultPostClosingUndertaking({
    id: input?.id,
    title: input?.title || input?.description,
  })
}

export function normalizePostClosingUndertaking(
  item: Partial<DemoPostClosingUndertaking> | null | undefined,
  index = 0
): DemoPostClosingUndertaking {
  return {
    id: (item?.id || '').trim() || `pcu-${index + 1}`,
    title: (item?.title || '').trim(),
    responsibleParty: normalizeResponsibleParty(item?.responsibleParty),
    status: normalizeUndertakingStatus(item?.status),
    targetDate: emptyToNull(item?.targetDate),
    details: (item?.details || '').trim(),
    followUpNote: (item?.followUpNote || '').trim(),
    recordedCompletionDate: emptyToNull(item?.recordedCompletionDate),
    createdAt: emptyToNull(item?.createdAt),
    updatedAt: emptyToNull(item?.updatedAt),
  }
}

export function normalizePostClosingUndertakingsReview(
  record: DemoPostClosingUndertakingsReview | null | undefined
): DemoPostClosingUndertakingsReview {
  if (!record) return buildDefaultPostClosingUndertakingsReview()
  const legacy = record as DemoPostClosingUndertakingsReview & {
    status?: string
    items?: Array<Partial<DemoPostClosingUndertaking> & { description?: string; followUpContext?: string; notes?: string }>
    followUpContext?: string
    internalNote?: string
    recordedByStaffId?: string | null
    recordedByStaffName?: string | null
    recordedAt?: string | null
  }
  const rawUndertakings = Array.isArray(record.undertakings)
    ? record.undertakings
    : Array.isArray(legacy.items)
      ? legacy.items.map((row) => ({
          ...row,
          title: row.title || row.description || '',
          followUpNote: row.followUpNote || row.followUpContext || row.notes || '',
          details: row.details || '',
          status: migrateLegacyUndertakingStatus(row.status),
        }))
      : []
  const undertakings = rawUndertakings.map((row, index) => normalizePostClosingUndertaking(row, index))
  return {
    applicability: normalizeApplicability(record.applicability),
    internalReviewStatus: normalizeInternalReviewStatus(
      record.internalReviewStatus || migrateLegacyReviewStatus(legacy.status)
    ),
    reviewNote: (record.reviewNote || legacy.internalNote || legacy.followUpContext || '').trim(),
    reviewedById: record.reviewedById ?? legacy.recordedByStaffId ?? null,
    reviewedByName: record.reviewedByName ?? legacy.recordedByStaffName ?? null,
    reviewedAt: record.reviewedAt ?? legacy.recordedAt ?? null,
    undertakings,
  }
}

function migrateLegacyReviewStatus(
  value: string | null | undefined
): DemoPostClosingUndertakingsInternalReviewStatus | undefined {
  switch (value) {
    case 'not_started':
      return 'not_started'
    case 'in_progress':
    case 'monitoring':
      return 'in_review'
    case 'internally_noted':
      return 'review_recorded'
    default:
      return undefined
  }
}

function migrateLegacyUndertakingStatus(
  value: string | null | undefined
): DemoPostClosingUndertakingStatus | undefined {
  switch (value) {
    case 'open':
    case 'in_progress':
      return 'outstanding'
    case 'noted':
      return 'received_for_review'
    case 'closed_internally':
      return 'recorded_complete'
    case 'not_recorded':
    case 'outstanding':
    case 'received_for_review':
    case 'follow_up_needed':
    case 'recorded_complete':
      return value
    default:
      return undefined
  }
}

/** @deprecated Prefer normalizePostClosingUndertakingsReview. */
export function normalizePostClosingUndertakings(
  record: DemoPostClosingUndertakingsReview | null | undefined
): DemoPostClosingUndertakingsReview {
  return normalizePostClosingUndertakingsReview(record)
}

function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = (value || '').trim()
  return trimmed || null
}

function normalizeApplicability(
  value: DemoPostClosingUndertakingsApplicability | string | null | undefined
): DemoPostClosingUndertakingsApplicability {
  switch (value) {
    case 'not_applicable':
    case 'applicable':
    case 'lawyer_review_required':
    case 'unknown':
      return value
    default:
      return 'unknown'
  }
}

function normalizeInternalReviewStatus(
  value: DemoPostClosingUndertakingsInternalReviewStatus | string | null | undefined
): DemoPostClosingUndertakingsInternalReviewStatus {
  switch (value) {
    case 'information_needed':
    case 'in_review':
    case 'lawyer_review_required':
    case 'review_recorded':
    case 'not_started':
      return value
    default:
      return 'not_started'
  }
}

function normalizeResponsibleParty(
  value: DemoPostClosingUndertakingResponsibleParty | string | null | undefined
): DemoPostClosingUndertakingResponsibleParty {
  switch (value) {
    case 'client':
    case 'buyer':
    case 'seller':
    case 'lender':
    case 'title_or_settlement_party':
    case 'attorney':
    case 'other':
    case 'unknown':
      return value
    default:
      return 'unknown'
  }
}

function normalizeUndertakingStatus(
  value: DemoPostClosingUndertakingStatus | string | null | undefined
): DemoPostClosingUndertakingStatus {
  switch (value) {
    case 'outstanding':
    case 'received_for_review':
    case 'follow_up_needed':
    case 'recorded_complete':
    case 'not_recorded':
      return value
    default:
      return 'not_recorded'
  }
}

export function postClosingUndertakingsApplicabilityLabel(
  value: DemoPostClosingUndertakingsApplicability
): string {
  switch (value) {
    case 'unknown':
      return 'Unknown'
    case 'not_applicable':
      return 'Not applicable'
    case 'applicable':
      return 'Applicable'
    case 'lawyer_review_required':
      return 'Lawyer review required'
    default:
      return value
  }
}

export function postClosingUndertakingsInternalReviewStatusLabel(
  value: DemoPostClosingUndertakingsInternalReviewStatus
): string {
  switch (value) {
    case 'not_started':
      return 'Not started'
    case 'information_needed':
      return 'Information needed'
    case 'in_review':
      return 'In review'
    case 'lawyer_review_required':
      return 'Lawyer review required'
    case 'review_recorded':
      return 'Review recorded'
    default:
      return value
  }
}

export function postClosingUndertakingResponsiblePartyLabel(
  value: DemoPostClosingUndertakingResponsibleParty
): string {
  switch (value) {
    case 'unknown':
      return 'Unknown'
    case 'client':
      return 'Client'
    case 'buyer':
      return 'Buyer'
    case 'seller':
      return 'Seller'
    case 'lender':
      return 'Lender'
    case 'title_or_settlement_party':
      return 'Title / settlement party'
    case 'attorney':
      return 'Attorney'
    case 'other':
      return 'Other'
    default:
      return value
  }
}

export function postClosingUndertakingStatusLabel(value: DemoPostClosingUndertakingStatus): string {
  switch (value) {
    case 'not_recorded':
      return 'Not recorded'
    case 'outstanding':
      return 'Outstanding'
    case 'received_for_review':
      return 'Received for review'
    case 'follow_up_needed':
      return 'Follow-up needed'
    case 'recorded_complete':
      return 'Recorded complete'
    default:
      return value
  }
}

/** @deprecated Prefer postClosingUndertakingsInternalReviewStatusLabel. */
export function postClosingUndertakingsStatusLabel(
  value: DemoPostClosingUndertakingsInternalReviewStatus
): string {
  return postClosingUndertakingsInternalReviewStatusLabel(value)
}

/** @deprecated Prefer postClosingUndertakingStatusLabel. */
export function postClosingUndertakingItemStatusLabel(
  value: DemoPostClosingUndertakingStatus
): string {
  return postClosingUndertakingStatusLabel(value)
}

export function postClosingUndertakingsInternalReviewStatusPresentation(
  status: DemoPostClosingUndertakingsInternalReviewStatus
): PostClosingUndertakingsStatusPresentation {
  switch (status) {
    case 'review_recorded':
      return {
        label: postClosingUndertakingsInternalReviewStatusLabel(status),
        bg: '#e8f5f0',
        color: '#2f855a',
        border: 'rgba(47,133,90,0.35)',
      }
    case 'lawyer_review_required':
    case 'information_needed':
      return {
        label: postClosingUndertakingsInternalReviewStatusLabel(status),
        bg: '#fff8e6',
        color: '#b45309',
        border: 'rgba(180,83,9,0.35)',
      }
    case 'in_review':
      return {
        label: postClosingUndertakingsInternalReviewStatusLabel(status),
        bg: '#e8f4f8',
        color: '#208096',
        border: 'rgba(32,128,150,0.35)',
      }
    case 'not_started':
    default:
      return {
        label: postClosingUndertakingsInternalReviewStatusLabel(status),
        bg: '#f5f5f5',
        color: '#627c71',
        border: 'rgba(94,82,64,0.2)',
      }
  }
}

/** @deprecated Prefer postClosingUndertakingsInternalReviewStatusPresentation. */
export function postClosingUndertakingsStatusPresentation(
  status: DemoPostClosingUndertakingsInternalReviewStatus
): PostClosingUndertakingsStatusPresentation {
  return postClosingUndertakingsInternalReviewStatusPresentation(status)
}

export function createPostClosingUndertakingsReviewPatch(input: {
  draft: PostClosingUndertakingsReviewDraft
  actor: { staffId: string; staffName: string }
  existing?: DemoPostClosingUndertakingsReview | null
  nowIso?: string
}): DemoPostClosingUndertakingsReview {
  const existing = normalizePostClosingUndertakingsReview(input.existing)
  const nowIso = input.nowIso || new Date().toISOString()
  const undertakings = input.draft.undertakings.map((row, index) => {
    const normalized = normalizePostClosingUndertaking(row, index)
    return {
      ...normalized,
      createdAt: normalized.createdAt || nowIso,
      updatedAt: nowIso,
      recordedCompletionDate:
        normalized.status === 'recorded_complete'
          ? normalized.recordedCompletionDate || nowIso.slice(0, 10)
          : normalized.recordedCompletionDate,
    }
  })
  return {
    ...existing,
    applicability: input.draft.applicability,
    internalReviewStatus: input.draft.internalReviewStatus,
    reviewNote: input.draft.reviewNote.trim(),
    undertakings,
    reviewedById: input.actor.staffId,
    reviewedByName: input.actor.staffName,
    reviewedAt: nowIso,
  }
}

/** @deprecated Prefer createPostClosingUndertakingsReviewPatch. */
export function createPostClosingUndertakingsPatch(input: {
  draft: {
    status?: DemoPostClosingUndertakingsInternalReviewStatus
    applicability?: DemoPostClosingUndertakingsApplicability
    internalReviewStatus?: DemoPostClosingUndertakingsInternalReviewStatus
    reviewNote?: string
    followUpContext?: string
    internalNote?: string
    undertakings?: DemoPostClosingUndertaking[]
    items?: DemoPostClosingUndertaking[]
  }
  actor: { staffId: string; staffName: string }
  existing?: DemoPostClosingUndertakingsReview | null
  nowIso?: string
}): DemoPostClosingUndertakingsReview {
  const undertakings = (input.draft.undertakings || input.draft.items || []).map((row) => ({
    ...row,
    title: row.title || (row as { description?: string }).description || '',
  }))
  return createPostClosingUndertakingsReviewPatch({
    draft: {
      applicability: input.draft.applicability || 'unknown',
      internalReviewStatus:
        input.draft.internalReviewStatus || input.draft.status || 'not_started',
      reviewNote: input.draft.reviewNote || input.draft.internalNote || input.draft.followUpContext || '',
      undertakings,
    },
    actor: input.actor,
    existing: input.existing,
    nowIso: input.nowIso,
  })
}

export function isPostClosingUndertakingsReviewUntouched(
  record: DemoPostClosingUndertakingsReview | null | undefined
): boolean {
  const normalized = normalizePostClosingUndertakingsReview(record)
  return (
    normalized.applicability === 'unknown' &&
    normalized.internalReviewStatus === 'not_started' &&
    !normalized.reviewNote &&
    (normalized.undertakings?.length || 0) === 0
  )
}

/** @deprecated Prefer isPostClosingUndertakingsReviewUntouched. */
export function isPostClosingUndertakingsUntouched(
  record: DemoPostClosingUndertakingsReview | null | undefined
): boolean {
  return isPostClosingUndertakingsReviewUntouched(record)
}

export function countActivePostClosingUndertakings(
  record: DemoPostClosingUndertakingsReview | null | undefined
): number {
  const normalized = normalizePostClosingUndertakingsReview(record)
  return (normalized.undertakings || []).filter(
    (row) =>
      row.status === 'outstanding' ||
      row.status === 'received_for_review' ||
      row.status === 'follow_up_needed'
  ).length
}

/** @deprecated Prefer countActivePostClosingUndertakings. */
export function countOpenPostClosingUndertakingItems(
  record: DemoPostClosingUndertakingsReview | null | undefined
): number {
  return countActivePostClosingUndertakings(record)
}

export function formatPostClosingUndertakingsCount(count: number): string {
  if (count <= 0) return 'No recorded undertakings'
  if (count === 1) return '1 recorded undertaking'
  return `${count} recorded undertakings`
}

/** @deprecated Prefer formatPostClosingUndertakingsCount. */
export function formatPostClosingUndertakingsItemCount(count: number): string {
  return formatPostClosingUndertakingsCount(count)
}
