import { describe, expect, it } from 'vitest'
import { demoSeedData } from '@/lib/demo/demoData'
import { buildClientDocumentRequestStatusView } from '@/lib/demo/clientDocumentRequestStatus'
import {
  applyClientDocumentRequestEdit,
  canEditClientDocumentRequest,
  createClientDocumentRequestEditPatch,
  getClientDocumentRequestEditContext,
  isClientSafeDocumentRequestEditDraft,
  isEligibleClientDocumentRequestForEdit,
  validateClientDocumentRequestEditDraft,
} from '@/lib/demo/staffEditClientDocumentRequest'
import type { DemoDocumentRequest } from '@/lib/demo/types'

const matter = demoSeedData.matters.find((m) => !m.deletedAt)!
const openRequest = demoSeedData.documentRequests.find(
  (r) => r.matter_id === matter.id && r.status === 'open' && !r.fulfilled_document_id,
)!

function request(overrides: Partial<DemoDocumentRequest> = {}): DemoDocumentRequest {
  return {
    ...openRequest,
    ...overrides,
  }
}

describe('staffEditClientDocumentRequest helpers', () => {
  it('isEligibleClientDocumentRequestForEdit and canEditClientDocumentRequest deny after upload', () => {
    expect(isEligibleClientDocumentRequestForEdit(openRequest, demoSeedData.matters)).toBe(true)
    expect(canEditClientDocumentRequest(openRequest, demoSeedData.matters)).toBe(true)
    expect(isEligibleClientDocumentRequestForEdit(null, demoSeedData.matters)).toBe(false)
    expect(
      isEligibleClientDocumentRequestForEdit(
        request({ status: 'fulfilled', fulfilled_document_id: 'doc-001' }),
        demoSeedData.matters,
      ),
    ).toBe(false)
    expect(
      canEditClientDocumentRequest(request({ fulfilled_document_id: 'doc-001' }), demoSeedData.matters),
    ).toBe(false)

    const deletedMatter = { ...matter, deletedAt: '2026-01-01T00:00:00.000Z' }
    expect(isEligibleClientDocumentRequestForEdit(openRequest, [deletedMatter])).toBe(false)
  })

  it('getClientDocumentRequestEditContext exposes edit labels and read-only matter/client/status', () => {
    const ok = getClientDocumentRequestEditContext({
      request: openRequest,
      matters: demoSeedData.matters,
    })
    expect(ok.canEdit).toBe(true)
    expect(ok.actionLabel).toBe('Edit client document request')
    expect(ok.requestId).toBe(openRequest.id)
    expect(ok.matterId).toBe(matter.id)
    expect(ok.matterLabel).toBe(matter.file_id)
    expect(ok.clientLabel).toBe(matter.buyer.name.trim())
    expect(ok.requestStatusLabel).toBe('Awaiting upload')

    const denied = getClientDocumentRequestEditContext({
      request: null,
      matters: demoSeedData.matters,
    })
    expect(denied.canEdit).toBe(false)
    expect(denied.requestId).toBeNull()
    expect(denied.matterLabel).toBeNull()
    expect(denied.clientLabel).toBeNull()
    expect(denied.requestStatusLabel).toBeNull()
  })

  it('isClientSafeDocumentRequestEditDraft accepts only client-facing edit fields', () => {
    expect(
      isClientSafeDocumentRequestEditDraft({
        requestId: openRequest.id,
        title: 'Updated survey',
        category: 'Title',
      }),
    ).toBe(true)
    expect(
      isClientSafeDocumentRequestEditDraft({
        requestId: openRequest.id,
        title: 'Updated survey',
        category: 'Title',
        // @ts-expect-error matter moves are not client-safe edits
        matterId: 'matter-other',
      }),
    ).toBe(false)
  })

  it('validate + createClientDocumentRequestEditPatch + apply update client-facing fields only', () => {
    const validation = validateClientDocumentRequestEditDraft({
      draft: {
        requestId: ` ${openRequest.id} `,
        title: '  Updated survey  ',
        description: '  New client-facing note  ',
        category: 'Title',
      },
      documentRequests: demoSeedData.documentRequests,
      matters: demoSeedData.matters,
    })
    expect(validation.ok).toBe(true)
    if (!validation.ok) return

    expect(validation.draft).toEqual({
      requestId: openRequest.id,
      title: 'Updated survey',
      description: 'New client-facing note',
      category: 'Title',
    })
    expect(createClientDocumentRequestEditPatch(validation.draft)).toEqual({
      title: 'Updated survey',
      description: 'New client-facing note',
      category: 'Title',
    })

    const next = applyClientDocumentRequestEdit(
      demoSeedData.documentRequests,
      demoSeedData.matters,
      validation.draft,
    )
    expect(next).not.toBe(demoSeedData.documentRequests)
    const edited = next.find((r) => r.id === openRequest.id)!
    // Client-facing fields only — matter, client, upload links, status, receipt, follow-up unchanged.
    expect(edited).toMatchObject({
      id: openRequest.id,
      matter_id: openRequest.matter_id,
      title: 'Updated survey',
      description: 'New client-facing note',
      category: 'Title',
      status: 'open',
      fulfilled_document_id: null,
      requested_by_staff_id: openRequest.requested_by_staff_id,
      requested_at: openRequest.requested_at,
      staff_receipt_acknowledged_at: openRequest.staff_receipt_acknowledged_at,
      staff_receipt_reviewed_by_staff_id: openRequest.staff_receipt_reviewed_by_staff_id,
      staff_receipt_reviewed_document_id: openRequest.staff_receipt_reviewed_document_id,
      staff_follow_up: openRequest.staff_follow_up,
    })

    const portal = buildClientDocumentRequestStatusView({
      matterId: matter.id,
      documentRequests: next,
      documents: demoSeedData.documents,
    })
    expect(
      portal.rows.some(
        (r) =>
          r.id === openRequest.id &&
          r.title === 'Updated survey' &&
          r.statusLabel === 'Awaiting upload',
      ),
    ).toBe(true)
  })

  it('returns the same array when denied or unchanged', () => {
    const denied = applyClientDocumentRequestEdit(
      demoSeedData.documentRequests,
      demoSeedData.matters,
      {
        requestId: openRequest.id,
        title: '',
        category: 'Title',
      },
    )
    expect(denied).toBe(demoSeedData.documentRequests)

    const unchanged = applyClientDocumentRequestEdit(
      demoSeedData.documentRequests,
      demoSeedData.matters,
      {
        requestId: openRequest.id,
        title: openRequest.title,
        description: openRequest.description,
        category: openRequest.category,
      },
    )
    expect(unchanged).toBe(demoSeedData.documentRequests)
  })
})
