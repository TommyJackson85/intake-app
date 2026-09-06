/**
 * Post-Closing Undertakings Worklist — internal cross-matter visibility.
 *
 * Surfaces recorded post-closing undertaking items with outstanding follow-up
 * status across matters. Internal only and operational: it does not determine
 * whether an obligation, closing requirement, title matter, escrow item,
 * recording, payoff, or trust-account requirement is complete or satisfied.
 */
import {
  POST_CLOSING_RECORDED_ITEM_LABEL,
  getPostClosingReviewStatusPresentation,
  getPostClosingUndertakingStatusPresentation,
  normalizePostClosingUndertakingsReview,
  postClosingUndertakingResponsiblePartyLabel,
  postClosingUndertakingsApplicabilityLabel,
} from '@/lib/demo/postClosingUndertakings'
import type {
  DemoMatter,
  DemoPostClosingUndertaking,
  DemoPostClosingUndertakingResponsibleParty,
  DemoPostClosingUndertakingStatus,
  DemoPostClosingUndertakingsApplicability,
  DemoPostClosingUndertakingsInternalReviewStatus,
  DemoPostClosingUndertakingsReview,
} from '@/lib/demo/types'

/** Item statuses that count as outstanding follow-up on the worklist. */
export const POST_CLOSING_OUTSTANDING_FOLLOW_UP_STATUSES: readonly DemoPostClosingUndertakingStatus[] =
  ['outstanding', 'received_for_review', 'follow_up_needed'] as const

export const POST_CLOSING_UNDERTAKINGS_WORKLIST_DISCLAIMER =
  'Internal Post-Closing Undertakings Worklist of recorded items with outstanding follow-up status. Operational staff visibility only — it does not determine whether an obligation, closing requirement, title matter, escrow item, recording, payoff, or trust-account requirement is complete or satisfied. Not shown on the client portal.'

export type PostClosingUndertakingsWorklistItem = {
  matterId: string
  matterFileId: string
  matterLabel: string
  matterStatus: DemoMatter['status']
  undertakingId: string
  title: string
  status: DemoPostClosingUndertakingStatus
  statusLabel: string
  statusPresentation: ReturnType<typeof getPostClosingUndertakingStatusPresentation>
  responsibleParty: DemoPostClosingUndertakingResponsibleParty
  responsiblePartyLabel: string
  targetDate: string | null
  followUpNote: string
  details: string
  reviewApplicability: DemoPostClosingUndertakingsApplicability
  reviewApplicabilityLabel: string
  reviewStatus: DemoPostClosingUndertakingsInternalReviewStatus
  reviewStatusLabel: string
  updatedAt: string | null
  createdAt: string | null
}

export type PostClosingUndertakingsWorklist = {
  pendingCount: number
  countLabel: string
  items: PostClosingUndertakingsWorklistItem[]
  disclaimer: string
}

function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = (value || '').trim()
  return trimmed || null
}

function resolveMatterLabel(matter: DemoMatter): string {
  return matter.property?.address?.trim() || matter.file_id
}

/**
 * Whether a recorded undertaking belongs on the outstanding-follow-up worklist.
 * Deny-by-default for unknown / complete / not-recorded statuses.
 */
export function isPostClosingUndertakingWorklistEligible(
  status: DemoPostClosingUndertakingStatus | string | null | undefined
): boolean {
  return (
    status === 'outstanding' ||
    status === 'received_for_review' ||
    status === 'follow_up_needed'
  )
}

/** @deprecated Prefer isPostClosingUndertakingWorklistEligible. */
export function isPostClosingUndertakingOutstandingFollowUp(
  status: DemoPostClosingUndertakingStatus | string | null | undefined
): boolean {
  return isPostClosingUndertakingWorklistEligible(status)
}

export function getPostClosingUndertakingTargetDate(
  undertaking: Pick<DemoPostClosingUndertaking, 'targetDate'> | null | undefined
): string | null {
  return emptyToNull(undertaking?.targetDate)
}

export function getPostClosingUndertakingUpdatedAt(
  undertaking: Pick<DemoPostClosingUndertaking, 'updatedAt' | 'createdAt'> | null | undefined
): string | null {
  return emptyToNull(undertaking?.updatedAt) || emptyToNull(undertaking?.createdAt)
}

export function formatPostClosingUndertakingsWorklistCount(count: number): string {
  if (count <= 0) return 'No outstanding follow-up items'
  if (count === 1) return '1 outstanding follow-up item'
  return `${count} outstanding follow-up items`
}

/**
 * Project one worklist row from a matter + review + undertaking.
 * Returns null when the undertaking is not worklist-eligible.
 */
