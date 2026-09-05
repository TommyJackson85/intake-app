/**
 * Staff **Needs follow-up** — neutral internal signal on an ordinary document request.
 *
 * Staff-only operational flag/note after receipt workflow steps. Does not change client portal
 * status labels, and does not touch Condo Diligence / AML / FinCEN workflows.
 */
import type {
  DemoDocument,
  DemoDocumentRequest,
  DemoMatter,
  DemoStaffProfile,
  DocumentRequestFollowUp,
} from '@/lib/demo/types'
import { getFulfilledRequestDocumentName } from '@/lib/demo/demoDocumentRequest'
import {
  getDocumentRequestReceiptReviewPresentation,
  normalizeDocumentRequestReceiptReview,
} from '@/lib/demo/staffDocumentRequestReceiptReview'

export type DocumentRequestFollowUpStatus = 'none' | 'needs_follow_up'

export type { DocumentRequestFollowUp }

export type NormalizedDocumentRequestFollowUp = {
  status: DocumentRequestFollowUpStatus
  note: string
  markedById: string | null
  markedByName: string | null
  markedAt: string | null
}

export type DocumentRequestFollowUpPresentation = {
  status: DocumentRequestFollowUpStatus
  statusLabel: string
  detailLabel: string
  note: string
  canMarkNeedsFollowUp: boolean
  canClearNeedsFollowUp: boolean
}

const NONE_FOLLOW_UP: NormalizedDocumentRequestFollowUp = {
  status: 'none',
  note: '',
  markedById: null,
  markedByName: null,
  markedAt: null,
}

/** Normalize raw/legacy follow-up payloads to a stable internal shape. */
export function normalizeDocumentRequestFollowUp(raw: unknown): NormalizedDocumentRequestFollowUp {
  if (!raw || typeof raw !== 'object') return { ...NONE_FOLLOW_UP }
  const value = raw as DocumentRequestFollowUp
  const status: DocumentRequestFollowUpStatus =
    value.status === 'needs_follow_up' ? 'needs_follow_up' : 'none'
  const note = typeof value.note === 'string' ? value.note.trim() : ''
  const markedById =
    typeof value.markedById === 'string' && value.markedById.trim().length > 0
      ? value.markedById.trim()
      : null
  const markedByName =
    typeof value.markedByName === 'string' && value.markedByName.trim().length > 0
      ? value.markedByName.trim()
      : null
  const markedAt =
    typeof value.markedAt === 'string' && value.markedAt.trim().length > 0
      ? value.markedAt.trim()
      : null

  if (status === 'none') {
    return {
      status: 'none',
      note,
      markedById: null,
      markedByName: null,
      markedAt: null,
    }
  }

  return {
    status,
    note,
    markedById,
    markedByName,
    markedAt,
  }
}

/** Ordinary document requests on an active matter may carry the staff follow-up signal. */
export function isEligibleDocumentRequestForFollowUp(
  request: DemoDocumentRequest | null | undefined,
  matters: DemoMatter[],
): boolean {
  if (!request) return false
  const matter = matters.find((m) => m.id === request.matter_id && !m.deletedAt)
  return Boolean(matter)
}

export function canMarkDocumentRequestNeedsFollowUp(input: {
  request: DemoDocumentRequest | null | undefined
  matters: DemoMatter[]
  staffId: string
}): boolean {
  if (!input.staffId.trim()) return false
  if (!isEligibleDocumentRequestForFollowUp(input.request, input.matters)) return false
  const current = normalizeDocumentRequestFollowUp(input.request?.staff_follow_up)
  return current.status !== 'needs_follow_up'
}

export function canClearDocumentRequestNeedsFollowUp(input: {
  request: DemoDocumentRequest | null | undefined
  matters: DemoMatter[]
}): boolean {
  if (!isEligibleDocumentRequestForFollowUp(input.request, input.matters)) return false
  const current = normalizeDocumentRequestFollowUp(input.request?.staff_follow_up)
  return current.status === 'needs_follow_up'
}

export function getDocumentRequestFollowUpPresentation(
  followUp: DocumentRequestFollowUp | NormalizedDocumentRequestFollowUp | null | undefined,
): DocumentRequestFollowUpPresentation {
  const normalized = normalizeDocumentRequestFollowUp(followUp)
  if (normalized.status === 'needs_follow_up') {
    const who = normalized.markedByName || 'Staff'
    const when = normalized.markedAt ? ` at ${normalized.markedAt}` : ''
    return {
      status: 'needs_follow_up',
      statusLabel: 'Needs follow-up',
      detailLabel: `Marked by ${who}${when}. Internal only — not shown on the client portal.`,
      note: normalized.note,
      canMarkNeedsFollowUp: false,
      canClearNeedsFollowUp: true,
    }
  }
  return {
    status: 'none',
    statusLabel: 'No follow-up',
    detailLabel: 'No internal follow-up signal on this request.',
    note: normalized.note,
    canMarkNeedsFollowUp: true,
    canClearNeedsFollowUp: false,
  }
}

