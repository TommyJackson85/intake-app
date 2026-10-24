/**
 * Neutral matter-summary source DTO for AI builders.
 * No imports from `@/lib/demo/*` — adapters map product domains into this shape.
 */

export type MatterSummarySourceTaskStatus = 'not_started' | 'in_progress' | 'completed'

export type MatterSummarySourceTask = {
  title: string
  status: MatterSummarySourceTaskStatus
  deletedAt: string | null
}

export type MatterSummarySourceDocumentStatus = 'draft' | 'reviewed' | 'final'

export type MatterSummarySourceDocument = {
  matterId: string
  status: MatterSummarySourceDocumentStatus
  deletedAt: string | null
}

export type MatterSummarySourceDocumentRequest = {
  matterId: string
  status: string
}

export type MatterSummarySourceTimelineEvent = {
  at: string
  note: string
  deletedAt: string | null
}

export type MatterSummarySourcePartyType = 'individual' | 'entity' | string

export type MatterSummarySource = {
  identity: {
    matterId: string
    fileId: string
    matterType: string
    hasPortalToken: boolean
  }
  property: {
    address: string
    county: string
    propertyType: string
  }
  transaction: {
    transactionType: string
    purchasePrice: number
    financingType: string
    hoaFlag: boolean
    keyDates: {
      effectiveDate: string
      inspectionDeadline: string
      loanApprovalDeadline: string
      closingDate: string
    }
  }
  /** Pipeline label as stored on the matter. */
  matterStatusStored: string
  /** Precomputed derived status (adapter owns product-specific derivation). */
  matterStatusDerivedFromTasks: string
  parties: {
    buyer: { name: string; partyType: MatterSummarySourcePartyType }
    seller: { name: string; partyType: MatterSummarySourcePartyType }
    displayRows: Array<{ label: string; value: string }>
  }
  tasks: MatterSummarySourceTask[]
  documents: MatterSummarySourceDocument[]
  documentRequests: MatterSummarySourceDocumentRequest[]
  timeline: MatterSummarySourceTimelineEvent[]
  compliance: {
    fincen: {
      eligible: boolean
      reportStatus?: string
      completedFields?: number
      beneficialOwnerCount?: number
      certRequestPendingClient?: boolean
    }
    condoDiligence: {
      eligible: boolean
      rowPresent: boolean
      applicable?: boolean
      status?: string
      requiredDocumentsTotal?: number
      requiredDocumentsOutstanding?: number
      requiredDocumentsRequested?: number
      requiredDocumentsReceived?: number
      findingsCount?: number
    }
  }
}
