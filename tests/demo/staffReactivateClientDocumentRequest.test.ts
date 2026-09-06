import { describe, expect, it } from 'vitest'
import { demoSeedData } from '@/lib/demo/demoData'
import { buildClientDocumentRequestStatusView } from '@/lib/demo/clientDocumentRequestStatus'
import { canClientUploadDocumentRequest } from '@/lib/demo/clientDocumentRequestUpload'
import { canCancelClientDocumentRequest } from '@/lib/demo/staffCancelClientDocumentRequest'
import { canEditClientDocumentRequest } from '@/lib/demo/staffEditClientDocumentRequest'
import {
  applyReactivateClientDocumentRequest,
  canReactivateClientDocumentRequest,
  createClientDocumentRequestReactivationPatch,
  getClientDocumentRequestReactivationPreview,
  isActiveClientDocumentRequest,
  isEligibleClientDocumentRequestForReactivation,
  validateClientDocumentRequestReactivationDraft,
} from '@/lib/demo/staffReactivateClientDocumentRequest'
import type { DemoDocumentRequest } from '@/lib/demo/types'

const matter = demoSeedData.matters.find((m) => !m.deletedAt)!
const staff = demoSeedData.staff
const staffId = staff[0]!.id
const openRequest = demoSeedData.documentRequests.find(
  (r) => r.matter_id === matter.id && r.status === 'open' && !r.fulfilled_document_id,
)!

const cancelledLifecycle = {
  status: 'cancelled' as const,
  cancelledAt: '2026-03-01T00:00:00.000Z',
  cancelledById: staffId,
  cancelledByName: staff[0]!.full_name,
}

function request(overrides: Partial<DemoDocumentRequest> = {}): DemoDocumentRequest {
  return {
    ...openRequest,
    ...overrides,
  }
}

describe('staffReactivateClientDocumentRequest helpers', () => {
  it('isEligible / canReactivate / isActive gate cancelled open requests only', () => {
    expect(isActiveClientDocumentRequest(openRequest)).toBe(true)
    expect(isEligibleClientDocumentRequestForReactivation(openRequest, demoSeedData.matters)).toBe(
      false,
    )
    expect(canReactivateClientDocumentRequest(openRequest, demoSeedData.matters)).toBe(false)
    expect(isEligibleClientDocumentRequestForReactivation(null, demoSeedData.matters)).toBe(false)

    const cancelled = request({ lifecycle: cancelledLifecycle })
    expect(isActiveClientDocumentRequest(cancelled)).toBe(false)
    expect(isEligibleClientDocumentRequestForReactivation(cancelled, demoSeedData.matters)).toBe(
      true,
    )
    expect(canReactivateClientDocumentRequest(cancelled, demoSeedData.matters)).toBe(true)

    expect(
      isEligibleClientDocumentRequestForReactivation(
        request({
          status: 'fulfilled',
          fulfilled_document_id: 'doc-001',
          lifecycle: cancelledLifecycle,
        }),
        demoSeedData.matters,
      ),
    ).toBe(false)

    const deletedMatter = { ...matter, deletedAt: '2026-01-01T00:00:00.000Z' }
    expect(isEligibleClientDocumentRequestForReactivation(cancelled, [deletedMatter])).toBe(false)
  })

  it('getClientDocumentRequestReactivationPreview exposes labels and product wording', () => {
    const cancelled = request({ lifecycle: cancelledLifecycle })
    const ok = getClientDocumentRequestReactivationPreview({
      request: cancelled,
      matters: demoSeedData.matters,
    })
    expect(ok.canReactivate).toBe(true)
    expect(ok.actionLabel).toBe('Reactivate client document request')
    expect(ok.detailLabel).toContain('appear again as an active request in the client portal')
    expect(ok.detailLabel).toContain('does not change the matter')
    expect(ok.matterLabel).toBe(matter.file_id)
    expect(ok.clientLabel).toBe(matter.buyer.name.trim())
    expect(ok.requestTitle).toBe(openRequest.title)
    expect(ok.lifecycleStatus).toBe('cancelled')
    expect(ok.cancelledByName).toBe(staff[0]!.full_name)

    const denied = getClientDocumentRequestReactivationPreview({
      request: openRequest,
      matters: demoSeedData.matters,
    })
    expect(denied.canReactivate).toBe(false)
    expect(denied.detailLabel).toContain('unavailable')
  })

  it('validate + reactivation patch sets lifecycle active and restores portal/upload eligibility', () => {
    const cancelled = request({ lifecycle: cancelledLifecycle })
    const documentRequests = demoSeedData.documentRequests.map((r) =>
      r.id === openRequest.id ? cancelled : r,
    )

    const validation = validateClientDocumentRequestReactivationDraft({
      draft: { requestId: ` ${openRequest.id} `, staffId: ` ${staffId} ` },
      documentRequests,
      matters: demoSeedData.matters,
      staff,
    })
    expect(validation.ok).toBe(true)
    if (!validation.ok) return

    expect(createClientDocumentRequestReactivationPatch(validation.draft)).toEqual({
      status: 'active',
      cancelledAt: null,
      cancelledById: null,
      cancelledByName: null,
    })

    const next = applyReactivateClientDocumentRequest(
      documentRequests,
      demoSeedData.matters,
      staff,
      validation.draft,
    )
    expect(next).not.toBe(documentRequests)
    const reactivated = next.find((r) => r.id === openRequest.id)!
    expect(reactivated).toMatchObject({
      id: openRequest.id,
      matter_id: openRequest.matter_id,
      title: openRequest.title,
      status: 'open',
      fulfilled_document_id: null,
      staff_follow_up: openRequest.staff_follow_up,
      lifecycle: {
        status: 'active',
        cancelledAt: null,
        cancelledById: null,
        cancelledByName: null,
      },
    })

    expect(isActiveClientDocumentRequest(reactivated)).toBe(true)
    expect(canEditClientDocumentRequest(reactivated, demoSeedData.matters)).toBe(true)
    expect(canCancelClientDocumentRequest(reactivated, demoSeedData.matters)).toBe(true)
    expect(canReactivateClientDocumentRequest(reactivated, demoSeedData.matters)).toBe(false)
    expect(canClientUploadDocumentRequest(reactivated, matter.id)).toBe(true)

    const portal = buildClientDocumentRequestStatusView({
      matterId: matter.id,
      documentRequests: next,
      documents: demoSeedData.documents,
    })
    expect(portal.rows.some((r) => r.id === openRequest.id)).toBe(true)
  })
})
