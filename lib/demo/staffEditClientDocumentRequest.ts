/**
 * Staff **Edit client document request** — correct client-facing request details before upload.
 *
 * This updates client-facing request details (title / description / category) on an open,
 * unfulfilled ordinary document request. It does not change the matter, client, upload links,
 * request status, receipt review, follow-up state, or any internal review workflow.
 * Deny-by-default. Does not touch Condo Diligence / AML / FinCEN workflows.
 */
import {
  getClientDocumentRequestStatusLabel,
  type ClientDocumentRequestStatusLabel,
} from '@/lib/demo/clientDocumentRequestStatus'
import type { DemoDocument, DemoDocumentRequest, DemoMatter } from '@/lib/demo/types'

const CLIENT_SAFE_CATEGORIES: ReadonlySet<DemoDocument['category']> = new Set([
  'Contract',
  'Title',
  'Closing',
  'Compliance',
  'Post-Closing',
])

/** Staff draft for editing client-facing ordinary document request fields. */
export type ClientDocumentRequestEditDraft = {
  requestId: string
  title: string
  description?: string | null
  category: DemoDocument['category']
}

export type NormalizedClientDocumentRequestEditDraft = {
  requestId: string
  title: string
  description: string | null
  category: DemoDocument['category']
}

/** Client-facing field patch only — never includes matter/status/upload/receipt/follow-up. */
export type ClientDocumentRequestEditPatch = {
  title: string
  description: string | null
  category: DemoDocument['category']
}

export type ClientDocumentRequestEditDraftValidation =
  | { ok: true; draft: NormalizedClientDocumentRequestEditDraft }
  | { ok: false; error: string }

export type ClientDocumentRequestEditContext = {
  canEdit: boolean
  actionLabel: string
  detailLabel: string
  requestId: string | null
  matterId: string | null
  /** Existing safe internal matter label (file id). */
  matterLabel: string | null
  matterFileId: string | null
  /** Existing safe client label for the matter (buyer name). */
  clientLabel: string | null
  /** Existing safe client-facing request status display. */
  requestStatusLabel: ClientDocumentRequestStatusLabel | null
  requestTitle: string | null
}

/**
 * Deny-by-default eligibility: active matter, open status, and no fulfilled document (before upload).
 */
export function isEligibleClientDocumentRequestForEdit(
  request: DemoDocumentRequest | null | undefined,
  matters: DemoMatter[],
): boolean {
  if (!request) return false
  if (request.status !== 'open') return false
  if (request.fulfilled_document_id) return false
  const matter = matters.find((m) => m.id === request.matter_id)
  return Boolean(matter && !matter.deletedAt)
}

/**
 * Whether staff may edit client-facing fields on this request.
 * Reuses isEligibleClientDocumentRequestForEdit; deny-by-default.
 */
export function canEditClientDocumentRequest(
  request: DemoDocumentRequest | null | undefined,
  matters: DemoMatter[],
): boolean {
  return isEligibleClientDocumentRequestForEdit(request, matters)
}

/**
 * Staff edit context for a request. Reuses canEditClientDocumentRequest; deny-by-default.
 */
export function getClientDocumentRequestEditContext(input: {
  request: DemoDocumentRequest | null | undefined
  matters: DemoMatter[]
}): ClientDocumentRequestEditContext {
  const { request, matters } = input
  const canEdit = canEditClientDocumentRequest(request, matters)
  const matter = request ? matters.find((m) => m.id === request.matter_id) : undefined
  const matterActive = Boolean(matter && !matter.deletedAt)

  const clientLabel =
    matterActive && matter!.buyer.name.trim().length > 0 ? matter!.buyer.name.trim() : null

  return {
    canEdit,
    actionLabel: 'Edit client document request',
    detailLabel: canEdit
      ? 'This updates client-facing request details. It does not change the matter, client, upload links, request status, receipt review, follow-up state, or any internal review workflow.'
      : 'Edit client document request is unavailable after upload or for inactive matters.',
    requestId: request?.id ?? null,
    matterId: matterActive ? matter!.id : null,
    matterLabel: matterActive ? matter!.file_id : null,
    matterFileId: matterActive ? matter!.file_id : null,
    clientLabel,
    requestStatusLabel: request ? getClientDocumentRequestStatusLabel(request.status) : null,
    requestTitle: request?.title ?? null,
  }
}

