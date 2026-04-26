import { describe, it, expect } from 'vitest'
import { appendDemoDocumentIfValid } from '@/lib/demo/demoDocument'
import type { DemoDocument } from '@/lib/demo/types'

const seedDoc: DemoDocument = {
  id: 'doc-seed',
  matter_id: 'm1',
  name: 'Existing.pdf',
  category: 'Title',
  status: 'final',
  uploaded_at: '2025-01-01T00:00:00.000Z',
  uploaded_by_staff_id: 's1',
  deletedAt: null,
}

describe('appendDemoDocumentIfValid', () => {
  const validInput = {
    matter_id: 'matter-2',
    name: 'New.pdf',
    category: 'Closing' as const,
    status: 'draft' as const,
    uploaded_by_staff_id: 'staff-1',
  }

  it('appends a new document when input is valid', () => {
    const prev = [seedDoc]
    const next = appendDemoDocumentIfValid(prev, validInput, {
      idFactory: () => 'doc-new',
      nowIso: () => '2026-04-10T15:00:00.000Z',
    })
    expect(next).toHaveLength(2)
    expect(next[0]).toBe(seedDoc)
    expect(next[1]).toEqual({
      id: 'doc-new',
      matter_id: 'matter-2',
      name: 'New.pdf',
      category: 'Closing',
      document_subtype: null,
      description: null,
      document_date: null,
      source: null,
      status: 'draft',
      uploaded_at: '2026-04-10T15:00:00.000Z',
      uploaded_by_staff_id: 'staff-1',
      deletedAt: null,
    })
  })

  it('returns the same array reference when input is invalid', () => {
    const prev = [seedDoc]
    const next = appendDemoDocumentIfValid(
      prev,
      { ...validInput, name: '   ' },
      { idFactory: () => 'x', nowIso: () => 't' }
    )
    expect(next).toBe(prev)
    expect(next).toHaveLength(1)
  })

  it('returns the same array reference when uploaded_by_staff_id is invalid', () => {
    const prev = [seedDoc]
    const next = appendDemoDocumentIfValid(
      prev,
      { ...validInput, uploaded_by_staff_id: '  ' },
      { idFactory: () => 'x', nowIso: () => 't' }
    )
    expect(next).toBe(prev)
    expect(next).toHaveLength(1)
  })

  it('appended document includes deletedAt null from the builder path', () => {
    const next = appendDemoDocumentIfValid([], validInput, {
      idFactory: () => 'only',
      nowIso: () => '2026-01-01T00:00:00.000Z',
    })
    expect(next[0].deletedAt).toBeNull()
  })
})
