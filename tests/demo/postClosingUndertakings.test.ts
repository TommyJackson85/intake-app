import { describe, expect, it } from 'vitest'
import {
  POST_CLOSING_UNDERTAKINGS_DISCLAIMER,
  buildDefaultPostClosingUndertaking,
  buildDefaultPostClosingUndertakingsReview,
  countActivePostClosingUndertakings,
  createPostClosingUndertakingsReviewPatch,
  formatPostClosingUndertakingsCount,
  isPostClosingUndertakingsReviewUntouched,
  normalizePostClosingUndertakingsReview,
  postClosingUndertakingResponsiblePartyLabel,
  postClosingUndertakingStatusLabel,
  postClosingUndertakingsApplicabilityLabel,
  postClosingUndertakingsInternalReviewStatusLabel,
  postClosingUndertakingsInternalReviewStatusPresentation,
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

  it('migrates legacy item-based records into the review schema', () => {
    const normalized = normalizePostClosingUndertakingsReview({
      status: 'monitoring',
      followUpContext: 'Matter-level follow-up',
      internalNote: 'Legacy staff note',
      items: [
        {
          id: 'legacy-1',
          description: 'Final title policy follow-up',
          status: 'in_progress',
          followUpContext: 'Request status from title agent.',
          notes: 'Legacy notes',
          targetDate: '2026-04-15',
        },
      ],
      recordedByStaffId: 'staff-1',
      recordedByStaffName: 'Katherine Ruiz, Esq.',
      recordedAt: '2026-03-01T12:00:00.000Z',
    } as never)
    expect(normalized.applicability).toBe('unknown')
    expect(normalized.internalReviewStatus).toBe('in_review')
    expect(normalized.reviewNote).toBe('Legacy staff note')
    expect(normalized.reviewedByName).toBe('Katherine Ruiz, Esq.')
    expect(normalized.undertakings).toHaveLength(1)
    expect(normalized.undertakings?.[0]?.title).toBe('Final title policy follow-up')
    expect(normalized.undertakings?.[0]?.status).toBe('outstanding')
    expect(normalized.undertakings?.[0]?.followUpNote).toBe('Request status from title agent.')
  })

  it('creates a dated patch from draft undertakings and review fields', () => {
    const existing = buildDefaultPostClosingUndertakingsReview()
    const item = buildDefaultPostClosingUndertaking({
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
    expect(patch.undertakings?.[0]?.title).toBe('Final title policy follow-up')
    expect(patch.undertakings?.[0]?.status).toBe('outstanding')
    expect(patch.undertakings?.[0]?.responsibleParty).toBe('title_or_settlement_party')
    expect(patch.reviewNote).toBe(
      'Internal tracking only — not a closing-completeness determination.'
    )
    expect(patch.reviewedByName).toBe('Katherine Ruiz, Esq.')
    expect(patch.reviewedAt).toBe('2026-03-10T15:00:00.000Z')
    expect(countActivePostClosingUndertakings(patch)).toBe(1)
  })

  it('labels statuses without implying legal satisfaction', () => {
    expect(postClosingUndertakingsApplicabilityLabel('lawyer_review_required')).toBe(
      'Lawyer review required'
    )
    expect(postClosingUndertakingsInternalReviewStatusLabel('review_recorded')).toBe(
      'Review recorded'
    )
    expect(postClosingUndertakingStatusLabel('recorded_complete')).toBe('Recorded complete')
    expect(postClosingUndertakingResponsiblePartyLabel('title_or_settlement_party')).toBe(
      'Title / settlement party'
    )
    expect(postClosingUndertakingsInternalReviewStatusPresentation('in_review').label).toBe(
      'In review'
    )
    expect(formatPostClosingUndertakingsCount(0)).toBe('No recorded undertakings')
    expect(formatPostClosingUndertakingsCount(2)).toBe('2 recorded undertakings')
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
})
