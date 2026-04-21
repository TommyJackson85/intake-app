export type MatterMilestoneStatus =
  | 'instruction_received' | 'aml_checks_started' | 'aml_checks_complete'
  | 'title_search_started' | 'title_search_complete' | 'contracts_received'
  | 'contracts_signed' | 'closing_date_set' | 'closed'

export type DemoMilestoneLog = {
  id: string
  matter_id: string
  status: MatterMilestoneStatus
  label: string
  logged_at: string
  note?: string
}

export type DemoTaskStatus = 'not_started' | 'in_progress' | 'completed'


export type DemoPartyType = 'individual' | 'entity'

export type DemoTask = {
  id: string
  title: string
  status: DemoTaskStatus
  deletedAt: string | null
}

export type DemoTimelineEvent = {
  id: string
  at: string
  note: string
  deletedAt: string | null
}

export type DemoParty = {
  id: string
  name: string
  /** Absent on very old demo/local data — do not assume entity. */
  type?: DemoPartyType
  email: string
  phone: string
}

export type DemoStaffProfile = {
  id: string
  full_name: string
  role: string
  email: string
}

export type DemoMatterStatus =
  | 'Intake'
  | 'Title Search'
  | 'Cleared to Close'
  | 'Scheduled for Closing'
  | 'Closed/Post-Closing'

export type FinCENReportStatus = 'not_started' | 'in_progress' | 'ready'

export type FinCENCertStatus = 'pending_client' | 'submitted'

export type FinCENBeneficialOwner = {
  id: string
  fullName: string
  dob: string
  address: string
  citizenship: string
  tin: string
  /** Government-issued ID — type, number, and issuer (31 CFR 1031.320); no document image required. */
  govIdType: string
  govIdNumber: string
  govIdIssuer: string
  certifiedAt: string | null
}

/**
 * Token-based certification request to the entity buyer (beneficial ownership).
 * Mirrors `DemoIntakeLead` but scoped to BO certification.
 */
export type DemoFinCENCertRequest = {
  id: string
  token: string
  matterId: string
  createdAt: string
  recipientName: string
  recipientEmail: string
  /** e.g. `/demo/fincen-cert/[token]` */
  certUrl: string
  status: FinCENCertStatus
  submittedAt: string | null
  submittedOwners: FinCENBeneficialOwner[] | null
}

export type FinCENReportingParty = {
  firmName: string
  firmAddress: string
  firmEin: string
  filingAttorney: string
}

export type FinCENPropertyInfo = {
  purchaserEntityName: string
  purchaserEntityType: string
  purchaserEin: string
  stateOfFormation: string
  paymentMethods: string[]
  totalCashAmount: string
}

export type DemoFinCEN = {
  reportStatus: FinCENReportStatus
  completedFields: number
  reportingParty: FinCENReportingParty
  propertyInfo: FinCENPropertyInfo
  beneficialOwners: FinCENBeneficialOwner[]
  certRequest: DemoFinCENCertRequest | null
  retentionDeadline: string | null
}

export type DemoMatter = {
  id: string
  file_id: string
  status: DemoMatterStatus
  deletedAt: string | null
  matter_type: string
  portal_token: string
  property: {
    address: string
    county: string
    property_type: 'Single-Family Home' | 'Condo' | 'Townhouse' | 'Commercial' | 'Land'
  }
  buyer: DemoParty
  seller: DemoParty

  // Additional demo-only matter fields used by the /demo/matters detail modal.
  transactionType: string
  purchasePrice: number
  financingType: string
  loanNumber: string
  lenderName: string
  lenderEmail: string
  buyerEmail: string
  buyerPhone: string
  sellerEmail: string
  sellerPhone: string
  buyerAgent: string
  listingAgent: string
  assignedAttorney: string
  assignedParalegal: string
  contractDate: string
  inspectionDeadline: string
  financingDeadline: string
  titleCommitmentDeadline: string
  possessionDate: string
  fileOpenedDate: string
  hoaFlag: boolean
  referralSource: string
  specialNotes: string
  fincen?: DemoFinCEN

  key_dates: {
    effective_date: string
    inspection_deadline: string
    loan_approval_deadline: string
    closing_date: string
  }
  tasks: DemoTask[]
  timeline: DemoTimelineEvent[]
}

