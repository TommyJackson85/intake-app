import { describe, it, expect } from 'vitest'
import { tryFulfillDemoDocumentRequest } from '@/lib/demo/demoDocumentRequest'
import { demoSeedData } from '@/lib/demo/demoData'
import type { DemoDocument, DemoDocumentRequest } from '@/lib/demo/types'

const matter = demoSeedData.matters.find((m) => m.id === 'matter-001')!

const openReq: DemoDocumentRequest = {
  id: 'req-test-1',
  matter_id: 'matter-001',
  title: 'HUD-1',
  description: null,
  category: 'Closing',
  requested_at: '2026-01-01T00:00:00.000Z',
  requested_by_staff_id: 'staff-1',
  status: 'open',
  fulfilled_document_id: null,
  staff_receipt_acknowledged_at: null,
    staff_receipt_reviewed_by_staff_id: null,
    staff_receipt_reviewed_document_id: null,
    staff_follow_up: { status: 'none' as const, note: '', markedById: null, markedByName: null, markedAt: null }
}

describe('tryFulfillDemoDocumentRequest', () => {
  it('returns null when portal token does not match an active matter', () => {
    const r = tryFulfillDemoDocumentRequest(
      [matter],
      [],
      [openReq],
      {
        portal_token: 'wrong',
        request_id: 'req-test-1',
        file_name: 'x.pdf',
        uploaded_by_staff_id: 'staff-emma-kline',
      },
      { idFactory: () => 'd1', nowIso: () => 't' }
    )
    expect(r).toBeNull()
  })

  it('returns null when request is not open or matter mismatch', () => {
    const fulfilled: DemoDocumentRequest = {
      ...openReq,
      status: 'fulfilled',
      fulfilled_document_id: 'd0',
      staff_receipt_acknowledged_at: null,
    staff_receipt_reviewed_by_staff_id: null,
    staff_receipt_reviewed_document_id: null,
    staff_follow_up: { status: 'none' as const, note: '', markedById: null, markedByName: null, markedAt: null }
    }
    expect(
      tryFulfillDemoDocumentRequest(
        [matter],
        [],
        [fulfilled],
        {
          portal_token: matter.portal_token,
          request_id: 'req-test-1',
          file_name: 'x.pdf',
          uploaded_by_staff_id: 'staff-emma-kline',
        },
        { idFactory: () => 'd1', nowIso: () => 't' }
      )
    ).toBeNull()

    expect(
      tryFulfillDemoDocumentRequest(
        [matter],
        [],
        [{ ...openReq, matter_id: 'other' }],
        {
          portal_token: matter.portal_token,
          request_id: 'req-test-1',
          file_name: 'x.pdf',
          uploaded_by_staff_id: 'staff-emma-kline',
        },
        { idFactory: () => 'd1', nowIso: () => 't' }
      )
    ).toBeNull()
  })

  it('returns null when file name is empty after trim', () => {
    expect(
      tryFulfillDemoDocumentRequest(
        [matter],
        [],
        [openReq],
        {
          portal_token: matter.portal_token,
          request_id: 'req-test-1',
          file_name: '   ',
          uploaded_by_staff_id: 'staff-emma-kline',
        },
        { idFactory: () => 'd1', nowIso: () => 't' }
      )
    ).toBeNull()
  })

  it('appends a document and marks request fulfilled with linkage', () => {
    const seedDoc: DemoDocument = {
      id: 'existing',
      matter_id: 'matter-001',
      name: 'old.pdf',
      category: 'Title',
      uploaded_at: '2025-01-01',
      uploaded_by_staff_id: 'staff-1',
      status: 'final',
      deletedAt: null,
    }

    const result = tryFulfillDemoDocumentRequest(
      [matter],
      [seedDoc],
      [openReq],
      {
        portal_token: matter.portal_token,
        request_id: 'req-test-1',
        file_name: ' HUD-1 final.pdf ',
        uploaded_by_staff_id: 'staff-emma-kline',
      },
      { idFactory: () => 'doc-new', nowIso: () => '2026-04-10T12:00:00.000Z' }
    )

    expect(result).not.toBeNull()
    expect(result!.documents).toHaveLength(2)
    expect(result!.documents[1]).toMatchObject({
      id: 'doc-new',
      matter_id: 'matter-001',
      name: 'HUD-1 final.pdf',
      category: 'Closing',
      status: 'draft',
      uploaded_by_staff_id: 'staff-emma-kline',
    })

    const updated = result!.documentRequests[0]
    expect(updated.status).toBe('fulfilled')
    expect(updated.fulfilled_document_id).toBe('doc-new')
  })
})
