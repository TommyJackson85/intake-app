/**
 * Client portal **Upload document** — tightly scoped action for open document requests.
 *
 * Validates and fulfills an ordinary client-visible document request for the matter
 * resolved by the portal token. Demo mode records file-name metadata only — no real
 * file bytes are stored or transmitted. Does not touch AML / Condo Diligence workspaces.
 */
import {
  tryFulfillDemoDocumentRequest,
  type FulfillDemoDocumentRequestInput,
} from '@/lib/demo/demoDocumentRequest'
import type { BuildDemoDocumentOptions } from '@/lib/demo/demoDocument'
import { isClientDocumentRequestLifecycleActive } from '@/lib/demo/staffCancelClientDocumentRequest'
import type { DemoDocument, DemoDocumentRequest, DemoMatter } from '@/lib/demo/types'

export type ClientDocumentRequestUploadError =
  | 'empty_file_name'
  | 'matter_not_found'
  | 'request_not_found'
  | 'request_not_open'
  | 'matter_mismatch'
  | 'fulfillment_failed'

export type ClientDocumentRequestUploadValidation =
  | { ok: true; fileName: string }
  | { ok: false; error: ClientDocumentRequestUploadError; message: string }

export type ClientDocumentRequestUploadResult =
  | {
      ok: true
      fileName: string
      requestTitle: string
      documents: DemoDocument[]
      documentRequests: DemoDocumentRequest[]
    }
  | {
      ok: false
      error: ClientDocumentRequestUploadError
      message: string
    }

const MESSAGES: Record<ClientDocumentRequestUploadError, string> = {
  empty_file_name: 'Enter a file name to continue.',
  matter_not_found: 'This portal link is invalid or no longer active.',
  request_not_found: 'That document request could not be found.',
  request_not_open: 'This document request is no longer awaiting upload.',
  matter_mismatch: 'That document request does not belong to this matter.',
  fulfillment_failed: 'Upload could not be completed. Please try again.',
}

/** Trim + require a non-empty client file name (demo metadata only). */
export function validateClientDocumentUploadFileName(raw: string): ClientDocumentRequestUploadValidation {
  const fileName = raw.trim()
  if (!fileName) {
    return { ok: false, error: 'empty_file_name', message: MESSAGES.empty_file_name }
  }
  return { ok: true, fileName }
}

/**
 * Whether the client may upload against this request for the portal matter.
 * Open status + same matter only.
 */
export function canClientUploadDocumentRequest(
  request: DemoDocumentRequest | null | undefined,
  matterId: string,
): boolean {
  if (!request) return false
  const id = matterId.trim()
  if (!id) return false
  return (
    request.matter_id === id &&
    request.status === 'open' &&
    isClientDocumentRequestLifecycleActive(request)
  )
}

/**
 * Pure client upload attempt: validates portal matter + open request ownership,
 * then fulfills via the shared demo document-request helper.
 */
export function attemptClientDocumentRequestUpload(
  matters: DemoMatter[],
  documents: DemoDocument[],
  documentRequests: DemoDocumentRequest[],
  input: {
    portalToken: string
    requestId: string
    fileName: string
    uploadedByStaffId: string
  },
  options?: BuildDemoDocumentOptions,
): ClientDocumentRequestUploadResult {
  const nameCheck = validateClientDocumentUploadFileName(input.fileName)
  if (!nameCheck.ok) return nameCheck

  const token = input.portalToken.trim()
  const matter = matters.find((m) => m.portal_token === token && !m.deletedAt)
  if (!matter) {
    return { ok: false, error: 'matter_not_found', message: MESSAGES.matter_not_found }
  }

  const request = documentRequests.find((r) => r.id === input.requestId)
  if (!request) {
    return { ok: false, error: 'request_not_found', message: MESSAGES.request_not_found }
  }
  if (request.matter_id !== matter.id) {
    return { ok: false, error: 'matter_mismatch', message: MESSAGES.matter_mismatch }
  }
  if (request.status !== 'open' || !isClientDocumentRequestLifecycleActive(request)) {
    return { ok: false, error: 'request_not_open', message: MESSAGES.request_not_open }
  }

  const fulfillInput: FulfillDemoDocumentRequestInput = {
    portal_token: token,
    request_id: request.id,
    file_name: nameCheck.fileName,
    uploaded_by_staff_id: input.uploadedByStaffId,
  }

  const result = tryFulfillDemoDocumentRequest(
    matters,
    documents,
    documentRequests,
    fulfillInput,
    options,
  )
  if (!result) {
    return { ok: false, error: 'fulfillment_failed', message: MESSAGES.fulfillment_failed }
  }

  return {
    ok: true,
    fileName: nameCheck.fileName,
    requestTitle: request.title,
    documents: result.documents,
    documentRequests: result.documentRequests,
  }
}
