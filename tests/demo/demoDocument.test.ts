import { describe, it, expect } from 'vitest'
import { buildDemoDocument, buildEngagementLetterDraftInput } from '@/lib/demo/demoDocument'

describe('buildDemoDocument', () => {
  const base = {
    matter_id: 'matter-1',
    name: 'HUD-1.pdf',
    category: 'Closing' as const,
    status: 'draft' as const,
    uploaded_by_staff_id: 'staff-1',
  }

  it('returns a full DemoDocument with deletedAt null', () => {
    const doc = buildDemoDocument(base, {
      idFactory: () => 'doc-fixed',
      nowIso: () => '2026-04-10T12:00:00.000Z',
    })
    expect(doc).toEqual({
      id: 'doc-fixed',
      matter_id: 'matter-1',
      name: 'HUD-1.pdf',
      category: 'Closing',
      document_subtype: null,
      description: null,
      document_date: null,
      source: null,
      status: 'draft',
      uploaded_at: '2026-04-10T12:00:00.000Z',
      uploaded_by_staff_id: 'staff-1',
      deletedAt: null,
    })
  })

  it('uses explicit id and uploaded_at when provided on input', () => {
    const doc = buildDemoDocument({
      ...base,
      id: 'doc-explicit',
      uploaded_at: '2020-01-01T00:00:00.000Z',
    })
    expect(doc?.id).toBe('doc-explicit')
    expect(doc?.uploaded_at).toBe('2020-01-01T00:00:00.000Z')
  })

  it('passes through optional generatedInternalSummary metadata', () => {
    const meta = {
      generatedType: 'condo_diligence_internal_summary' as const,
      generatedAt: '2026-09-04T15:30:00.000Z',
      sourceMatterId: 'matter-1',
      content: 'Internal Diligence Summary — Lawyer Review Required',
      visibility: 'internal' as const,
    }
    const doc = buildDemoDocument(
      {
        ...base,
        category: 'Compliance',
        document_subtype: 'Condo diligence internal summary',
        generatedInternalSummary: meta,
      },
      { idFactory: () => 'doc-summary' },
    )
    expect(doc?.generatedInternalSummary).toEqual(meta)
  })

  it('trims matter_id and name', () => {
    const doc = buildDemoDocument(
      {
        ...base,
        matter_id: '  m-2  ',
        name: '  Note  ',
      },
      { idFactory: () => 'x', nowIso: () => 't' }
    )
    expect(doc?.matter_id).toBe('m-2')
    expect(doc?.name).toBe('Note')
  })

  it('returns null when name is empty', () => {
    expect(buildDemoDocument({ ...base, name: '   ' }, { idFactory: () => 'x' })).toBeNull()
  })

  it('returns null when matter_id is empty', () => {
    expect(buildDemoDocument({ ...base, matter_id: '' }, { idFactory: () => 'x' })).toBeNull()
  })

  it('returns null when uploaded_by_staff_id is empty or whitespace-only', () => {
    expect(buildDemoDocument({ ...base, uploaded_by_staff_id: '' }, { idFactory: () => 'x' })).toBeNull()
    expect(buildDemoDocument({ ...base, uploaded_by_staff_id: '   ' }, { idFactory: () => 'x' })).toBeNull()
  })

  it('trims uploaded_by_staff_id on success', () => {
    const doc = buildDemoDocument(
      { ...base, uploaded_by_staff_id: '  staff-9  ' },
      { idFactory: () => 'x', nowIso: () => 't' }
    )
    expect(doc?.uploaded_by_staff_id).toBe('staff-9')
  })

  it('normalizes optional metadata fields to trimmed strings or null', () => {
    const doc = buildDemoDocument(
      {
        ...base,
        document_subtype: '  Title commitment  ',
        description: '  Initial version from title company  ',
        document_date: ' 2026-04-01 ',
        source: '  Title Company  ',
      },
      { idFactory: () => 'x', nowIso: () => 't' }
    )
    expect(doc?.document_subtype).toBe('Title commitment')
    expect(doc?.description).toBe('Initial version from title company')
    expect(doc?.document_date).toBe('2026-04-01')
    expect(doc?.source).toBe('Title Company')

    const empty = buildDemoDocument(
      {
        ...base,
        document_subtype: '  ',
        description: '',
        document_date: ' ',
        source: '',
      },
      { idFactory: () => 'x', nowIso: () => 't' }
    )
    expect(empty?.document_subtype).toBeNull()
    expect(empty?.description).toBeNull()
    expect(empty?.document_date).toBeNull()
    expect(empty?.source).toBeNull()
  })
})

describe('buildEngagementLetterDraftInput', () => {
  it('builds a metadata-only engagement letter draft row', () => {
    const row = buildEngagementLetterDraftInput({
      matter_id: 'matter-9',
      uploaded_by_staff_id: 'staff-1',
      namePrefix: 'FL-2026-101',
      document_date: '2026-05-01',
      source: 'Matter setup (demo)',
      description: 'Created at matter opening.',
    })
    expect(row).toEqual({
      matter_id: 'matter-9',
      name: 'FL-2026-101 - Engagement Letter (Draft)',
      category: 'Contract',
      document_subtype: 'Engagement letter',
      description: 'Created at matter opening.',
      document_date: '2026-05-01',
      source: 'Matter setup (demo)',
      status: 'draft',
      uploaded_by_staff_id: 'staff-1',
    })
  })

  it('returns null when required linkage values are missing', () => {
    expect(
      buildEngagementLetterDraftInput({ matter_id: ' ', uploaded_by_staff_id: 'staff-1' })
    ).toBeNull()
    expect(
      buildEngagementLetterDraftInput({ matter_id: 'matter-9', uploaded_by_staff_id: '' })
    ).toBeNull()
  })

  it('builds description from structured variables when description is omitted', () => {
    const row = buildEngagementLetterDraftInput({
      matter_id: 'matter-9',
      uploaded_by_staff_id: 'staff-1',
      fileReference: 'FL-2026-201',
      clientName: 'John Buyer',
      attorneyName: 'Ava Counsel',
      propertyAddress: '123 Main St',
      scopeSummary: 'Representation through closing.',
      feeSummary: 'Flat fee plus recording costs.',
      exclusionsSummary: 'No litigation or tax advice.',
      costsSummary: 'Third-party title and recording charges billed at cost.',
    })
    expect(row?.description).toContain('Client: John Buyer')
    expect(row?.description).toContain('Attorney: Ava Counsel')
    expect(row?.description).toContain('File: FL-2026-201')
    expect(row?.description).toContain('Property: 123 Main St')
    expect(row?.description).toContain('Scope: Representation through closing.')
    expect(row?.description).toContain('Fee summary: Flat fee plus recording costs.')
    expect(row?.description).toContain('Exclusions: No litigation or tax advice.')
    expect(row?.description).toContain('Costs: Third-party title and recording charges billed at cost.')
  })
})
