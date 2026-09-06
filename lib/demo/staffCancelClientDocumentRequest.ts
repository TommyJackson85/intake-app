/**
 * Staff **Cancel client document request** — retire an ordinary request before upload/workflow starts.
 *
 * Sets lifecycle to cancelled so the request is no longer active for client upload or pre-upload
 * staff edits. Does not change matter, client, open/fulfilled status, upload links, receipt review,
 * follow-up state, or any internal review workflow fields. Deny-by-default.
 * Does not touch Condo Diligence / AML / FinCEN workflows.
 */
import {
  getClientDocumentRequestStatusLabel,
  type ClientDocumentRequestStatusLabel,
} from '@/lib/demo/clientDocumentRequestStatus'
import type {
  ClientDocumentRequestLifecycle,
  DemoDocumentRequest,
  DemoMatter,
  DemoStaffProfile,
} from '@/lib/demo/types'

export type NormalizedClientDocumentRequestLifecycle = {
  status: 'active' | 'cancelled'
  cancelledAt: string | null
  cancelledById: string | null
  cancelledByName: string | null
}

const ACTIVE_LIFECYCLE: NormalizedClientDocumentRequestLifecycle = {
  status: 'active',
  cancelledAt: null,
  cancelledById: null,
  cancelledByName: null,
}

/** Staff cancel draft — request id + acting staff. */
export type ClientDocumentRequestCancelDraft = {
  requestId: string
  staffId: string
}

export type NormalizedClientDocumentRequestCancelDraft = {
  requestId: string
  staffId: string
  staffName: string
}

export type ClientDocumentRequestCancelDraftValidation =
  | { ok: true; draft: NormalizedClientDocumentRequestCancelDraft }
  | { ok: false; error: string }

export type ClientDocumentRequestCancelContext = {
  canCancel: boolean
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
}

/** Normalize raw/legacy lifecycle payloads; missing values default to active. */
export function normalizeClientDocumentRequestLifecycle(
  raw: ClientDocumentRequestLifecycle | null | undefined | unknown,
): NormalizedClientDocumentRequestLifecycle {
  if (!raw || typeof raw !== 'object') return { ...ACTIVE_LIFECYCLE }
  const value = raw as ClientDocumentRequestLifecycle
  const status: 'active' | 'cancelled' = value.status === 'cancelled' ? 'cancelled' : 'active'
  if (status === 'active') return { ...ACTIVE_LIFECYCLE }

  const cancelledAt =
    typeof value.cancelledAt === 'string' && value.cancelledAt.trim().length > 0
      ? value.cancelledAt.trim()
      : null
  const cancelledById =
    typeof value.cancelledById === 'string' && value.cancelledById.trim().length > 0
      ? value.cancelledById.trim()
      : null
  const cancelledByName =
    typeof value.cancelledByName === 'string' && value.cancelledByName.trim().length > 0
      ? value.cancelledByName.trim()
      : null

  return {
    status: 'cancelled',
    cancelledAt,
    cancelledById,
    cancelledByName,
  }
}

export function isClientDocumentRequestLifecycleActive(
  request: DemoDocumentRequest | null | undefined,
): boolean {
  if (!request) return false
  return normalizeClientDocumentRequestLifecycle(request.lifecycle).status === 'active'
}

/**
 * Deny-by-default: active matter, open + unfulfilled, lifecycle still active (before upload/workflow).
 */
export function isEligibleClientDocumentRequestForCancel(
  request: DemoDocumentRequest | null | undefined,
  matters: DemoMatter[],
): boolean {
  if (!request) return false
  if (request.status !== 'open') return false
  if (request.fulfilled_document_id) return false
  if (!isClientDocumentRequestLifecycleActive(request)) return false
  const matter = matters.find((m) => m.id === request.matter_id)
  return Boolean(matter && !matter.deletedAt)
}

/** Whether staff may cancel this request. Reuses eligibility; deny-by-default. */
export function canCancelClientDocumentRequest(
  request: DemoDocumentRequest | null | undefined,
  matters: DemoMatter[],
): boolean {
  return isEligibleClientDocumentRequestForCancel(request, matters)
}

