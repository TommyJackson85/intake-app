/**
 * Staff **Reactivate client document request** — restore a cancelled ordinary request before upload/workflow.
 *
 * This will reactivate the cancelled client document request. It will appear again as an active request
 * in the client portal. This does not change the matter, client, upload links, request status, receipt
 * review, follow-up state, or any internal review workflow. Deny-by-default. Does not touch Condo
 * Diligence / AML / FinCEN.
 */
import {
  getClientDocumentRequestStatusLabel,
  type ClientDocumentRequestStatusLabel,
} from '@/lib/demo/clientDocumentRequestStatus'
import {
  getClientDocumentRequestLifecyclePresentation,
  isActiveClientDocumentRequest,
  normalizeClientDocumentRequestLifecycle,
  type NormalizedClientDocumentRequestLifecycle,
} from '@/lib/demo/staffCancelClientDocumentRequest'
import type { DemoDocumentRequest, DemoMatter, DemoStaffProfile } from '@/lib/demo/types'

const ACTIVE_LIFECYCLE: NormalizedClientDocumentRequestLifecycle = {
  status: 'active',
  cancelledAt: null,
  cancelledById: null,
  cancelledByName: null,
}

/** Staff reactivate draft — request id + acting staff. */
export type ClientDocumentRequestReactivationDraft = {
  requestId: string
  staffId: string
}

export type NormalizedClientDocumentRequestReactivationDraft = {
  requestId: string
  staffId: string
  staffName: string
}

export type ClientDocumentRequestReactivationDraftValidation =
  | { ok: true; draft: NormalizedClientDocumentRequestReactivationDraft }
  | { ok: false; error: string }

/** Read-only confirmation preview for staff reactivation. */
export type ClientDocumentRequestReactivationPreview = {
  canReactivate: boolean
  actionLabel: string
  detailLabel: string
  requestId: string | null
  matterId: string | null
  /** Existing safe internal matter label (file id). */
  matterLabel: string | null
  matterFileId: string | null
  /** Existing safe client label for the matter (buyer name). */
  clientLabel: string | null
  requestStatusLabel: ClientDocumentRequestStatusLabel | null
  /** Existing safe document request name (title). */
  requestTitle: string | null
  lifecycleStatus: 'active' | 'cancelled' | null
  cancelledAt: string | null
  cancelledByName: string | null
}

/**
 * Deny-by-default: active matter, open + unfulfilled, lifecycle currently cancelled (before upload/workflow).
 */
export function isEligibleClientDocumentRequestForReactivation(
  request: DemoDocumentRequest | null | undefined,
  matters: DemoMatter[],
): boolean {
  if (!request) return false
  if (request.status !== 'open') return false
  if (request.fulfilled_document_id) return false
  if (isActiveClientDocumentRequest(request)) return false
  const matter = matters.find((m) => m.id === request.matter_id)
  return Boolean(matter && !matter.deletedAt)
}

/** Whether staff may reactivate this request. Reuses eligibility; deny-by-default. */
export function canReactivateClientDocumentRequest(
  request: DemoDocumentRequest | null | undefined,
  matters: DemoMatter[],
): boolean {
  return isEligibleClientDocumentRequestForReactivation(request, matters)
}

/**
 * Staff reactivation confirmation preview. Reuses canReactivateClientDocumentRequest; deny-by-default.
 */
export function getClientDocumentRequestReactivationPreview(input: {
  request: DemoDocumentRequest | null | undefined
  matters: DemoMatter[]
}): ClientDocumentRequestReactivationPreview {
  const { request, matters } = input
  const canReactivate = canReactivateClientDocumentRequest(request, matters)
  const matter = request ? matters.find((m) => m.id === request.matter_id) : undefined
  const matterActive = Boolean(matter && !matter.deletedAt)
  const lifecycle = getClientDocumentRequestLifecyclePresentation(request)
  const clientLabel =
    matterActive && matter!.buyer.name.trim().length > 0 ? matter!.buyer.name.trim() : null

  return {
    canReactivate,
    actionLabel: 'Reactivate client document request',
    detailLabel: canReactivate
      ? 'This will reactivate the cancelled client document request. It will appear again as an active request in the client portal. This does not change the matter, client, upload links, request status, receipt review, follow-up state, or any internal review workflow.'
      : 'Reactivate client document request is unavailable unless the request is cancelled, still open, and on an active matter before upload.',
    requestId: request?.id ?? null,
    matterId: matterActive ? matter!.id : null,
    matterLabel: matterActive ? matter!.file_id : null,
    matterFileId: matterActive ? matter!.file_id : null,
    clientLabel,
    requestStatusLabel: request ? getClientDocumentRequestStatusLabel(request.status) : null,
    requestTitle: request?.title ?? null,
    lifecycleStatus: request ? lifecycle.status : null,
    cancelledAt: request ? lifecycle.cancelledAt : null,
    cancelledByName: request ? lifecycle.cancelledByName : null,
  }
}

/**
 * Validate reactivate draft (request + acting staff). Deny-by-default.
 */
export function validateClientDocumentRequestReactivationDraft(input: {
  draft: ClientDocumentRequestReactivationDraft
  documentRequests: DemoDocumentRequest[]
  matters: DemoMatter[]
  staff: DemoStaffProfile[]
}): ClientDocumentRequestReactivationDraftValidation {
  const requestId = input.draft.requestId.trim()
  const staffId = input.draft.staffId.trim()
  if (!requestId) return { ok: false, error: 'Select a document request.' }
  if (!staffId) return { ok: false, error: 'Select who is reactivating.' }

  const request = input.documentRequests.find((r) => r.id === requestId)
  if (!isEligibleClientDocumentRequestForReactivation(request, input.matters)) {
    return {
      ok: false,
      error:
        'Reactivate client document request is unavailable unless the request is cancelled, still open, and on an active matter before upload.',
    }
  }

  const actor = input.staff.find((s) => s.id === staffId)
  if (!actor) return { ok: false, error: 'Select a valid staff member.' }

  return {
    ok: true,
    draft: {
      requestId,
      staffId,
      staffName: actor.full_name,
    },
  }
}

/** Build active lifecycle patch for a validated reactivation. */
export function createClientDocumentRequestReactivationPatch(
  _draft?: NormalizedClientDocumentRequestReactivationDraft,
): NormalizedClientDocumentRequestLifecycle {
  return { ...ACTIVE_LIFECYCLE }
}

/**
 * Apply reactivate: sets lifecycle to active only.
 * Returns the same array reference when denied or already active.
 */
export function applyReactivateClientDocumentRequest(
  documentRequests: DemoDocumentRequest[],
  matters: DemoMatter[],
  staff: DemoStaffProfile[],
  draft: ClientDocumentRequestReactivationDraft,
): DemoDocumentRequest[] {
  const validation = validateClientDocumentRequestReactivationDraft({
    draft,
    documentRequests,
    matters,
    staff,
  })
  if (!validation.ok) return documentRequests

  const index = documentRequests.findIndex((r) => r.id === validation.draft.requestId)
  if (index < 0) return documentRequests

  const current = documentRequests[index]!
  const existing = normalizeClientDocumentRequestLifecycle(current.lifecycle)
  if (existing.status === 'active') return documentRequests

  const lifecycle = createClientDocumentRequestReactivationPatch(validation.draft)
  const next = documentRequests.slice()
  next[index] = {
    ...current,
    lifecycle,
  }
  return next
}

export { isActiveClientDocumentRequest }
