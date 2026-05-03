import { describe, it, expect } from 'vitest'
import {
  canRunDemoConflictCheck,
  runDemoConflictCheck,
  sortConflictMatchReasons,
} from '@/lib/demo/demoConflictCheck'
import { parseRelatedPartiesFromMultiline } from '@/lib/demo/demoIntakeFlow'
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
      clientPhone: '555-0000',
      transactionRole: 'buyer',
      transactionRoleOther: '',
      matterType: 'Financed Residential Purchase',
      propertyAddress: '123 Main St, Orlando FL 32801',
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

const demoClient: DemoClient = {
  id: 'c-1',
  full_name: 'Jane Related',
  email: 'j@example.com',
  phone: '555',
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

describe('parseRelatedPartiesFromMultiline', () => {
  it('returns empty for blank input', () => {
    expect(parseRelatedPartiesFromMultiline('')).toEqual([])
    expect(parseRelatedPartiesFromMultiline('  \n  ')).toEqual([])
  })

  it('parses name-only and name with role after first comma', () => {
    expect(parseRelatedPartiesFromMultiline('Pat Lee')).toEqual([{ name: 'Pat Lee' }])
    expect(parseRelatedPartiesFromMultiline('Pat Lee, spouse')).toEqual([
      { name: 'Pat Lee', roleLabel: 'spouse' },
    ])
  })

  it('drops empty lines and empty names', () => {
    expect(parseRelatedPartiesFromMultiline('\nAlex\n, nope\n')).toEqual([{ name: 'Alex' }])
  })
})

describe('sortConflictMatchReasons', () => {
  it('dedupes and orders by demo priority', () => {
    expect(sortConflictMatchReasons(['matter_role_context', 'primary_name', 'primary_name'])).toEqual([
      'primary_name',
      'matter_role_context',
    ])
    expect(sortConflictMatchReasons(['property_match', 'email_match', 'alias_match'])).toEqual([
      'alias_match',
      'email_match',
      'property_match',
    ])
  })
})

describe('runDemoConflictCheck', () => {
  it('returns no conflict when nothing matches', () => {
    const lead = makeLead()
    const r = runDemoConflictCheck(lead, [], [], [])
    expect(r.hasConflict).toBe(false)
    expect(r.clientMatches).toHaveLength(0)
  })

  it('matches a related party to a client with related_party reason', () => {
    const lead = makeLead({
      intake: {
        ...makeLead().intake,
        clientName: 'Someone Else',
        relatedParties: [{ name: 'Jane Related' }],
      },
    })
    const r = runDemoConflictCheck(lead, [demoClient], [], [])
    expect(r.hasConflict).toBe(true)
    expect(r.clientMatches).toHaveLength(1)
    expect(r.clientMatches[0].reasons).toEqual(['related_party'])
  })

  it('adds matter_role_context when primary name hits buyer and intake is buyer', () => {
    const lead = makeLead({
      intake: {
        ...makeLead().intake,
        clientName: 'Bob Buyer',
        transactionRole: 'buyer',
      },
    })
    const r = runDemoConflictCheck(lead, [], [demoMatter], [])
    expect(r.matterMatches).toHaveLength(1)
    expect(r.matterMatches[0].reasons).toContain('primary_name')
    expect(r.matterMatches[0].reasons).toContain('matter_role_context')
  })

  it('matches client by email with email_match', () => {
    const lead = makeLead({
      intake: {
        ...makeLead().intake,
        clientName: '',
        clientEmail: 'Match@Example.COM',
        clientPhone: '',
        propertyAddress: '',
      },
    })
    const client: DemoClient = {
      ...demoClient,
      id: 'c-email',
      full_name: 'Other Person',
      email: 'match@example.com',
      phone: '111',
    }
    const r = runDemoConflictCheck(lead, [client], [], [])
    expect(r.clientMatches).toHaveLength(1)
    expect(r.clientMatches[0].reasons).toContain('email_match')
  })

  it('matches client when intake name hits client alias', () => {
    const lead = makeLead({
      intake: {
        ...makeLead().intake,
        clientName: 'Liv Shaw',
      },
    })
    const client: DemoClient = {
      ...demoClient,
      id: 'c-alias',
      full_name: 'Olivia Shaw',
      aliases: ['Liv Shaw'],
      email: 'x@y.com',
    }
    const r = runDemoConflictCheck(lead, [client], [], [])
    expect(r.clientMatches[0].reasons).toContain('alias_match')
  })

  it('merges reasons per matter without duplicate rows', () => {
    const lead = makeLead({
      intake: {
        ...makeLead().intake,
        clientName: 'Bob',
        relatedParties: [{ name: 'Bob Buyer' }],
        transactionRole: 'buyer',
      },
    })
    const r = runDemoConflictCheck(lead, [], [demoMatter], [])
    expect(r.matterMatches).toHaveLength(1)
    expect(new Set(r.matterMatches[0].reasons).size).toBe(r.matterMatches[0].reasons.length)
  })
})

describe('canRunDemoConflictCheck', () => {
  it('is true when only development name is present', () => {
    expect(
      canRunDemoConflictCheck({
        ...makeLead().intake,
        clientName: '',
        propertyAddress: '',
        developmentOrBuildingName: 'The Oaks',
      })
    ).toBe(true)
  })
})
