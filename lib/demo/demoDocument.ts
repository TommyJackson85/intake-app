import type { DemoDocument } from '@/lib/demo/types'
import { buildEngagementLetterDescription } from '@/lib/demo/engagementLetterPreview'

export type AddDemoDocumentInput = {
  matter_id: string
  name: string
  category: DemoDocument['category']
  document_subtype?: string
  description?: string
  document_date?: string
  source?: string
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

type BuildEngagementLetterDraftInput = {
  matter_id: string
  uploaded_by_staff_id: string
  namePrefix?: string
  document_date?: string
  source?: string
  description?: string
  clientName?: string
  attorneyName?: string
  fileReference?: string
  propertyAddress?: string
  scopeSummary?: string
  feeSummary?: string
  exclusionsSummary?: string
  costsSummary?: string
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
  const document_subtype = input.document_subtype?.trim() ?? ''
  const description = input.description?.trim() ?? ''
  const document_date = input.document_date?.trim() ?? ''
  const source = input.source?.trim() ?? ''
  if (!matter_id || !name || !uploaded_by_staff_id) return null

  const idFactory = options?.idFactory ?? (() => `doc-${Date.now()}`)
  const uploaded_at =
    input.uploaded_at ?? options?.nowIso?.() ?? new Date().toISOString()

  return {
    id: input.id ?? idFactory(),
    matter_id,
    name,
    category: input.category,
    document_subtype: document_subtype || null,
    description: description || null,
    document_date: document_date || null,
    source: source || null,
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

/**
 * Builds a metadata-only engagement-letter draft input row for `addDemoDocument`.
 * Returns null when required linkage values are missing.
 */
export function buildEngagementLetterDraftInput(
  input: BuildEngagementLetterDraftInput
): AddDemoDocumentInput | null {
  const matter_id = input.matter_id.trim()
  const uploaded_by_staff_id = input.uploaded_by_staff_id.trim()
  if (!matter_id || !uploaded_by_staff_id) return null
  const namePrefix = input.namePrefix?.trim()
  const clientName = input.clientName?.trim()
  const attorneyName = input.attorneyName?.trim()
  const fileReference = input.fileReference?.trim() || namePrefix
  const propertyAddress = input.propertyAddress?.trim()
  const scopeSummary = input.scopeSummary?.trim()
  const feeSummary = input.feeSummary?.trim()
  const exclusionsSummary = input.exclusionsSummary?.trim()
  const costsSummary = input.costsSummary?.trim()
  return {
    matter_id,
    name: namePrefix ? `${namePrefix} - Engagement Letter (Draft)` : 'Engagement Letter (Draft)',
    category: 'Contract',
    document_subtype: 'Engagement letter',
    description:
      input.description ??
      buildEngagementLetterDescription({
        clientName,
        attorneyName,
        fileReference,
        propertyAddress,
        scopeSummary,
        feeSummary,
        exclusionsSummary,
        costsSummary,
      }),
    document_date: input.document_date ?? '',
    source: input.source ?? 'Matter setup (demo)',
    status: 'draft',
    uploaded_by_staff_id,
  }
}
