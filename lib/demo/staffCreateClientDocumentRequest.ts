/**
 * Staff **Create client document request** — start of the ordinary client-document lifecycle.
 *
 * Creates a client-visible ordinary document request on an active matter so it appears in the
 * client portal Document Request Status list (Awaiting upload). Deny-by-default.
 * Does not touch Condo Diligence / AML / FinCEN workflows, receipt review, or follow-up signals.
 */
import {
  appendDemoDocumentRequestIfValid,
} from '@/lib/demo/demoDocumentRequest'
import type { DemoDocument, DemoDocumentRequest, DemoMatter, DemoStaffProfile } from '@/lib/demo/types'

export type StaffCreateClientDocumentRequestInput = {
  matterId: string
  title: string
  description?: string | null
  category: DemoDocument['category']
  staffId: string
}

export type StaffCreateClientDocumentRequestPresentation = {
  actionLabel: string
  detailLabel: string
  canCreate: boolean
}

/** Active (non-deleted) matters that may receive a client-visible ordinary document request. */
export function getEligibleMattersForStaffCreateClientDocumentRequest(
  matters: DemoMatter[],
): DemoMatter[] {
  return matters.filter((m) => !m.deletedAt).slice()
}

/** Deny-by-default: requires active matter + non-empty staff id. */
export function canStaffCreateClientDocumentRequest(input: {
  matter: DemoMatter | null | undefined
  staffId: string
}): boolean {
  const staffId = input.staffId.trim()
  if (!staffId) return false
  if (!input.matter || input.matter.deletedAt) return false
  return true
}

export function getStaffCreateClientDocumentRequestPresentation(input: {
  matter: DemoMatter | null | undefined
  staffId: string
}): StaffCreateClientDocumentRequestPresentation {
  const canCreate = canStaffCreateClientDocumentRequest(input)
  return {
    actionLabel: 'Create client document request',
    detailLabel: canCreate
      ? 'Creates a client-visible ordinary document request. The client will see it in portal Document Request Status as Awaiting upload until they upload.'
      : 'Create client document request is unavailable for this matter.',
    canCreate,
  }
}

/**
 * Pure create: appends an open client-visible ordinary document request when eligible.
 * Returns the same array reference when denied. Always starts with no follow-up / no receipt review.
 */
export function createStaffClientDocumentRequest(
  matters: DemoMatter[],
  documentRequests: DemoDocumentRequest[],
  staff: DemoStaffProfile[],
  input: StaffCreateClientDocumentRequestInput,
  options?: { idFactory?: () => string; nowIso?: () => string },
): DemoDocumentRequest[] {
  const matterId = input.matterId.trim()
  const staffId = input.staffId.trim()
  const title = input.title.trim()
  if (!matterId || !staffId || !title) return documentRequests

  const matter = matters.find((m) => m.id === matterId)
  if (!canStaffCreateClientDocumentRequest({ matter, staffId })) return documentRequests
  if (!staff.some((s) => s.id === staffId)) return documentRequests

  const before = documentRequests
  const next = appendDemoDocumentRequestIfValid(
    documentRequests,
    {
      matter_id: matterId,
      title,
      description: input.description ?? null,
      category: input.category,
      requested_by_staff_id: staffId,
      status: 'open',
    },
    {
      idFactory: options?.idFactory,
      nowIso: options?.nowIso,
    },
  )
  return next === before ? documentRequests : next
}
