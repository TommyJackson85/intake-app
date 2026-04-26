import { describe, it, expect } from 'vitest'
import { buildIntakeStarterDocuments } from '@/lib/demo/demoIntakeFlow'
import type { DemoIntakeLead } from '@/lib/demo/types'

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
      clientPhone: '555-0000',
      transactionRole: 'buyer',
      transactionRoleOther: '',
      matterType: 'Financed Residential Purchase',
      propertyAddress: '123 Main St',
      county: 'Orange',
      targetClosingDate: '2026-06-01',
      notes: 'Initial intake notes',
      buyerType: 'individual',
    },
    status: 'pending_client',
    clientSubmittedAt: null,
    submittedIntake: null,
    ...overrides,
  }
}

describe('buildIntakeStarterDocuments', () => {
  it('builds two starter metadata-only documents linked to matter', () => {
    const rows = buildIntakeStarterDocuments({
      lead: makeLead(),
      matterId: 'matter-9',
      uploadedByStaffId: 'staff-1',
    })
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      matter_id: 'matter-9',
      name: 'FL-2026-123 - Intake Summary',
      category: 'Compliance',
      document_subtype: 'Intake summary',
      status: 'reviewed',
      uploaded_by_staff_id: 'staff-1',
      source: 'Intake form (demo)',
      document_date: '2026-04-23',
    })
    expect(rows[1]).toMatchObject({
      matter_id: 'matter-9',
      name: 'FL-2026-123 - Engagement Letter (Draft)',
      category: 'Contract',
      document_subtype: 'Engagement letter',
      status: 'draft',
      uploaded_by_staff_id: 'staff-1',
      source: 'Intake workflow (demo)',
      document_date: '2026-04-23',
    })
  })

  it('returns empty when matterId or uploader is missing', () => {
    expect(
      buildIntakeStarterDocuments({ lead: makeLead(), matterId: ' ', uploadedByStaffId: 'staff-1' })
    ).toEqual([])
    expect(
      buildIntakeStarterDocuments({ lead: makeLead(), matterId: 'matter-9', uploadedByStaffId: '' })
    ).toEqual([])
  })
})