/**
 * Staff cancel context for a request. Reuses canCancelClientDocumentRequest; deny-by-default.
 */
export function getClientDocumentRequestCancelContext(input: {
  request: DemoDocumentRequest | null | undefined
  matters: DemoMatter[]
}): ClientDocumentRequestCancelContext {
  const { request, matters } = input
  const canCancel = canCancelClientDocumentRequest(request, matters)
  const matter = request ? matters.find((m) => m.id === request.matter_id) : undefined
  const matterActive = Boolean(matter && !matter.deletedAt)
  const lifecycle = normalizeClientDocumentRequestLifecycle(request?.lifecycle)
  const clientLabel =
    matterActive && matter!.buyer.name.trim().length > 0 ? matter!.buyer.name.trim() : null

  return {
    canCancel,
    actionLabel: 'Cancel client document request',
    detailLabel: canCancel
      ? 'This cancels the client document request before upload. It does not change the matter, client, upload links, receipt review, follow-up state, or any internal review workflow.'
      : 'Cancel client document request is unavailable after upload, after cancel, or for inactive matters.',
    requestId: request?.id ?? null,
    matterId: matterActive ? matter!.id : null,
    matterLabel: matterActive ? matter!.file_id : null,
    matterFileId: matterActive ? matter!.file_id : null,
    clientLabel,
    requestStatusLabel: request ? getClientDocumentRequestStatusLabel(request.status) : null,
    requestTitle: request?.title ?? null,
    lifecycleStatus: request ? lifecycle.status : null,
  }
}

/**
 * Validate cancel draft (request + acting staff). Deny-by-default.
 */
export function validateClientDocumentRequestCancelDraft(input: {
  draft: ClientDocumentRequestCancelDraft
  documentRequests: DemoDocumentRequest[]
  matters: DemoMatter[]
  staff: DemoStaffProfile[]
}): ClientDocumentRequestCancelDraftValidation {
  const requestId = input.draft.requestId.trim()
  const staffId = input.draft.staffId.trim()
  if (!requestId) return { ok: false, error: 'Select a document request.' }
  if (!staffId) return { ok: false, error: 'Select who is cancelling.' }

  const request = input.documentRequests.find((r) => r.id === requestId)
  if (!isEligibleClientDocumentRequestForCancel(request, input.matters)) {
    return {
      ok: false,
      error: 'Cancel client document request is unavailable after upload, after cancel, or for inactive matters.',
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

/** Build cancelled lifecycle patch for a validated cancel. */
export function createClientDocumentRequestCancelLifecyclePatch(
  draft: NormalizedClientDocumentRequestCancelDraft,
  nowIso = new Date().toISOString(),
): NormalizedClientDocumentRequestLifecycle {
  return {
    status: 'cancelled',
    cancelledAt: nowIso,
    cancelledById: draft.staffId,
    cancelledByName: draft.staffName,
  }
}

/**
 * Apply cancel: sets lifecycle to cancelled only.
 * Returns the same array reference when denied or already cancelled with identical metadata.
 */
export function applyCancelClientDocumentRequest(
  documentRequests: DemoDocumentRequest[],
  matters: DemoMatter[],
  staff: DemoStaffProfile[],
  draft: ClientDocumentRequestCancelDraft,
  options?: { nowIso?: () => string },
): DemoDocumentRequest[] {
  const validation = validateClientDocumentRequestCancelDraft({
    draft,
    documentRequests,
    matters,
    staff,
  })
  if (!validation.ok) return documentRequests

  const index = documentRequests.findIndex((r) => r.id === validation.draft.requestId)
  if (index < 0) return documentRequests

  const current = documentRequests[index]!
  const nowIso = options?.nowIso?.() ?? new Date().toISOString()
  const lifecycle = createClientDocumentRequestCancelLifecyclePatch(validation.draft, nowIso)
  const existing = normalizeClientDocumentRequestLifecycle(current.lifecycle)
  if (
    existing.status === 'cancelled' &&
    existing.cancelledById === lifecycle.cancelledById &&
    existing.cancelledByName === lifecycle.cancelledByName
  ) {
    return documentRequests
  }

  const next = documentRequests.slice()
  next[index] = {
    ...current,
    lifecycle,
  }
  return next
}
