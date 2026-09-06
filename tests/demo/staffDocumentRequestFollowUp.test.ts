import { describe, expect, it } from 'vitest'
import { demoSeedData } from '@/lib/demo/demoData'
import {
  canClearDocumentRequestNeedsFollowUp,
  canMarkDocumentRequestNeedsFollowUp,
  clearDocumentRequestNeedsFollowUp,
  getDocumentRequestClearFollowUpPresentation,
  getDocumentRequestFollowUpDetailPresentation,
  getDocumentRequestFollowUpPresentation,
  isEligibleDocumentRequestForFollowUp,
  markDocumentRequestNeedsFollowUp,
  normalizeDocumentRequestFollowUp,
} from '@/lib/demo/staffDocumentRequestFollowUp'
import type { DemoDocumentRequest } from '@/lib/demo/types'

const matter = demoSeedData.matters.find((m) => m.id === 'matter-001')!
const staff = demoSeedData.staff

function request(overrides: Partial<DemoDocumentRequest> = {}): DemoDocumentRequest {
  return {
    id: 'req-follow-1',
    matter_id: 'matter-001',
    title: 'Buyer photo ID',
    description: null,
    category: 'Compliance',
    requested_at: '2026-03-05T14:00:00.000Z',
    requested_by_staff_id: 'staff-emma-kline',
    status: 'open',
    fulfilled_document_id: null,
    staff_receipt_acknowledged_at: null,
    staff_receipt_reviewed_by_staff_id: null,
    staff_receipt_reviewed_document_id: null,
    staff_follow_up: {
      status: 'none' as const,
      note: '',
      markedById: null,
      markedByName: null,
      markedAt: null,
    },
    ...overrides,
  }
}

