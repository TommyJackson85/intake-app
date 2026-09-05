import { describe, expect, it } from 'vitest'
import {
  CLIENT_PORTAL_DOCUMENT_SOURCE,
  acknowledgeClientUploadReceipt,
  tryFulfillDemoDocumentRequest,
} from '@/lib/demo/demoDocumentRequest'
import { buildStaffClientUploadReceiptQueue } from '@/lib/demo/staffClientUploadReceiptQueue'
import { demoSeedData } from '@/lib/demo/demoData'
import type { DemoDocument, DemoDocumentRequest } from '@/lib/demo/types'

const matter = demoSeedData.matters.find((m) => m.id === 'matter-001')!

function openRequest(overrides: Partial<DemoDocumentRequest> = {}): DemoDocumentRequest {
  return {
    id: 'req-queue-1',
    matter_id: 'matter-001',
    title: 'Buyer photo ID',
    description: null,
    category: 'Compliance',
    requested_at: '2026-03-05T14:00:00.000Z',
    requested_by_staff_id: 'staff-emma-kline',
    status: 'open',
    fulfilled_document_id: null,
    staff_receipt_acknowledged_at: null,
    ...overrides,
  }
}

describe('staffClientUploadReceiptQueue', () => {
  it('includes unacknowledged client-portal fulfillments only', () => {
    const open = openRequest()
    const fulfilled = tryFulfillDemoDocumentRequest(
      [matter],
      [],
      [open],
      {
        portal_token: matter.portal_token,
        request_id: open.id,
        file_name: 'ID.pdf',
        uploaded_by_staff_id: 'staff-emma-kline',
      },
      { idFactory: () => 'doc-client-1', nowIso: () => '2026-03-12T10:00:00.000Z' },
    )
    expect(fulfilled).not.toBeNull()

    const staffDoc: DemoDocument = {
      id: 'doc-staff-1',
      matter_id: 'matter-001',
      name: 'Staff upload.pdf',
      category: 'Contract',
      uploaded_at: '2026-03-11T09:00:00.000Z',
      uploaded_by_staff_id: 'staff-emma-kline',
      status: 'final',
      deletedAt: null,
      source: null,
    }
    const staffFulfilled: DemoDocumentRequest = {
      ...openRequest({ id: 'req-staff', title: 'Staff fulfilled request' }),
      status: 'fulfilled',
      fulfilled_document_id: 'doc-staff-1',
      staff_receipt_acknowledged_at: null,
    }

    const queue = buildStaffClientUploadReceiptQueue({
      documentRequests: [...fulfilled!.documentRequests, staffFulfilled],
      documents: [...fulfilled!.documents, staffDoc],
      matters: [matter],
    })

    expect(queue.pendingCount).toBe(1)
    expect(queue.items[0].requestId).toBe(open.id)
    expect(queue.items[0].documentName).toBe('ID.pdf')
    expect(fulfilled!.documents[0].source).toBe(CLIENT_PORTAL_DOCUMENT_SOURCE)
  })

  it('drops items after staff acknowledgment', () => {
    const open = openRequest()
    const fulfilled = tryFulfillDemoDocumentRequest(
      [matter],
      [],
      [open],
      {
        portal_token: matter.portal_token,
        request_id: open.id,
        file_name: 'Funds.pdf',
        uploaded_by_staff_id: 'staff-emma-kline',
      },
      { idFactory: () => 'doc-client-2', nowIso: () => '2026-03-12T11:00:00.000Z' },
    )!

    const before = buildStaffClientUploadReceiptQueue({
      documentRequests: fulfilled.documentRequests,
      documents: fulfilled.documents,
      matters: [matter],
    })
    expect(before.pendingCount).toBe(1)

    const acknowledged = acknowledgeClientUploadReceipt(fulfilled.documentRequests, open.id, {
      nowIso: () => '2026-03-12T12:00:00.000Z',
    })
    expect(acknowledged[0].staff_receipt_acknowledged_at).toBe('2026-03-12T12:00:00.000Z')

    const after = buildStaffClientUploadReceiptQueue({
      documentRequests: acknowledged,
      documents: fulfilled.documents,
      matters: [matter],
    })
    expect(after.pendingCount).toBe(0)
  })

  it('includes the seeded pending client upload receipt', () => {
    const queue = buildStaffClientUploadReceiptQueue({
      documentRequests: demoSeedData.documentRequests,
      documents: demoSeedData.documents,
      matters: demoSeedData.matters,
    })
    expect(queue.pendingCount).toBeGreaterThanOrEqual(1)
    expect(queue.items.some((i) => i.requestId === 'docreq-003')).toBe(true)
  })
})
