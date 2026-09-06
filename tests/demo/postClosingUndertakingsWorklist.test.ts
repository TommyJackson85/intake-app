import { describe, expect, it } from 'vitest'
import {
  POST_CLOSING_UNDERTAKINGS_WORKLIST_DISCLAIMER,
  buildPostClosingUndertakingsWorklist,
  isPostClosingUndertakingOutstandingFollowUp,
} from '@/lib/demo/postClosingUndertakingsWorklist'
import {
  createPostClosingUndertaking,
  buildDefaultPostClosingUndertakingsReview,
} from '@/lib/demo/postClosingUndertakings'
import type { DemoMatter, DemoPostClosingUndertakingsReview } from '@/lib/demo/types'

function stubMatter(input: {
  id: string
  file_id: string
  address?: string
  deletedAt?: string | null
}): DemoMatter {
  return {
    id: input.id,
    file_id: input.file_id,
    status: 'Closed/Post-Closing',
    deletedAt: input.deletedAt ?? null,
    property: {
      address: input.address || '100 Palm Ave',
      county: 'Miami-Dade',
      property_type: 'Single-Family Home',
    },
  } as DemoMatter
}

describe('postClosingUndertakingsWorklist', () => {
  it('includes only recorded items with outstanding follow-up statuses', () => {
    expect(isPostClosingUndertakingOutstandingFollowUp('outstanding')).toBe(true)
    expect(isPostClosingUndertakingOutstandingFollowUp('follow_up_needed')).toBe(true)
    expect(isPostClosingUndertakingOutstandingFollowUp('received_for_review')).toBe(true)
    expect(isPostClosingUndertakingOutstandingFollowUp('recorded_complete')).toBe(false)
    expect(isPostClosingUndertakingOutstandingFollowUp('not_recorded')).toBe(false)

    const matter = stubMatter({ id: 'matter-1', file_id: 'FL-1001' })
    const review: DemoPostClosingUndertakingsReview = {
      ...buildDefaultPostClosingUndertakingsReview(),
      applicability: 'applicable',
      internalReviewStatus: 'in_review',
      undertakings: [
        {
          ...createPostClosingUndertaking({
            id: 'pcu-open',
            title: 'Final title policy follow-up',
            nowIso: '2026-03-10T15:00:00.000Z',
          }),
          status: 'outstanding',
          responsibleParty: 'title_or_settlement_party',
          targetDate: '2026-04-15',
          followUpNote: 'Request status from title agent.',
        },
        {
          ...createPostClosingUndertaking({
            id: 'pcu-done',
            title: 'HOA estoppel already recorded',
            nowIso: '2026-03-09T15:00:00.000Z',
          }),
          status: 'recorded_complete',
        },
        {
          ...createPostClosingUndertaking({
            id: 'pcu-blank',
            title: 'Not yet recorded row',
            nowIso: '2026-03-08T15:00:00.000Z',
          }),
          status: 'not_recorded',
        },
      ],
    }

    const list = buildPostClosingUndertakingsWorklist({
      matters: [matter],
      postClosingUndertakingsByMatterId: {
        [matter.id]: review,
      },
    })

    expect(list.pendingCount).toBe(1)
    expect(list.items).toHaveLength(1)
    expect(list.items[0]?.undertakingId).toBe('pcu-open')
    expect(list.items[0]?.matterFileId).toBe('FL-1001')
    expect(list.items[0]?.statusLabel).toBe('Outstanding')
    expect(list.items[0]?.responsiblePartyLabel).toBe('Title / settlement party')
    expect(list.items[0]?.followUpNote).toBe('Request status from title agent.')
    expect(list.disclaimer).toBe(POST_CLOSING_UNDERTAKINGS_WORKLIST_DISCLAIMER)
    expect(list.disclaimer.toLowerCase()).toContain('does not determine')
    expect(list.disclaimer.toLowerCase()).toContain('not shown on the client portal')
  })

  it('skips deleted matters and sorts by target date then file id', () => {
    const activeA = stubMatter({ id: 'matter-a', file_id: 'FL-2002', address: '200 Oak St' })
    const activeB = stubMatter({ id: 'matter-b', file_id: 'FL-2001', address: '201 Oak St' })
    const deleted = stubMatter({
      id: 'matter-deleted',
      file_id: 'FL-9999',
      deletedAt: '2026-01-01T00:00:00.000Z',
    })

    const mk = (
      id: string,
      title: string,
      targetDate: string,
      status: 'outstanding' | 'follow_up_needed' | 'received_for_review' = 'outstanding'
    ) => ({
      ...createPostClosingUndertaking({ id, title, nowIso: '2026-03-10T15:00:00.000Z' }),
      status,
      targetDate,
    })

    const list = buildPostClosingUndertakingsWorklist({
      matters: [activeA, activeB, deleted],
      postClosingUndertakingsByMatterId: {
        [activeA.id]: {
          ...buildDefaultPostClosingUndertakingsReview(),
          undertakings: [mk('a1', 'Later item', '2026-05-01')],
        },
        [activeB.id]: {
          ...buildDefaultPostClosingUndertakingsReview(),
          undertakings: [mk('b1', 'Sooner item', '2026-04-01', 'follow_up_needed')],
        },
        [deleted.id]: {
          ...buildDefaultPostClosingUndertakingsReview(),
          undertakings: [mk('d1', 'Should not appear', '2026-03-01')],
        },
      },
    })

    expect(list.pendingCount).toBe(2)
    expect(list.items.map((i) => i.undertakingId)).toEqual(['b1', 'a1'])
    expect(list.items[0]?.status).toBe('follow_up_needed')
    expect(list.items.some((i) => i.matterId === deleted.id)).toBe(false)
  })

  it('returns an empty worklist when no outstanding follow-up items exist', () => {
    const matter = stubMatter({ id: 'matter-empty', file_id: 'FL-3000' })
    const list = buildPostClosingUndertakingsWorklist({
      matters: [matter],
      postClosingUndertakingsByMatterId: {},
    })
    expect(list.pendingCount).toBe(0)
    expect(list.items).toEqual([])
  })
})