export type DemoFirm = {
  id: string
  name: string
  office_location: string
  email: string
  phone: string
  website: string
  is_demo_firm: true
}

/** Role in the transaction — drives where intake client name maps on  (buyer vs seller). */
export type DemoTransactionRole = 'buyer' | 'seller' | 'both' | 'other'

/** Lawyer-prefilled intake fields (secure form); separate from email recipient identity */
export type DemoIntakeSnapshot = {
  clientName: string
  clientEmail: string
  clientPhone: string
  /** Where the client name should appear when opening a matter from this intake */
  transactionRole: DemoTransactionRole
  /** When `transactionRole` is `other`, short free-text description */
  transactionRoleOther: string
  matterType: string
  propertyAddress: string
  county: string
  targetClosingDate: string
  notes: string
  /** Purchaser is an individual vs legal entity/trust — used for FinCEN when buyer-side. */
  buyerType?: DemoPartyType
}

export type DemoConflictCheckStatus = 'pending' | 'clear' | 'flagged' | 'confirmed_no_conflict'

export type DemoIntakeLeadStatus = 'pending_client' | 'submitted'

export type DemoIntakeDemoDelivery = 'link_saved' | 'email_sent'

export type DemoIntakeLead = {
  id: string
  token: string
  createdAt: string
  fileReference: string
  emailRecipientName: string
  emailRecipientEmail: string
  emailSubject: string
  emailBody: string
  /** Full URL shown on Intake / Leads (set when saved in demo) */
  intakeUrl?: string
  /** How the lead was created in demo UI */
  demoDelivery?: DemoIntakeDemoDelivery
  /** Prefill for the client-facing intake link */
  intake: DemoIntakeSnapshot
  status: DemoIntakeLeadStatus
  clientSubmittedAt: string | null
  /** Values after the client submits the pseudo form */
  submittedIntake: DemoIntakeSnapshot | null
  /** Set when lawyer opens this intake as a matter in demo */
  linkedMatterFileId?: string | null
  /** Set when a demo client record is created from this intake */
  linkedClientId?: string | null
  /** Conflict check gate — must be resolved before opening as matter */
  conflict_check_status?: DemoConflictCheckStatus
  conflict_check_completed_at?: string | null
  conflict_check_note?: string | null
}

export type DemoSeedData = {
  demoFirm: DemoFirm
  staff: DemoStaffProfile[]
  matters: DemoMatter[]
  clients: DemoClient[]
  calendarEvents: DemoCalendarEvent[]
  documents: DemoDocument[]
  documentRequests: DemoDocumentRequest[]
  intakeLeads: DemoIntakeLead[]
  fincenCertRequests: DemoFinCENCertRequest[]
}

export type DemoClient = {
  id: string
  full_name: string
  email: string
  phone: string
  kyc_status: 'approved' | 'pending' | 'flagged'
  type: DemoPartyType
  linked_matter_ids: string[]
  created_at: string
  deletedAt: string | null
}

export type DemoCalendarEvent = {
  id: string
  title: string
  kind: 'closing' | 'deadline' | 'client_call' | 'internal'
  date: string
  matter_id: string
  location: string
  assigned_staff_id: string
  deletedAt: string | null
}

export type DemoDocument = {
  id: string
  matter_id: string
  name: string
  category: 'Contract' | 'Title' | 'Closing' | 'Compliance' | 'Post-Closing'
  uploaded_at: string
  uploaded_by_staff_id: string
  status: 'draft' | 'reviewed' | 'final'
  deletedAt: string | null
}

export type DemoDocumentRequestStatus = 'open' | 'fulfilled'

/** Lawyer-side request for a document from the client / counterparty (demo; no portal workflow yet). */
export type DemoDocumentRequest = {
  id: string
  matter_id: string
  title: string
  description: string | null
  category: DemoDocument['category']
  requested_at: string
  requested_by_staff_id: string
  status: DemoDocumentRequestStatus
  /** Set when fulfilled (e.g. portal simulated upload); links to `DemoDocument.id`. */
  fulfilled_document_id: string | null
}
