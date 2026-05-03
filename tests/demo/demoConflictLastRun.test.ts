import { describe, it, expect } from 'vitest'
import { buildConflictCheckLastRun } from '@/lib/demo/demoConflictLastRun'
import { runDemoConflictCheck } from '@/lib/demo/demoConflictCheck'
import type { DemoClient, DemoIntakeLead, DemoMatter } from '@/lib/demo/types'

function makeLead(overrides: Partial<DemoIntakeLead> = {}): DemoIntakeLead {
  return {
    id: 'lead-1',
    token: 'token-1',
    createdAt: '2026-04-23T12:00:00.000Z',
    fileReference: 'FL-2026-123',
    emailRecipientName: 'Jane Recipient',
    emailRecipientEmail: 'jane@example.com',
    emailSubject: 'Subject',
    emailBody: 'Body',
    intakeUrl: '/demo/intake/token-1',
    demoDelivery: 'link_saved',
    intake: {
      clientName: 'John Buyer',
      clientEmail: 'john@example.com',
      clientPhone: '555-0000000',
      transactionRole: 'buyer',
      transactionRoleOther: '',
      matterType: 'Financed Residential Purchase',
      propertyAddress: '123 Main St, Orlando FL 32801',
      county: 'Orange',
      targetClosingDate: '2026-06-01',
      notes: '',
      buyerType: 'individual',
    },
    status: 'pending_client',
    clientSubmittedAt: null,
    submittedIntake: null,
    ...overrides,
  }
}

const demoClient: DemoClient = {
  id: 'c-1',
  full_name: 'John Buyer',
  email: 'x@y.com',
  phone: '5550000000',
  kyc_status: 'approved',
  type: 'individual',
  linked_matter_ids: [],
  created_at: '2026-01-01',
  deletedAt: null,
}

const demoMatter: DemoMatter = {
  id: 'm-1',
  file_id: 'FL-DEMO-1',
  status: 'Intake',
  deletedAt: null,
  matter_type: 'Purchase',
  portal_token: 'p',
  property: {
    address: '999 Oak Rd, Orlando FL 32801',
    county: 'Orange',
    property_type: 'Single-Family Home',
  },
  buyer: { id: 'b1', name: 'Bob Buyer', type: 'individual', email: '', phone: '' },
  seller: { id: 's1', name: 'Sam Seller', type: 'individual', email: '', phone: '' },
  transactionType: 'Purchase',
  purchasePrice: 1,
  financingType: 'Conv',
  loanNumber: '',
  lenderName: '',
  lenderEmail: '',
  buyerEmail: '',
  buyerPhone: '',
  sellerEmail: '',
  sellerPhone: '',
  buyerAgent: '',
  listingAgent: '',
  assignedAttorney: '',
  assignedParalegal: '',
  contractDate: '',
  inspectionDeadline: '',
  financingDeadline: '',
  titleCommitmentDeadline: '',
  possessionDate: '',
  fileOpenedDate: '',
  hoaFlag: false,
  referralSource: '',
  specialNotes: '',
  key_dates: {
    effective_date: '',
    inspection_deadline: '',
    loan_approval_deadline: '',
    closing_date: '',
  },
  tasks: [],
  timeline: [],
}

describe('buildConflictCheckLastRun', () => {
  it('stores normalized snapshot and match rows', () => {
    const lead = makeLead()
    const result = runDemoConflictCheck(lead, [demoClient], [demoMatter], [])
    const last = buildConflictCheckLastRun(lead, result, {
      runByLabel: 'Alex',
      runAt: '2026-07-01T08:00:00.000Z',
    })
    expect(last.runByLabel).toBe('Alex')
    expect(last.runAt).toBe('2026-07-01T08:00:00.000Z')
    expect(last.intakeSnapshot.clientName).toBe('John Buyer')
    expect(last.hasConflict).toBe(true)
    expect(last.clientRows.length).toBeGreaterThan(0)
    expect(last.clientRows[0].reasons.length).toBeGreaterThan(0)
  })
})
