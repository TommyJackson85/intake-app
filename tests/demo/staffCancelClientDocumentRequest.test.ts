import { describe, expect, it } from 'vitest'
import { demoSeedData } from '@/lib/demo/demoData'
import { buildClientDocumentRequestStatusView } from '@/lib/demo/clientDocumentRequestStatus'
import { canClientUploadDocumentRequest } from '@/lib/demo/clientDocumentRequestUpload'
import { canEditClientDocumentRequest } from '@/lib/demo/staffEditClientDocumentRequest'
import {
  applyCancelClientDocumentRequest,
  canCancelClientDocumentRequest,
  createClientDocumentRequestCancellationPatch,
  getClientDocumentRequestCancelContext,
  getClientDocumentRequestLifecyclePresentation,
  isActiveClientDocumentRequest,
  isEligibleClientDocumentRequestForCancellation,
  validateClientDocumentRequestCancelDraft,
} from '@/lib/demo/staffCancelClientDocumentRequest'
import type { DemoDocumentRequest } from '@/lib/demo/types'

const matter = demoSeedData.matters.find((m) => !m.deletedAt)!
const staff = demoSeedData.staff
const staffId = staff[0]!.id
const openRequest = demoSeedData.documentRequests.find(
  (r) => r.matter_id === matter.id && r.status === 'open' && !r.fulfilled_document_id,
)!

function request(overrides: Partial<DemoDocumentRequest> = {}): DemoDocumentRequest {
  return {
    ...openRequest,
    ...overrides,
  }
}

describe('staffCancelClientDocumentRequest helpers', () => {
  it('isEligible / canCancel / isActive gate before upload', () => {
    expect(isActiveClientDocumentRequest(openRequest)).toBe(true)
    expect(isEligibleClientDocumentRequestForCancellation(openRequest, demoSeedData.matters)).toBe(
      true,
    )
    expect(canCancelClientDocumentRequest(openRequest, demoSeedData.matters)).toBe(true)
    expect(isEligibleClientDocumentRequestForCancellation(null, demoSeedData.matters)).toBe(false)
    expect(
      isEligibleClientDocumentRequestForCancellation(
        request({ status: 'fulfilled', fulfilled_document_id: 'doc-001' }),
        demoSeedData.matters,
      ),
    ).toBe(false)

    const cancelled = request({
      lifecycle: {
        status: 'cancelled',
        cancelledAt: '2026-03-01T00:00:00.000Z',
        cancelledById: staffId,
        cancelledByName: 'Emma Kline',
      },
    })
    expect(isActiveClientDocumentRequest(cancelled)).toBe(false)
    expect(canCancelClientDocumentRequest(cancelled, demoSeedData.matters)).toBe(false)
    expect(getClientDocumentRequestLifecyclePresentation(cancelled).statusLabel).toBe('Cancelled')
  })

  it('getClientDocumentRequestCancelContext exposes labels and product wording', () => {
    const ok = getClientDocumentRequestCancelContext({
      request: openRequest,
      matters: demoSeedData.matters,
    })
    expect(ok.canCancel).toBe(true)
    expect(ok.actionLabel).toBe('Cancel client document request')
    expect(ok.detailLabel).toContain('no longer appear as an active request in the client portal')
    expect(ok.detailLabel).toContain('does not delete the request')
    expect(ok.matterLabel).toBe(matter.file_id)
    expect(ok.clientLabel).toBe(matter.buyer.name.trim())
    expect(ok.requestTitle).toBe(openRequest.title)
    expect(ok.lifecycleStatus).toBe('active')
  })

  it('validate + cancellation patch sets lifecycle only and removes portal/upload eligibility', () => {
    const validation = validateClientDocumentRequestCancelDraft({
      draft: { requestId: ` ${openRequest.id} `, staffId: ` ${staffId} ` },
      documentRequests: demoSeedData.documentRequests,
      matters: demoSeedData.matters,
      staff,
    })
    expect(validation.ok).toBe(true)
    if (!validation.ok) return

    expect(
      createClientDocumentRequestCancellationPatch(validation.draft, '2026-03-20T12:00:00.000Z'),
    ).toEqual({
      status: 'cancelled',
      cancelledAt: '2026-03-20T12:00:00.000Z',
      cancelledById: staffId,
      cancelledByName: staff[0]!.full_name,
    })

    const next = applyCancelClientDocumentRequest(
      demoSeedData.documentRequests,
      demoSeedData.matters,
      staff,
      validation.draft,
      { nowIso: () => '2026-03-20T12:00:00.000Z' },
    )
    expect(next).not.toBe(demoSeedData.documentRequests)
    const cancelled = next.find((r) => r.id === openRequest.id)!
    expect(cancelled).toMatchObject({
      id: openRequest.id,
      matter_id: openRequest.matter_id,
      title: openRequest.title,
      status: 'open',
      fulfilled_document_id: null,
      staff_follow_up: openRequest.staff_follow_up,
      lifecycle: {
        status: 'cancelled',
        cancelledAt: '2026-03-20T12:00:00.000Z',
        cancelledById: staffId,
        cancelledByName: staff[0]!.full_name,
      },
    })

    expect(canEditClientDocumentRequest(cancelled, demoSeedData.matters)).toBe(false)
    expect(canCancelClientDocumentRequest(cancelled, demoSeedData.matters)).toBe(false)
    expect(canClientUploadDocumentRequest(cancelled, matter.id)).toBe(false)
    expect(isActiveClientDocumentRequest(cancelled)).toBe(false)

    const portal = buildClientDocumentRequestStatusView({
      matterId: matter.id,
      documentRequests: next,
      documents: demoSeedData.documents,
    })
    expect(portal.rows.some((r) => r.id === openRequest.id)).toBe(false)
  })
})
