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
  type: DemoPartyType
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

export type DemoMatter = {
  id: string
  file_id: string
  status: DemoMatterStatus
  deletedAt: string | null
  matter_type: string
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
}

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
}

export type DemoSeedData = {
  demoFirm: DemoFirm
  staff: DemoStaffProfile[]
  matters: DemoMatter[]
  clients: DemoClient[]
  calendarEvents: DemoCalendarEvent[]
  documents: DemoDocument[]
  intakeLeads: DemoIntakeLead[]
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
