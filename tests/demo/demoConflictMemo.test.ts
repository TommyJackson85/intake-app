import { describe, it, expect } from 'vitest'
import {
  buildDemoConflictMemoHtml,
  memoRowsFromLastRun,
  memoRowsFromLiveResult,
} from '@/lib/demo/demoConflictMemo'
import { buildConflictCheckLastRun } from '@/lib/demo/demoConflictLastRun'
import { runDemoConflictCheck } from '@/lib/demo/demoConflictCheck'
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
      clientPhone: '555-0000000',
      clientAliases: ['JB'],
      transactionRole: 'buyer',
      transactionRoleOther: '',
      matterType: 'Financed Residential Purchase',
      propertyAddress: '123 Main St, Orlando FL 32801',
      developmentOrBuildingName: 'Oak Court',
      county: 'Orange',
      targetClosingDate: '2026-06-01',
      notes: 'Initial intake notes',
      buyerType: 'individual',
    },
    status: 'pending_client',
    clientSubmittedAt: null,
    submittedIntake: null,
    conflict_check_status: 'pending',
    conflict_check_note: 'Prior note',
    ...overrides,
  }
}

describe('buildDemoConflictMemoHtml', () => {
  it('includes lead reference, inputs, and escapes HTML in client name', () => {
    const lead = makeLead({
      intake: { ...makeLead().intake, clientName: '<b>XSS</b>' },
    })
    const result = runDemoConflictCheck(lead, [], [], [])
    const html = buildDemoConflictMemoHtml({
      lead,
      checkRunAtIso: '2026-05-01T12:00:00.000Z',
      checkRunByLabel: 'Runner',
      memoGeneratedAtIso: '2026-05-01T12:01:00.000Z',
      memoExportedByLabel: 'Exporter',
      draftReviewerNote: 'Draft only',
      rows: memoRowsFromLiveResult(lead, result),
    })
    expect(html).toContain('FL-2026-123')
    expect(html).toContain('Exporter')
    expect(html).toContain('Runner')
    expect(html).toContain('&lt;b&gt;XSS&lt;/b&gt;')
    expect(html).not.toContain('<b>XSS</b>')
    expect(html).toContain('JB')
    expect(html).toContain('Oak Court')
    expect(html).toContain('Prior note')
    expect(html).toContain('Draft only')
    expect(html).toContain('Demo only')
  })

  it('renders empty matches row when no hits', () => {
    const lead = makeLead()
    const result = runDemoConflictCheck(lead, [], [], [])
    const html = buildDemoConflictMemoHtml({
      lead,
      checkRunAtIso: '2026-05-01T12:00:00.000Z',
      checkRunByLabel: 'A',
      memoGeneratedAtIso: '2026-05-01T12:00:00.000Z',
      memoExportedByLabel: 'A',
      rows: memoRowsFromLiveResult(lead, result),
    })
    expect(html).toContain('empty result set')
  })

  it('memo match rows from persisted last run match live result rows', () => {
    const lead = makeLead()
    const result = runDemoConflictCheck(lead, [], [], [])
    const last = buildConflictCheckLastRun(lead, result, {
      runByLabel: 'Staff',
      runAt: '2026-06-01T10:00:00.000Z',
    })
    const fromLast = memoRowsFromLastRun(last)
    const fromLive = memoRowsFromLiveResult(lead, result)
    expect(fromLast.hasConflict).toBe(fromLive.hasConflict)
    expect(fromLast.clientRows).toEqual(fromLive.clientRows)
    expect(fromLast.matterRows).toEqual(fromLive.matterRows)
    expect(fromLast.intakeRows).toEqual(fromLive.intakeRows)
  })
})
