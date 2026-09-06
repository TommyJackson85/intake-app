/**
 * Staff **Reactivate client document request** — restore a cancelled ordinary request before upload/workflow.
 *
 * This will restore the client document request as active for the selected matter. It may appear again
 * in the client portal through existing access rules. This does not notify the client, create a task,
 * or make a legal, compliance, or document-sufficiency determination. Deny-by-default. Does not touch
 * Condo Diligence / AML / FinCEN.
 */
import {
  getClientDocumentRequestLifecyclePresentation,
  isActiveClientDocumentRequest,
  normalizeClientDocumentRequestLifecycle,
  type NormalizedClientDocumentRequestLifecycle,
} from '@/lib/demo/staffCancelClientDocumentRequest'
import type {
  DemoDocumentRequest,
  DemoMatter,
  DemoStaffProfile,
} from '@/lib/demo/types'

/** Staff reactivate draft — request id + acting staff. */
export type ClientDocumentRequestReactivateDraft = {
  requestId: string
  staffId: string
}

export type NormalizedClientDocumentRequestReactivateDraft = {
  requestId: string
  staffId: string
  staffName: string
}

export type ClientDocumentRequestReactivateDraftValidation =
  | { ok: true; draft: NormalizedClientDocumentRequestReactivateDraft }
  | { ok: false; error: string }

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
  /** Existing safe document request name (title). */
  requestTitle: string | null
  /** Existing safe current lifecycle state display. */
  currentStateLabel: 'Cancelled' | null
  lifecycleStatus: 'active' | 'cancelled' | null
}

/**
 * Deny-by-default: active matter, open + unfulfilled, lifecycle currently cancelled.
 */
export function isEligibleClientDocumentRequestForReactivation(
  request: DemoDocumentRequest | null | undefined,
  matters: DemoMatter[],
): boolean {
  if (!request) return false
  if (request.status !== 'open') return false
  if (request.fulfilled_document_id) return false
  if (isActiveClientDocumentRequest(request)) return false
  const lifecycle = getClientDocumentRequestLifecyclePresentation(request)
  if (lifecycle.status !== 'cancelled') return false
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
 * Staff reactivate confirmation preview. Reuses canReactivateClientDocumentRequest; deny-by-default.
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
      ? 'This will restore the client document request as active for the selected matter. It may appear again in the client portal through existing access rules. This does not notify the client, create a task, or make a legal, compliance, or document-sufficiency determination.'
      : 'Reactivate client document request is unavailable unless the request is cancelled, open, unfulfilled, and on an active matter.',
    requestId: request?.id ?? null,
    matterId: matterActive ? matter!.id : null,
    matterLabel: matterActive ? matter!.file_id : null,
    matterFileId: matterActive ? matter!.file_id : null,
    clientLabel,
    requestTitle: request?.title ?? null,
    currentStateLabel: lifecycle.status === 'cancelled' ? 'Cancelled' : null,
    lifecycleStatus: request ? lifecycle.status : null,
  }
}

/**
 * Validate reactivate draft (request + acting staff). Deny-by-default.
 */
export function validateClientDocumentRequestReactivateDraft(input: {
  draft: ClientDocumentRequestReactivateDraft
  documentRequests: DemoDocumentRequest[]
  matters: DemoMatter[]
  staff: DemoStaffProfile[]
}): ClientDocumentRequestReactivateDraftValidation {
  const requestId = input.draft.requestId.trim()
  const staffId = input.draft.staffId.trim()
  if (!requestId) return { ok: false, error: 'Select a document request.' }
  if (!staffId) return { ok: false, error: 'Select who is reactivating.' }

  const request = input.documentRequests.find((r) => r.id === requestId)
  if (!isEligibleClientDocumentRequestForReactivation(request, input.matters)) {
    return {
      ok: false,
      error:
        'Reactivate client document request is unavailable unless the request is cancelled, open, unfulfilled, and on an active matter.',
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

/** Build active lifecycle patch for a validated reactivate. */
export function createClientDocumentRequestReactivationPatch(
  _draft?: NormalizedClientDocumentRequestReactivateDraft,
): NormalizedClientDocumentRequestLifecycle {
  return {
    status: 'active',
    cancelledAt: null,
    cancelledById: null,
    cancelledByName: null,
  }
}

/**
 * Apply reactivate: sets lifecycle to active only.
 * Returns the same array reference when denied or already active.
 */
export function applyReactivateClientDocumentRequest(
  documentRequests: DemoDocumentRequest[],
  matters: DemoMatter[],
  staff: DemoStaffProfile[],
  draft: ClientDocumentRequestReactivateDraft,
): DemoDocumentRequest[] {
  const validation = validateClientDocumentRequestReactivateDraft({
    draft,
    documentRequests,
    matters,
    staff,
  })
  if (!validation.ok) return documentRequests

  const index = documentRequests.findIndex((r) => r.id === validation.draft.requestId)
  if (index < 0) return documentRequests

  const current = documentRequests[index]!
  const lifecycle = createClientDocumentRequestReactivationPatch(validation.draft)
  const existing = normalizeClientDocumentRequestLifecycle(current.lifecycle)
  if (existing.status === 'active') return documentRequests

  const next = documentRequests.slice()
  next[index] = {
    ...current,
    lifecycle,
  }
  return next
}
