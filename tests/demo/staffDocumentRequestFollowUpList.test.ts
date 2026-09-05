import { describe, expect, it } from 'vitest'
import { demoSeedData } from '@/lib/demo/demoData'
import { buildStaffDocumentRequestFollowUpList } from '@/lib/demo/staffDocumentRequestFollowUpList'
import {
  clearDocumentRequestNeedsFollowUp,
  markDocumentRequestNeedsFollowUp,
  normalizeDocumentRequestFollowUp,
} from '@/lib/demo/staffDocumentRequestFollowUp'

describe('buildStaffDocumentRequestFollowUpList', () => {
  it('includes seeded Needs follow-up requests with neutral staff-only labels', () => {
    const list = buildStaffDocumentRequestFollowUpList({
      documentRequests: demoSeedData.documentRequests,
      documents: demoSeedData.documents,
      matters: demoSeedData.matters,
    })

    expect(list.pendingCount).toBeGreaterThan(0)
    expect(list.disclaimer.toLowerCase()).toContain('neutral')
    expect(list.disclaimer.toLowerCase()).toContain('not shown on the client portal')

    const seeded = demoSeedData.documentRequests.find((r) => r.id === 'docreq-002')!
    expect(normalizeDocumentRequestFollowUp(seeded.staff_follow_up).status).toBe('needs_follow_up')

    const item = list.items.find((i) => i.requestId === seeded.id)
    expect(item).toBeTruthy()
    expect(item!.followUpStatusLabel).toBe('Needs follow-up')
    expect(item!.requestTitle).toBe(seeded.title)
    expect(item!.internalFollowUpNote).toBe(
      normalizeDocumentRequestFollowUp(seeded.staff_follow_up).note,
    )
    expect(item!.canClearNeedsFollowUp).toBe(true)
    expect(item!.receiptReviewLabel).toBe('Receipt review recorded')
  })

  it('removes a request after Needs follow-up is cleared', () => {
    const seeded = demoSeedData.documentRequests.find((r) => r.id === 'docreq-002')!
    const before = buildStaffDocumentRequestFollowUpList({
      documentRequests: demoSeedData.documentRequests,
      documents: demoSeedData.documents,
      matters: demoSeedData.matters,
    })
    expect(before.items.some((i) => i.requestId === seeded.id)).toBe(true)

    const cleared = clearDocumentRequestNeedsFollowUp(
      demoSeedData.matters,
      demoSeedData.documentRequests,
      { requestId: seeded.id },
    )
    const after = buildStaffDocumentRequestFollowUpList({
      documentRequests: cleared,
      documents: demoSeedData.documents,
      matters: demoSeedData.matters,
    })
    expect(after.items.some((i) => i.requestId === seeded.id)).toBe(false)
  })

  it('adds a newly marked request to the list', () => {
    const open = demoSeedData.documentRequests.find(
      (r) => normalizeDocumentRequestFollowUp(r.staff_follow_up).status === 'none',
    )!
    const marked = markDocumentRequestNeedsFollowUp(
      demoSeedData.matters,
      demoSeedData.documentRequests,
      demoSeedData.staff,
      { requestId: open.id, staffId: demoSeedData.staff[0]!.id, note: 'Call title co' },
      { nowIso: () => '2026-03-13T12:00:00.000Z' },
    )
    const list = buildStaffDocumentRequestFollowUpList({
      documentRequests: marked,
      documents: demoSeedData.documents,
      matters: demoSeedData.matters,
    })
    const item = list.items.find((i) => i.requestId === open.id)
    expect(item).toBeTruthy()
    expect(item!.internalFollowUpNote).toBe('Call title co')
    expect(item!.markedAt).toBe('2026-03-13T12:00:00.000Z')
  })
})
