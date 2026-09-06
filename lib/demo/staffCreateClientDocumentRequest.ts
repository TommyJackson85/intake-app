/**
 * Staff **Create client document request** — start of the ordinary client-document lifecycle.
 *
 * Creates a client-visible ordinary document request on an active matter so it appears in the
 * client portal Document Request Status list (Awaiting upload). Deny-by-default.
 * Does not touch Condo Diligence / AML / FinCEN workflows, receipt review, or follow-up signals.
 */
import {
  appendDemoDocumentRequestIfValid,
  type AddDemoDocumentRequestInput,
} from '@/lib/demo/demoDocumentRequest'
import type { DemoDocument, DemoDocumentRequest, DemoMatter, DemoStaffProfile } from '@/lib/demo/types'

const CLIENT_SAFE_CATEGORIES: ReadonlySet<DemoDocument['category']> = new Set([
  'Contract',
  'Title',
  'Closing',
  'Compliance',
  'Post-Closing',
])

/** Staff draft for a new client-visible ordinary document request. */
export type ClientDocumentRequestDraft = {
  matterId: string
  title: string
  description?: string | null
  category: DemoDocument['category']
  staffId: string
}

export type NormalizedClientDocumentRequestDraft = {
  matterId: string
  title: string
  description: string | null
  category: DemoDocument['category']
  staffId: string
}

export type ClientDocumentRequestDraftValidation =
  | { ok: true; draft: NormalizedClientDocumentRequestDraft }
  | { ok: false; error: string }

export type ClientDocumentRequestCreationContext = {
  canCreate: boolean
  actionLabel: string
  detailLabel: string
  matterId: string | null
  matterFileId: string | null
  matterLabel: string | null
  eligibleMatterIds: string[]
}

export type StaffCreateClientDocumentRequestInput = ClientDocumentRequestDraft

/** Deny-by-default: matter must exist and not be deleted. */
export function canCreateClientDocumentRequestForMatter(
  matter: DemoMatter | null | undefined,
): boolean {
  return Boolean(matter && !matter.deletedAt)
}

/**
 * Staff creation context for a matter (or null matter).
 * Reuses canCreateClientDocumentRequestForMatter; deny-by-default.
 */
export function getClientDocumentRequestCreationContext(input: {
  matter: DemoMatter | null | undefined
  matters?: DemoMatter[]
}): ClientDocumentRequestCreationContext {
  const canCreate = canCreateClientDocumentRequestForMatter(input.matter)
  const eligibleMatterIds = (input.matters ?? [])
    .filter((m) => canCreateClientDocumentRequestForMatter(m))
    .map((m) => m.id)

  return {
    canCreate,
    actionLabel: 'Create client document request',
    detailLabel: canCreate
      ? 'Creates a client-visible ordinary document request. The client will see it in portal Document Request Status as Awaiting upload until they upload.'
      : 'Create client document request is unavailable for this matter.',
    matterId: input.matter?.id ?? null,
    matterFileId: input.matter && !input.matter.deletedAt ? input.matter.file_id : null,
    matterLabel:
      input.matter && !input.matter.deletedAt
        ? input.matter.property.address.trim() || input.matter.file_id
        : null,
    eligibleMatterIds,
  }
}

/**
 * True when the draft only carries client-safe ordinary request fields
 * (no internal-only / Condo Diligence / AML payloads).
 */
export function isClientSafeDocumentRequestDraft(
  draft: ClientDocumentRequestDraft | null | undefined,
): boolean {
  if (!draft || typeof draft !== 'object') return false
  if (typeof draft.matterId !== 'string' || !draft.matterId.trim()) return false
  if (typeof draft.title !== 'string') return false
  if (typeof draft.staffId !== 'string') return false
  if (!CLIENT_SAFE_CATEGORIES.has(draft.category)) return false
  if (draft.description != null && typeof draft.description !== 'string') return false

  // Reject accidental internal-only keys on the draft object.
  const keys = Object.keys(draft)
  const allowed = new Set(['matterId', 'title', 'description', 'category', 'staffId'])
  if (keys.some((k) => !allowed.has(k))) return false
  return true
}

/**
 * Validate + normalize a staff draft before create. Deny-by-default.
 */
export function validateClientDocumentRequestDraft(input: {
  draft: ClientDocumentRequestDraft
  matters: DemoMatter[]
  staff: DemoStaffProfile[]
}): ClientDocumentRequestDraftValidation {
  const { draft, matters, staff } = input
  if (!isClientSafeDocumentRequestDraft(draft)) {
    return { ok: false, error: 'Draft is not a client-safe ordinary document request.' }
  }

  const matterId = draft.matterId.trim()
  const title = draft.title.trim()
  const staffId = draft.staffId.trim()
  const description =
    typeof draft.description === 'string' && draft.description.trim().length > 0
      ? draft.description.trim()
      : null

  if (!matterId) return { ok: false, error: 'Select a matter.' }
  if (!title) return { ok: false, error: 'Enter a request title.' }
  if (!staffId) return { ok: false, error: 'Select who is requesting.' }

  const matter = matters.find((m) => m.id === matterId)
  if (!canCreateClientDocumentRequestForMatter(matter)) {
    return { ok: false, error: 'Create client document request is unavailable for this matter.' }
  }
  if (!staff.some((s) => s.id === staffId)) {
    return { ok: false, error: 'Select a valid staff member.' }
  }

  return {
    ok: true,
    draft: {
      matterId,
      title,
      description,
      category: draft.category,
      staffId,
    },
  }
}

/**
 * Build the append payload for an open client-visible ordinary document request.
 * Does not include receipt-review or follow-up fields (those stay at defaults on create).
 */
export function createClientDocumentRequestPayload(
  draft: NormalizedClientDocumentRequestDraft,
): AddDemoDocumentRequestInput {
  return {
    matter_id: draft.matterId,
    title: draft.title,
    description: draft.description,
    category: draft.category,
    requested_by_staff_id: draft.staffId,
    status: 'open',
  }
}

/** Active matters eligible for create (wrapper around canCreateClientDocumentRequestForMatter). */
export function getEligibleMattersForStaffCreateClientDocumentRequest(
  matters: DemoMatter[],
): DemoMatter[] {
  return matters.filter((m) => canCreateClientDocumentRequestForMatter(m)).slice()
}

/**
 * Pure create: validates draft via shared helpers, then appends when allowed.
 * Returns the same array reference when denied.
 */
export function createStaffClientDocumentRequest(
  matters: DemoMatter[],
  documentRequests: DemoDocumentRequest[],
  staff: DemoStaffProfile[],
  input: StaffCreateClientDocumentRequestInput,
  options?: { idFactory?: () => string; nowIso?: () => string },
): DemoDocumentRequest[] {
  const validation = validateClientDocumentRequestDraft({
    draft: input,
    matters,
    staff,
  })
  if (!validation.ok) return documentRequests

  const payload = createClientDocumentRequestPayload(validation.draft)
  const before = documentRequests
  const next = appendDemoDocumentRequestIfValid(documentRequests, payload, {
    idFactory: options?.idFactory,
    nowIso: options?.nowIso,
  })
  return next === before ? documentRequests : next
}
