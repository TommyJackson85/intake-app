/**
 * Staff **Document requests needing follow-up** — internal visibility list.
 *
 * Surfaces ordinary document requests already marked Needs follow-up. Staff-only and neutral:
 * it does not mean the client was contacted, a reminder/task was sent, the document was rejected,
 * or any legal conclusion was made. Does not change portal labels or Condo Diligence / AML / FinCEN.
 */
import {
  canClearDocumentRequestNeedsFollowUp,
  getDocumentRequestFollowUpDetailPresentation,
  getDocumentRequestFollowUpPresentation,
  isEligibleDocumentRequestForFollowUp,
  normalizeDocumentRequestFollowUp,
} from '@/lib/demo/staffDocumentRequestFollowUp'
import type { DemoDocument, DemoDocumentRequest, DemoMatter } from '@/lib/demo/types'

export type StaffDocumentRequestFollowUpListItem = {
  requestId: string
  requestTitle: string
  requestCategory: DemoDocumentRequest['category']
  matterId: string
  matterFileId: string
  matterLabel: string
  followUpStatusLabel: string
  internalFollowUpNote: string
  markedByName: string | null
  markedAt: string | null
  receiptReviewLabel: string
  linkedClientUploadLabel: string | null
  uploadedAt: string | null
  canClearNeedsFollowUp: boolean
}

export type StaffDocumentRequestFollowUpList = {
  pendingCount: number
  items: StaffDocumentRequestFollowUpListItem[]
  disclaimer: string
}

/**
 * Pure staff list of ordinary document requests currently marked Needs follow-up.
 * Reuses eligibility / normalize / presentation / detail helpers; deny-by-default otherwise.
 */
export function buildStaffDocumentRequestFollowUpList(input: {
  documentRequests: DemoDocumentRequest[]
  documents: DemoDocument[]
  matters: DemoMatter[]
}): StaffDocumentRequestFollowUpList {
  const mattersById = new Map(input.matters.filter((m) => !m.deletedAt).map((m) => [m.id, m]))
  const items: StaffDocumentRequestFollowUpListItem[] = []

  for (const request of input.documentRequests) {
    if (!isEligibleDocumentRequestForFollowUp(request, input.matters)) continue
    const followUp = normalizeDocumentRequestFollowUp(request.staff_follow_up)
    if (followUp.status !== 'needs_follow_up') continue

    const matter = mattersById.get(request.matter_id)
    if (!matter) continue

    const presentation = getDocumentRequestFollowUpPresentation(followUp)
    const detail = getDocumentRequestFollowUpDetailPresentation({
      request,
      documents: input.documents,
      matters: input.matters,
    })

    items.push({
      requestId: request.id,
      requestTitle: request.title,
      requestCategory: request.category,
      matterId: matter.id,
      matterFileId: matter.file_id,
      matterLabel: matter.property?.address?.trim() || matter.file_id,
      followUpStatusLabel: presentation.statusLabel,
      internalFollowUpNote: detail?.internalFollowUpNote ?? followUp.note,
      markedByName: followUp.markedByName,
      markedAt: followUp.markedAt,
      receiptReviewLabel: detail?.receiptReviewLabel ?? 'Not applicable',
      linkedClientUploadLabel: detail?.linkedClientUploadLabel ?? null,
      uploadedAt: detail?.uploadedAt ?? null,
      canClearNeedsFollowUp: canClearDocumentRequestNeedsFollowUp({
        request,
        matters: input.matters,
      }),
    })
  }

  items.sort((a, b) => {
    const aTime = a.markedAt ? new Date(a.markedAt).getTime() : 0
    const bTime = b.markedAt ? new Date(b.markedAt).getTime() : 0
    return bTime - aTime
  })

  return {
    pendingCount: items.length,
    items,
    disclaimer:
      'Internal list of document requests marked Needs follow-up. This is a neutral staff signal after receipt review — it does not mean the client was contacted, a reminder or task was created, the document was rejected, or any legal conclusion was made. Not shown on the client portal.',
  }
}
