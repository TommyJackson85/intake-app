import { describe, expect, it } from 'vitest'
import {
  POST_CLOSING_UNDERTAKINGS_DISCLAIMER,
  buildDefaultPostClosingUndertakingItem,
  buildDefaultPostClosingUndertakings,
  countOpenPostClosingUndertakingItems,
  createPostClosingUndertakingsPatch,
  formatPostClosingUndertakingsItemCount,
  isPostClosingUndertakingsUntouched,
  normalizePostClosingUndertakings,
  postClosingUndertakingItemStatusLabel,
  postClosingUndertakingsStatusLabel,
  postClosingUndertakingsStatusPresentation,
} from '@/lib/demo/postClosingUndertakings'

describe('postClosingUndertakings', () => {
  it('builds an empty default record', () => {
    const record = buildDefaultPostClosingUndertakings()
    expect(record.status).toBe('not_started')
    expect(record.items).toEqual([])
    expect(record.followUpContext).toBe('')
    expect(record.internalNote).toBe('')
    expect(isPostClosingUndertakingsUntouched(record)).toBe(true)
  })

  it('normalizes missing fields and unknown statuses safely', () => {
    const normalized = normalizePostClosingUndertakings({
      status: 'unknown' as never,
      items: [
        {
          id: '',
          description: ' Record deed ',
          status: 'bogus' as never,
          followUpContext: ' Confirm recording package ',
          targetDate: '2026-04-01',
          notes: ' Internal only ',
        },
      ],
      followUpContext: ' Matter-level follow-up ',
      internalNote: ' Staff note ',
      recordedByStaffId: 'staff-1',
      recordedByStaffName: 'Katherine Ruiz, Esq.',
      recordedAt: '2026-03-01T12:00:00.000Z',
      updatedAt: '2026-03-02T12:00:00.000Z',
    })
    expect(normalized.status).toBe('not_started')
    expect(normalized.items).toHaveLength(1)
    expect(normalized.items[0]?.id).toBe('pcu-item-1')
    expect(normalized.items[0]?.description).toBe('Record deed')
    expect(normalized.items[0]?.status).toBe('open')
    expect(normalized.followUpContext).toBe('Matter-level follow-up')
    expect(isPostClosingUndertakingsUntouched(normalized)).toBe(false)
  })

  it('creates a dated patch from draft items and follow-up context', () => {
    const existing = buildDefaultPostClosingUndertakings()
    const item = buildDefaultPostClosingUndertakingItem({
      id: 'pcu-1',
      description: 'Final title policy follow-up',
    })
    const patch = createPostClosingUndertakingsPatch({
      draft: {
        status: 'monitoring',
        followUpContext: 'Waiting on underwriter policy issuance.',
        internalNote: 'Internal tracking only — not a closing-completeness determination.',
        items: [
          {
            ...item,
            status: 'in_progress',
            followUpContext: 'Request status from title agent.',
            targetDate: '2026-04-15',
            notes: '',
          },
        ],
      },
      actor: { staffId: 'staff-1', staffName: 'Katherine Ruiz, Esq.' },
      existing,
      nowIso: '2026-03-10T15:00:00.000Z',
    })
    expect(patch.status).toBe('monitoring')
    expect(patch.items).toHaveLength(1)
    expect(patch.items[0]?.description).toBe('Final title policy follow-up')
    expect(patch.items[0]?.status).toBe('in_progress')
    expect(patch.followUpContext).toBe('Waiting on underwriter policy issuance.')
    expect(patch.recordedByStaffName).toBe('Katherine Ruiz, Esq.')
    expect(patch.recordedAt).toBe('2026-03-10T15:00:00.000Z')
    expect(patch.updatedAt).toBe('2026-03-10T15:00:00.000Z')
    expect(countOpenPostClosingUndertakingItems(patch)).toBe(1)
  })

  it('labels statuses without implying legal satisfaction', () => {
    expect(postClosingUndertakingsStatusLabel('internally_noted')).toBe('Internally noted')
    expect(postClosingUndertakingItemStatusLabel('closed_internally')).toBe('Closed internally')
    expect(postClosingUndertakingsStatusPresentation('monitoring').label).toBe('Monitoring')
    expect(formatPostClosingUndertakingsItemCount(0)).toBe('No recorded items')
    expect(formatPostClosingUndertakingsItemCount(2)).toBe('2 recorded items')
  })

  it('includes the non-determination disclaimer copy', () => {
    expect(POST_CLOSING_UNDERTAKINGS_DISCLAIMER.toLowerCase()).toContain('does not determine')
    expect(POST_CLOSING_UNDERTAKINGS_DISCLAIMER.toLowerCase()).toContain('obligation is satisfied')
    expect(POST_CLOSING_UNDERTAKINGS_DISCLAIMER.toLowerCase()).toContain('closing is complete')
    expect(POST_CLOSING_UNDERTAKINGS_DISCLAIMER.toLowerCase()).toContain('trust-account')
  })
})