describe('staffDocumentRequestFollowUp', () => {
  it('normalizes raw follow-up payloads', () => {
    expect(normalizeDocumentRequestFollowUp(undefined)).toMatchObject({ status: 'none' })
    expect(
      normalizeDocumentRequestFollowUp({
        status: 'needs_follow_up',
        note: '  Check names  ',
        markedById: 'staff-emma-kline',
        markedByName: 'Emma Kline',
        markedAt: '2026-03-04T11:30:00.000Z',
      }),
    ).toEqual({
      status: 'needs_follow_up',
      note: 'Check names',
      markedById: 'staff-emma-kline',
      markedByName: 'Emma Kline',
      markedAt: '2026-03-04T11:30:00.000Z',
    })
  })

  it('marks and clears Needs follow-up for eligible ordinary requests', () => {
    const open = request()
    expect(isEligibleDocumentRequestForFollowUp(open, [matter])).toBe(true)
    expect(
      canMarkDocumentRequestNeedsFollowUp({
        request: open,
        matters: [matter],
        staffId: 'staff-emma-kline',
      }),
    ).toBe(true)

    const marked = markDocumentRequestNeedsFollowUp(
      [matter],
      [open],
      staff,
      { requestId: open.id, staffId: 'staff-emma-kline', note: 'Need clearer scan' },
      { nowIso: () => '2026-03-12T15:00:00.000Z' },
    )
    expect(marked[0].staff_follow_up).toMatchObject({
      status: 'needs_follow_up',
      note: 'Need clearer scan',
      markedById: 'staff-emma-kline',
      markedAt: '2026-03-12T15:00:00.000Z',
    })
    expect(getDocumentRequestFollowUpPresentation(marked[0].staff_follow_up).statusLabel).toBe(
      'Needs follow-up',
    )
    expect(
      canClearDocumentRequestNeedsFollowUp({
        request: marked[0],
        matters: [matter],
      }),
    ).toBe(true)

    const cleared = clearDocumentRequestNeedsFollowUp([matter], marked, { requestId: open.id })
    expect(cleared[0].staff_follow_up?.status ?? 'none').toBe('none')
  })

  it('includes the seeded Needs follow-up request', () => {
    const seeded = demoSeedData.documentRequests.find((r) => r.id === 'docreq-002')!
    expect(normalizeDocumentRequestFollowUp(seeded.staff_follow_up).status).toBe('needs_follow_up')
    expect(getDocumentRequestFollowUpPresentation(seeded.staff_follow_up).statusLabel).toBe(
      'Needs follow-up',
    )
  })

  it('builds follow-up detail labels including Receipt review recorded', () => {
    const seeded = demoSeedData.documentRequests.find((r) => r.id === 'docreq-002')!
    const detail = getDocumentRequestFollowUpDetailPresentation({
      request: seeded,
      documents: demoSeedData.documents,
      matters: demoSeedData.matters,
      staffId: 'staff-emma-kline',
    })
    expect(detail).not.toBeNull()
    expect(detail!.matterLabel).toBeTruthy()
    expect(detail!.requestLabel).toBe(seeded.title)
    expect(detail!.receiptReviewLabel).toBe('Receipt review recorded')
    expect(detail!.internalFollowUpNote).toBe(
      normalizeDocumentRequestFollowUp(seeded.staff_follow_up).note,
    )
    expect(detail!.followUp.statusLabel).toBe('Needs follow-up')
  })

  it('detail presentation reuses eligibility, canMark, presentation, and normalize helpers', () => {
    const seeded = demoSeedData.documentRequests.find((r) => r.id === 'docreq-002')!
    expect(isEligibleDocumentRequestForFollowUp(seeded, demoSeedData.matters)).toBe(true)
    expect(
      canMarkDocumentRequestNeedsFollowUp({
        request: seeded,
        matters: demoSeedData.matters,
        staffId: 'staff-emma-kline',
      }),
    ).toBe(false)

    const normalized = normalizeDocumentRequestFollowUp(seeded.staff_follow_up)
    const presentation = getDocumentRequestFollowUpPresentation(normalized)
    const detail = getDocumentRequestFollowUpDetailPresentation({
      request: seeded,
      documents: demoSeedData.documents,
      matters: demoSeedData.matters,
      staffId: 'staff-emma-kline',
    })

    expect(detail!.followUp).toEqual(presentation)
    expect(detail!.canMarkNeedsFollowUp).toBe(false)
    expect(detail!.canClearNeedsFollowUp).toBe(true)
    expect(detail!.internalFollowUpNote).toBe(normalized.note)
  })

  it('Clear follow-up presentation is available only while Needs follow-up is set', () => {
    const open = request()
    expect(
      getDocumentRequestClearFollowUpPresentation({
        request: open,
        matters: [matter],
      }).canClearNeedsFollowUp,
    ).toBe(false)

    const marked = markDocumentRequestNeedsFollowUp(
      [matter],
      [open],
      staff,
      { requestId: open.id, staffId: 'staff-emma-kline', note: 'Confirm names' },
      { nowIso: () => '2026-03-14T10:00:00.000Z' },
    )
    const clearPresentation = getDocumentRequestClearFollowUpPresentation({
      request: marked[0],
      matters: [matter],
    })
    expect(clearPresentation.actionLabel).toBe('Clear follow-up')
    expect(clearPresentation.canClearNeedsFollowUp).toBe(true)
    expect(clearPresentation.detailLabel.toLowerCase()).toContain('internal')
    expect(clearPresentation.detailLabel.toLowerCase()).toContain('does not')
    expect(clearPresentation.detailLabel.toLowerCase()).toContain('portal')

    const cleared = clearDocumentRequestNeedsFollowUp([matter], marked, { requestId: open.id })
    expect(normalizeDocumentRequestFollowUp(cleared[0].staff_follow_up).status).toBe('none')
    expect(
      getDocumentRequestClearFollowUpPresentation({
        request: cleared[0],
        matters: [matter],
      }).canClearNeedsFollowUp,
    ).toBe(false)
  })

  it('denies follow-up mark/clear/list eligibility for cancelled requests', () => {
    const cancelled = request({
      lifecycle: {
        status: 'cancelled',
        cancelledAt: '2026-03-01T00:00:00.000Z',
        cancelledById: 'staff-emma-kline',
        cancelledByName: 'Emma Kline',
      },
      staff_follow_up: {
        status: 'needs_follow_up',
        note: 'Was marked before cancel',
        markedById: 'staff-emma-kline',
        markedByName: 'Emma Kline',
        markedAt: '2026-03-01T00:00:00.000Z',
      },
    })
    expect(isEligibleDocumentRequestForFollowUp(cancelled, [matter])).toBe(false)
    expect(
      canMarkDocumentRequestNeedsFollowUp({
        request: cancelled,
        matters: [matter],
        staffId: 'staff-emma-kline',
      }),
    ).toBe(false)
    expect(canClearDocumentRequestNeedsFollowUp({ request: cancelled, matters: [matter] })).toBe(
      false,
    )
  })

})