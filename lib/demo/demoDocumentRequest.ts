import { appendDemoDocumentIfValid, type BuildDemoDocumentOptions } from '@/lib/demo/demoDocument'
import type { DemoDocument, DemoMatter, DemoDocumentRequest, DemoDocumentRequestStatus } from '@/lib/demo/types'

export type AddDemoDocumentRequestInput = {
  matter_id: string
  title: string
  /** Empty or whitespace-only becomes null on the record */
  description?: string | null
  category: DemoDocument['category']
  requested_by_staff_id: string
  /** Defaults to `open` for new lawyer-side requests */
  status?: DemoDocumentRequestStatus
  requested_at?: string
  id?: string
}

export type BuildDemoDocumentRequestOptions = {
  idFactory?: () => string
  nowIso?: () => string
}

export function buildDemoDocumentRequest(
  input: AddDemoDocumentRequestInput,
  options?: BuildDemoDocumentRequestOptions
): DemoDocumentRequest | null {
  const matter_id = input.matter_id.trim()
  const title = input.title.trim()
  const requested_by_staff_id = input.requested_by_staff_id.trim()
  if (!matter_id || !title || !requested_by_staff_id) return null

  const descRaw = input.description?.trim() ?? ''
  const description = descRaw.length > 0 ? descRaw : null

  const idFactory = options?.idFactory ?? (() => `docreq-${Date.now()}`)
  const requested_at =
    input.requested_at ?? options?.nowIso?.() ?? new Date().toISOString()

  const status: DemoDocumentRequestStatus = input.status === 'fulfilled' ? 'fulfilled' : 'open'

  return {
    id: input.id ?? idFactory(),
    matter_id,
    title,
    description,
    category: input.category,
    requested_at,
    requested_by_staff_id,
    status,
    fulfilled_document_id: null,
  }
}

/** Coerce persisted JSON (e.g. legacy rows without `status`) to the current union. */
export function coerceDemoDocumentRequestStatus(raw: unknown): DemoDocumentRequestStatus {
  return raw === 'fulfilled' ? 'fulfilled' : 'open'
}

/** Ensures `status` is set after reading from localStorage. */
export function withCoercedDocumentRequestStatus(
  r: DemoDocumentRequest & { status?: unknown; fulfilled_document_id?: unknown }
): DemoDocumentRequest {
  const fulfilled =
    typeof r.fulfilled_document_id === 'string' && r.fulfilled_document_id.length > 0
      ? r.fulfilled_document_id
      : null
  return { ...r, status: coerceDemoDocumentRequestStatus(r.status), fulfilled_document_id: fulfilled }
}

export type FulfillDemoDocumentRequestInput = {
  /** Resolves the matter (e.g. client portal link); must match the request’s `matter_id`. */
  portal_token: string
  request_id: string
  file_name: string
  uploaded_by_staff_id: string
}

/**
 * Single-store fulfillment: appends via {@link appendDemoDocumentIfValid} (same `DemoDocument` path as
 * `addDemoDocument` in the demo store), then updates the matching `DemoDocumentRequest`. No separate document list.
 * Returns null if validation fails or the document could not be built.
 */
export function tryFulfillDemoDocumentRequest(
  matters: DemoMatter[],
  documents: DemoDocument[],
  documentRequests: DemoDocumentRequest[],
  input: FulfillDemoDocumentRequestInput,
  options?: BuildDemoDocumentOptions
): { documents: DemoDocument[]; documentRequests: DemoDocumentRequest[] } | null {
  const token = input.portal_token.trim()
  const matter = matters.find((m) => m.portal_token === token && !m.deletedAt)
  if (!matter) return null

  const request = documentRequests.find((r) => r.id === input.request_id)
  if (!request || request.matter_id !== matter.id || request.status !== 'open') return null

  const docInput = {
    matter_id: matter.id,
    name: input.file_name,
    category: request.category,
    status: 'draft' as const,
    uploaded_by_staff_id: input.uploaded_by_staff_id,
    uploaded_at: new Date().toISOString(),
  }

  const documentsNext = appendDemoDocumentIfValid(documents, docInput, options)
  if (documentsNext === documents) return null

  const created = documentsNext[documentsNext.length - 1]

  const documentRequestsNext = documentRequests.map((r) =>
    r.id === request.id
      ? { ...r, status: 'fulfilled' as const, fulfilled_document_id: created.id }
      : r
  )

  return { documents: documentsNext, documentRequests: documentRequestsNext }
}

export function appendDemoDocumentRequestIfValid(
  rows: DemoDocumentRequest[],
  input: AddDemoDocumentRequestInput,
  options?: BuildDemoDocumentRequestOptions
): DemoDocumentRequest[] {
  const next = buildDemoDocumentRequest(input, options)
  if (!next) return rows
  return [...rows, next]
}

/** Resolve the linked fulfilled `DemoDocument` name for display in lawyer UI. */
export function getFulfilledRequestDocumentName(
  request: DemoDocumentRequest,
  documents: DemoDocument[]
): string | null {
  if (request.status !== 'fulfilled' || !request.fulfilled_document_id) return null
  return documents.find((d) => d.id === request.fulfilled_document_id)?.name ?? null
}

export function mergeStoredDocumentRequestsWithSeed(
  stored: DemoDocumentRequest[],
  seed: DemoDocumentRequest[]
): DemoDocumentRequest[] {
  const map = new Map<string, DemoDocumentRequest>()
  for (const r of seed) {
    if (r != null && typeof r.id === 'string') map.set(r.id, r)
  }
  for (const r of stored) {
    if (r != null && typeof r.id === 'string') map.set(r.id, r)
  }
  return Array.from(map.values())
}
