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
  items: PostClosingUndertakingsWorklistItem[]
  disclaimer: string
}

export function isPostClosingUndertakingOutstandingFollowUp(
  status: DemoPostClosingUndertakingStatus | string | null | undefined
): boolean {
  return (
    status === 'outstanding' ||
    status === 'received_for_review' ||
    status === 'follow_up_needed'
  )
}

function resolveMatterLabel(matter: DemoMatter): string {
  return matter.property?.address?.trim() || matter.file_id
}

function sortKey(item: PostClosingUndertakingsWorklistItem): number {
  const raw = item.targetDate || item.updatedAt || item.createdAt
  if (!raw) return Number.POSITIVE_INFINITY
  const time = new Date(raw).getTime()
  return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY
}

/**
 * Pure internal worklist of recorded post-closing items with outstanding follow-up status.
 * Skips deleted matters and non-outstanding item statuses. Deny-by-default otherwise.
 */
export function buildPostClosingUndertakingsWorklist(input: {
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
    const reviewStatus = normalized.internalReviewStatus || 'not_started'
    const reviewApplicability = normalized.applicability || 'unknown'

    for (const row of normalized.undertakings || []) {
      if (!isPostClosingUndertakingOutstandingFollowUp(row.status)) continue
      const status = (row.status || 'outstanding') as DemoPostClosingUndertakingStatus
      const responsibleParty = (row.responsibleParty ||
        'unknown') as DemoPostClosingUndertakingResponsibleParty
      const statusPresentation = getPostClosingUndertakingStatusPresentation(status)

      items.push({
        matterId: matter.id,
        matterFileId: matter.file_id,
        matterLabel: resolveMatterLabel(matter),
        matterStatus: matter.status,
        undertakingId: row.id,
        title: row.title || POST_CLOSING_RECORDED_ITEM_LABEL,
        status,
        statusLabel: statusPresentation.label,
        statusPresentation,
        responsibleParty,
        responsiblePartyLabel: postClosingUndertakingResponsiblePartyLabel(responsibleParty),
        targetDate: row.targetDate ?? null,
        followUpNote: (row.followUpNote || '').trim(),
        details: (row.details || '').trim(),
        reviewApplicability,
        reviewApplicabilityLabel: postClosingUndertakingsApplicabilityLabel(reviewApplicability),
        reviewStatus,
        reviewStatusLabel: getPostClosingReviewStatusPresentation(reviewStatus).label,
        updatedAt: row.updatedAt ?? null,
        createdAt: row.createdAt ?? null,
      })
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
    items,
    disclaimer: POST_CLOSING_UNDERTAKINGS_WORKLIST_DISCLAIMER,
  }
}

/** @internal helper for tests — project one undertaking row without matter lookup. */
export function projectPostClosingUndertakingWorklistCandidate(
  undertaking: DemoPostClosingUndertaking
): boolean {
  return isPostClosingUndertakingOutstandingFollowUp(undertaking.status)
}