export function getPostClosingUndertakingsWorklistItem(input: {
  matter: DemoMatter
  review?: DemoPostClosingUndertakingsReview | null
  undertaking: DemoPostClosingUndertaking
}): PostClosingUndertakingsWorklistItem | null {
  const matter = input.matter
  if (!matter || matter.deletedAt) return null

  const normalizedUndertakingStatus = input.undertaking.status || 'not_recorded'
  if (!isPostClosingUndertakingWorklistEligible(normalizedUndertakingStatus)) return null

  const normalizedReview = normalizePostClosingUndertakingsReview(input.review)
  const status = normalizedUndertakingStatus as DemoPostClosingUndertakingStatus
  const responsibleParty = (input.undertaking.responsibleParty ||
    'unknown') as DemoPostClosingUndertakingResponsibleParty
  const statusPresentation = getPostClosingUndertakingStatusPresentation(status)
  const reviewStatus = normalizedReview.internalReviewStatus || 'not_started'
  const reviewApplicability = normalizedReview.applicability || 'unknown'

  return {
    matterId: matter.id,
    matterFileId: matter.file_id,
    matterLabel: resolveMatterLabel(matter),
    matterStatus: matter.status,
    undertakingId: input.undertaking.id,
    title: (input.undertaking.title || '').trim() || POST_CLOSING_RECORDED_ITEM_LABEL,
    status,
    statusLabel: statusPresentation.label,
    statusPresentation,
    responsibleParty,
    responsiblePartyLabel: postClosingUndertakingResponsiblePartyLabel(responsibleParty),
    targetDate: getPostClosingUndertakingTargetDate(input.undertaking),
    followUpNote: (input.undertaking.followUpNote || '').trim(),
    details: (input.undertaking.details || '').trim(),
    reviewApplicability,
    reviewApplicabilityLabel: postClosingUndertakingsApplicabilityLabel(reviewApplicability),
    reviewStatus,
    reviewStatusLabel: getPostClosingReviewStatusPresentation(reviewStatus).label,
    updatedAt: getPostClosingUndertakingUpdatedAt(input.undertaking),
    createdAt: emptyToNull(input.undertaking.createdAt),
  }
}

function sortKey(item: PostClosingUndertakingsWorklistItem): number {
  const raw = item.targetDate || item.updatedAt || item.createdAt
  if (!raw) return Number.POSITIVE_INFINITY
  const time = new Date(raw).getTime()
  return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY
}

/**
 * Internal worklist of recorded post-closing items with outstanding follow-up status.
 * Skips deleted matters and non-eligible item statuses. Deny-by-default otherwise.
 */
export function getPostClosingUndertakingsWorklist(input: {
  matters: DemoMatter[]
  postClosingUndertakingsByMatterId: Record<string, DemoPostClosingUndertakingsReview | undefined>
}): PostClosingUndertakingsWorklist {
  const mattersById = new Map(
    input.matters.filter((m) => m && !m.deletedAt).map((m) => [m.id, m] as const)
  )
  const items: PostClosingUndertakingsWorklistItem[] = []

  for (const [matterId, record] of Object.entries(input.postClosingUndertakingsByMatterId)) {
    const matter = mattersById.get(matterId)
    if (!matter) continue

    const normalized = normalizePostClosingUndertakingsReview(record)
    for (const row of normalized.undertakings || []) {
      const item = getPostClosingUndertakingsWorklistItem({
        matter,
        review: normalized,
        undertaking: row,
      })
      if (item) items.push(item)
    }
  }

  items.sort((a, b) => {
    const byDate = sortKey(a) - sortKey(b)
    if (byDate !== 0) return byDate
    const byFile = a.matterFileId.localeCompare(b.matterFileId)
    if (byFile !== 0) return byFile
    return a.title.localeCompare(b.title)
  })

  return {
    pendingCount: items.length,
    countLabel: formatPostClosingUndertakingsWorklistCount(items.length),
    items,
    disclaimer: POST_CLOSING_UNDERTAKINGS_WORKLIST_DISCLAIMER,
  }
}

/** @deprecated Prefer getPostClosingUndertakingsWorklist. */
export function buildPostClosingUndertakingsWorklist(input: {
  matters: DemoMatter[]
  postClosingUndertakingsByMatterId: Record<string, DemoPostClosingUndertakingsReview | undefined>
}): PostClosingUndertakingsWorklist {
  return getPostClosingUndertakingsWorklist(input)
}

/** @deprecated Prefer isPostClosingUndertakingWorklistEligible. */
export function projectPostClosingUndertakingWorklistCandidate(
  undertaking: DemoPostClosingUndertaking
): boolean {
  return isPostClosingUndertakingWorklistEligible(undertaking.status)
}
