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
 * Builds a `DemoDocument` for demo store insertion. Returns null if required strings are empty after trim
 * (`matter_id`, `name`, `uploaded_by_staff_id`).
 */
export function buildDemoDocument(
  input: AddDemoDocumentInput,
  options?: BuildDemoDocumentOptions
): DemoDocument | null {
  const matter_id = input.matter_id.trim()
  const name = input.name.trim()
  const uploaded_by_staff_id = input.uploaded_by_staff_id.trim()
  if (!matter_id || !name || !uploaded_by_staff_id) return null

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
    uploaded_by_staff_id,
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

/**
 * Merges persisted documents with seed data by `id`. Stored rows win on collision (same pattern as
 * `mergeStoredMattersWithSeed`); seed fills any ids not present in storage.
 */
export function mergeStoredDocumentsWithSeed(
  stored: DemoDocument[],
  seed: DemoDocument[]
): DemoDocument[] {
  const map = new Map<string, DemoDocument>()
  for (const d of seed) {
    if (d != null && typeof d.id === 'string') map.set(d.id, d)
  }
  for (const d of stored) {
    if (d != null && typeof d.id === 'string') map.set(d.id, d)
  }
  return Array.from(map.values())
}