/**
 * True when the draft only carries client-safe editable fields
 * (no matter move / status / receipt / follow-up / internal-only keys).
 */
export function isClientSafeDocumentRequestEditDraft(
  draft: ClientDocumentRequestEditDraft | null | undefined,
): boolean {
  if (!draft || typeof draft !== 'object') return false
  if (typeof draft.requestId !== 'string' || !draft.requestId.trim()) return false
  if (typeof draft.title !== 'string') return false
  if (!CLIENT_SAFE_CATEGORIES.has(draft.category)) return false
  if (draft.description != null && typeof draft.description !== 'string') return false

  const keys = Object.keys(draft)
  const allowed = new Set(['requestId', 'title', 'description', 'category'])
  if (keys.some((k) => !allowed.has(k))) return false
  return true
}

/**
 * Validate + normalize a staff edit draft. Deny-by-default.
 */
export function validateClientDocumentRequestEditDraft(input: {
  draft: ClientDocumentRequestEditDraft
  documentRequests: DemoDocumentRequest[]
  matters: DemoMatter[]
}): ClientDocumentRequestEditDraftValidation {
  const { draft, documentRequests, matters } = input
  if (!isClientSafeDocumentRequestEditDraft(draft)) {
    return { ok: false, error: 'Draft is not a client-safe document request edit.' }
  }

  const requestId = draft.requestId.trim()
  const title = draft.title.trim()
  const description =
    typeof draft.description === 'string' && draft.description.trim().length > 0
      ? draft.description.trim()
      : null

  if (!requestId) return { ok: false, error: 'Select a document request.' }
  if (!title) return { ok: false, error: 'Enter a request title.' }

  const request = documentRequests.find((r) => r.id === requestId)
  if (!isEligibleClientDocumentRequestForEdit(request, matters)) {
    return {
      ok: false,
      error: 'Edit client document request is unavailable after upload or for inactive matters.',
    }
  }

  return {
    ok: true,
    draft: {
      requestId,
      title,
      description,
      category: draft.category,
    },
  }
}

/**
 * Build the client-facing field patch from a normalized edit draft.
 * Does not include matter, status, upload links, receipt, or follow-up fields.
 */
export function createClientDocumentRequestEditPatch(
  draft: NormalizedClientDocumentRequestEditDraft,
): ClientDocumentRequestEditPatch {
  return {
    title: draft.title,
    description: draft.description,
    category: draft.category,
  }
}

/**
 * Apply a validated client-facing edit. Preserves matter, status, upload links, and internal workflow fields.
 * Returns the same array reference when denied or when nothing changed.
 */
export function applyClientDocumentRequestEdit(
  documentRequests: DemoDocumentRequest[],
  matters: DemoMatter[],
  draft: ClientDocumentRequestEditDraft,
): DemoDocumentRequest[] {
  const validation = validateClientDocumentRequestEditDraft({
    draft,
    documentRequests,
    matters,
  })
  if (!validation.ok) return documentRequests

  const patch = createClientDocumentRequestEditPatch(validation.draft)
  const index = documentRequests.findIndex((r) => r.id === validation.draft.requestId)
  if (index < 0) return documentRequests

  const current = documentRequests[index]!
  if (
    current.title === patch.title &&
    current.description === patch.description &&
    current.category === patch.category
  ) {
    return documentRequests
  }

  const next = documentRequests.slice()
  next[index] = {
    ...current,
    ...patch,
  }
  return next
}
