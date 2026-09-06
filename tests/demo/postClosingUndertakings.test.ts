import { describe, expect, it } from 'vitest'
import {
  POST_CLOSING_RECORDED_ITEM_LABEL,
  POST_CLOSING_REMOVE_RECORDED_ITEM_NOTICE,
  POST_CLOSING_UNDERTAKINGS_DISCLAIMER,
  createPostClosingUndertaking,
  createPostClosingUndertakingsReviewPatch,
  getPostClosingReviewStatusPresentation,
  getPostClosingUndertakingStatusPresentation,
  getPostClosingUndertakingsSummary,
  isPostClosingUndertakingsReviewUntouched,
  normalizePostClosingUndertakingsReview,
  postClosingUndertakingResponsiblePartyLabel,
  postClosingUndertakingsApplicabilityLabel,
  removePostClosingUndertaking,
  updatePostClosingUndertaking,
  buildDefaultPostClosingUndertakingsReview,
} from '@/lib/demo/postClosingUndertakings'

describe('postClosingUndertakings', () => {
  it('builds an empty default review record', () => {
    const record = buildDefaultPostClosingUndertakingsReview()
    expect(record.applicability).toBe('unknown')
    expect(record.internalReviewStatus).toBe('not_started')
    expect(record.undertakings).toEqual([])
    expect(record.reviewNote).toBe('')
    expect(isPostClosingUndertakingsReviewUntouched(record)).toBe(true)
  })

  it('normalizes missing fields and unknown statuses safely', () => {
    const normalized = normalizePostClosingUndertakingsReview({
      applicability: 'bogus' as never,
      internalReviewStatus: 'unknown' as never,
      undertakings: [
        {
          id: '',
          title: ' Record deed ',
          responsibleParty: 'bogus' as never,
          status: 'bogus' as never,
          followUpNote: ' Confirm recording package ',
          details: ' Internal details ',
          targetDate: '2026-04-01',
        },
      ],
      reviewNote: ' Staff review note ',
      reviewedById: 'staff-1',
      reviewedByName: 'Katherine Ruiz, Esq.',
      reviewedAt: '2026-03-01T12:00:00.000Z',
    })
    expect(normalized.applicability).toBe('unknown')
    expect(normalized.internalReviewStatus).toBe('not_started')
    expect(normalized.undertakings).toHaveLength(1)
    expect(normalized.undertakings?.[0]?.id).toBe('pcu-1')
    expect(normalized.undertakings?.[0]?.title).toBe('Record deed')
    expect(normalized.undertakings?.[0]?.status).toBe('not_recorded')
    expect(normalized.undertakings?.[0]?.responsibleParty).toBe('unknown')
    expect(normalized.reviewNote).toBe('Staff review note')
    expect(isPostClosingUndertakingsReviewUntouched(normalized)).toBe(false)
  })

  it('creates, updates, and removes recorded items through canonical helpers', () => {
    const existing = buildDefaultPostClosingUndertakingsReview()
    const created = createPostClosingUndertaking({
      id: 'pcu-1',
      title: 'Final title policy follow-up',
      nowIso: '2026-03-10T15:00:00.000Z',
    })
    expect(created.status).toBe('not_recorded')

    const withItem = {
      ...existing,
      undertakings: [created],
    }
    const updated = updatePostClosingUndertaking(
      withItem,
      'pcu-1',
      {
        responsibleParty: 'title_or_settlement_party',
        status: 'outstanding',
        followUpNote: 'Request status from title agent.',
        details: 'Underwriter policy issuance',
        targetDate: '2026-04-15',
      },
      '2026-03-10T15:00:00.000Z'
    )
    expect(updated.undertakings?.[0]?.status).toBe('outstanding')
    expect(updated.undertakings?.[0]?.responsibleParty).toBe('title_or_settlement_party')
    expect(updated.undertakings?.[0]?.updatedAt).toBe('2026-03-10T15:00:00.000Z')

    const removed = removePostClosingUndertaking(updated, 'pcu-1')
    expect(removed.undertakings).toEqual([])
  })

  it('creates a dated review patch from draft undertakings', () => {
    const existing = buildDefaultPostClosingUndertakingsReview()
    const item = createPostClosingUndertaking({
      id: 'pcu-1',
      title: 'Final title policy follow-up',
      nowIso: '2026-03-10T15:00:00.000Z',
    })
    const patch = createPostClosingUndertakingsReviewPatch({
      draft: {
        applicability: 'applicable',
        internalReviewStatus: 'in_review',
        reviewNote: 'Internal tracking only — not a closing-completeness determination.',
        undertakings: [
          {
            ...item,
            responsibleParty: 'title_or_settlement_party',
            status: 'outstanding',
            followUpNote: 'Request status from title agent.',
            details: 'Underwriter policy issuance',
            targetDate: '2026-04-15',
          },
        ],
      },
      actor: { staffId: 'staff-1', staffName: 'Katherine Ruiz, Esq.' },
      existing,
      nowIso: '2026-03-10T15:00:00.000Z',
    })
    expect(patch.applicability).toBe('applicable')
    expect(patch.internalReviewStatus).toBe('in_review')
    expect(patch.undertakings).toHaveLength(1)
    expect(patch.reviewedByName).toBe('Katherine Ruiz, Esq.')
    expect(patch.reviewedAt).toBe('2026-03-10T15:00:00.000Z')

    const summary = getPostClosingUndertakingsSummary(patch)
    expect(summary.totalCount).toBe(1)
    expect(summary.activeCount).toBe(1)
    expect(summary.countLabel).toBe('1 recorded item')
    expect(summary.applicabilityLabel).toBe('Applicable')
    expect(summary.reviewStatusPresentation.label).toBe('In review')
    expect(summary.isUntouched).toBe(false)
  })

  it('exposes status presentation helpers without implying legal satisfaction', () => {
    expect(POST_CLOSING_RECORDED_ITEM_LABEL).toBe('Recorded item')
    expect(postClosingUndertakingsApplicabilityLabel('lawyer_review_required')).toBe(
      'Lawyer review required'
    )
    expect(getPostClosingReviewStatusPresentation('review_recorded').label).toBe('Review recorded')
    expect(getPostClosingUndertakingStatusPresentation('recorded_complete').label).toBe(
      'Internally recorded'
    )
    expect(postClosingUndertakingResponsiblePartyLabel('title_or_settlement_party')).toBe(
      'Title / settlement party'
    )
    expect(getPostClosingUndertakingsSummary(null).countLabel).toBe('No recorded items')
  })

  it('includes the internal-only non-determination disclaimer copy', () => {
    expect(POST_CLOSING_UNDERTAKINGS_DISCLAIMER.toLowerCase()).toContain('internal only')
    expect(POST_CLOSING_UNDERTAKINGS_DISCLAIMER.toLowerCase()).toContain(
      'without stating that an obligation'
    )
    expect(POST_CLOSING_UNDERTAKINGS_DISCLAIMER.toLowerCase()).toContain('closing requirement')
    expect(POST_CLOSING_UNDERTAKINGS_DISCLAIMER.toLowerCase()).toContain('title matter')
    expect(POST_CLOSING_UNDERTAKINGS_DISCLAIMER.toLowerCase()).toContain('escrow item')
    expect(POST_CLOSING_UNDERTAKINGS_DISCLAIMER.toLowerCase()).toContain('recording')
    expect(POST_CLOSING_UNDERTAKINGS_DISCLAIMER.toLowerCase()).toContain('payoff')
    expect(POST_CLOSING_UNDERTAKINGS_DISCLAIMER.toLowerCase()).toContain('trust-account')
    expect(POST_CLOSING_UNDERTAKINGS_DISCLAIMER.toLowerCase()).toContain(
      'complete or satisfied'
    )
  })

  it('removes a recorded item without implying legal or matter-status changes', () => {
    expect(POST_CLOSING_REMOVE_RECORDED_ITEM_NOTICE).toBe(
      'This removes the recorded internal undertaking item from this matter. It does not change matter status, client records, documents, tasks, closing status, or any legal determination.'
    )
    expect(POST_CLOSING_REMOVE_RECORDED_ITEM_NOTICE.toLowerCase()).toContain(
      'does not change matter status'
    )
    expect(POST_CLOSING_REMOVE_RECORDED_ITEM_NOTICE.toLowerCase()).toContain(
      'any legal determination'
    )

    const existing = buildDefaultPostClosingUndertakingsReview()
    const keep = createPostClosingUndertaking({ id: 'pcu-keep', title: 'Keep' })
    const drop = createPostClosingUndertaking({ id: 'pcu-drop', title: 'Drop' })
    const next = removePostClosingUndertaking(
      { ...existing, undertakings: [keep, drop] },
      'pcu-drop'
    )
    expect(next.undertakings).toHaveLength(1)
    expect(next.undertakings?.[0]?.id).toBe('pcu-keep')
  })
})
