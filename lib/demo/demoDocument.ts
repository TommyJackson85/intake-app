import type { DemoDocument } from '@/lib/demo/types'

export type AddDemoDocumentInput = {
  matter_id: string
  name: string
  category: DemoDocument['category']
  status: DemoDocument['status']
  uploaded_by_staff_id: string
  /** For tests or deterministic replays */
  uploaded_at?: string
  id?: string
}

export type BuildDemoDocumentOptions = {
  idFactory?: () => string
  nowIso?: () => string
}

/**
 * Builds a `DemoDocument` for demo store insertion. Returns null if required strings are empty after trim.
 */
export function buildDemoDocument(
  input: AddDemoDocumentInput,
  options?: BuildDemoDocumentOptions
): DemoDocument | null {
  const matter_id = input.matter_id.trim()
  const name = input.name.trim()
  if (!matter_id || !name) return null

  const idFactory = options?.idFactory ?? (() => `doc-${Date.now()}`)
  const uploaded_at =
    input.uploaded_at ?? options?.nowIso?.() ?? new Date().toISOString()

  return {
    id: input.id ?? idFactory(),
    matter_id,
    name,
    category: input.category,
    status: input.status,
    uploaded_at,
    uploaded_by_staff_id: input.uploaded_by_staff_id,
    deletedAt: null,
  }
}

/**
 * Appends a document built from `input` when {@link buildDemoDocument} succeeds.
 * Returns the same `documents` reference when the input is invalid (no new row).
 */
export function appendDemoDocumentIfValid(
  documents: DemoDocument[],
  input: AddDemoDocumentInput,
  options?: BuildDemoDocumentOptions
): DemoDocument[] {
  const next = buildDemoDocument(input, options)
  if (!next) return documents
  return [...documents, next]
}