export function markDocumentRequestNeedsFollowUp(
  matters: DemoMatter[],
  documentRequests: DemoDocumentRequest[],
  staff: DemoStaffProfile[],
  input: { requestId: string; staffId: string; note?: string },
  options?: { nowIso?: () => string },
): DemoDocumentRequest[] {
  const requestId = input.requestId.trim()
  const staffId = input.staffId.trim()
  if (!requestId || !staffId) return documentRequests

  const request = documentRequests.find((r) => r.id === requestId)
  if (
    !canMarkDocumentRequestNeedsFollowUp({
      request,
      matters,
      staffId,
    })
  ) {
    return documentRequests
  }

  const actor = staff.find((s) => s.id === staffId)
  const nowIso = options?.nowIso ?? (() => new Date().toISOString())
  const note = typeof input.note === 'string' ? input.note.trim() : ''
  let changed = false
  const next = documentRequests.map((r) => {
    if (r.id !== requestId) return r
    changed = true
    return {
      ...r,
      staff_follow_up: {
        status: 'needs_follow_up' as const,
        note,
        markedById: staffId,
        markedByName: actor?.full_name ?? 'Staff',
        markedAt: nowIso(),
      },
    }
  })
  return changed ? next : documentRequests
}

export function clearDocumentRequestNeedsFollowUp(
  matters: DemoMatter[],
  documentRequests: DemoDocumentRequest[],
  input: { requestId: string },
): DemoDocumentRequest[] {
  const requestId = input.requestId.trim()
  if (!requestId) return documentRequests
  const request = documentRequests.find((r) => r.id === requestId)
  if (!canClearDocumentRequestNeedsFollowUp({ request, matters })) {
    return documentRequests
  }
  let changed = false
  const next = documentRequests.map((r) => {
    if (r.id !== requestId) return r
    changed = true
    return {
      ...r,
      staff_follow_up: { ...NONE_FOLLOW_UP },
    }
  })
  return changed ? next : documentRequests
}

export type DocumentRequestFollowUpDetailPresentation = {
  matterLabel: string
  requestLabel: string
  receiptReviewLabel: string
  linkedClientUploadLabel: string | null
  uploadedAt: string | null
  /** Staff-only internal follow-up note (from staff_follow_up.note). */
  internalFollowUpNote: string
  followUp: DocumentRequestFollowUpPresentation
  canMarkNeedsFollowUp: boolean
  canClearNeedsFollowUp: boolean
}

/**
 * Staff detail labels for Needs follow-up context: matter, request, receipt review,
 * linked client upload, uploaded time, and internal follow-up note.
 * Reuses eligibility / presentation / normalize helpers; deny-by-default when ineligible.
 */
export function getDocumentRequestFollowUpDetailPresentation(input: {
  request: DemoDocumentRequest | null | undefined
  documents: DemoDocument[]
  matters: DemoMatter[]
  staffId?: string
}): DocumentRequestFollowUpDetailPresentation | null {
  const request = input.request
  if (!isEligibleDocumentRequestForFollowUp(request, input.matters) || !request) {
    return null
  }

  const matter = input.matters.find((m) => m.id === request.matter_id && !m.deletedAt)
  if (!matter) return null

  const followUp = getDocumentRequestFollowUpPresentation(
    normalizeDocumentRequestFollowUp(request.staff_follow_up),
  )
  const receipt = normalizeDocumentRequestReceiptReview(request, input.documents)
  const receiptPresentation = getDocumentRequestReceiptReviewPresentation(receipt)

  const linkedId =
    (typeof request.staff_receipt_reviewed_document_id === 'string' &&
    request.staff_receipt_reviewed_document_id.trim().length > 0
      ? request.staff_receipt_reviewed_document_id
      : null) ??
    (typeof request.fulfilled_document_id === 'string' && request.fulfilled_document_id.trim().length > 0
      ? request.fulfilled_document_id
      : null)
  const linkedDoc = linkedId ? input.documents.find((d) => d.id === linkedId && !d.deletedAt) : null

  const matterLabel = matter.file_id
  const requestLabel = request.title
  const receiptReviewLabel =
    receipt.status === 'reviewed' ||
    (typeof request.staff_receipt_acknowledged_at === 'string' &&
      request.staff_receipt_acknowledged_at.trim().length > 0)
      ? 'Receipt review recorded'
      : receiptPresentation.statusLabel
  const linkedClientUploadLabel =
    getFulfilledRequestDocumentName(request, input.documents) ?? linkedDoc?.name ?? null
  const uploadedAt = linkedDoc?.uploaded_at ?? null

  const staffId = (input.staffId ?? '').trim()
  const canMarkNeedsFollowUp = canMarkDocumentRequestNeedsFollowUp({
    request,
    matters: input.matters,
    staffId: staffId || 'staff',
  })
  // When staffId is omitted, still surface canMark from presentation flags without a fake id:
  const canMark =
    staffId.length > 0
      ? canMarkNeedsFollowUp
      : followUp.canMarkNeedsFollowUp && isEligibleDocumentRequestForFollowUp(request, input.matters)

  return {
    matterLabel,
    requestLabel,
    receiptReviewLabel,
    linkedClientUploadLabel,
    uploadedAt,
    internalFollowUpNote: followUp.note,
    followUp,
    canMarkNeedsFollowUp: canMark,
    canClearNeedsFollowUp: canClearDocumentRequestNeedsFollowUp({
      request,
      matters: input.matters,
    }),
  }
}
