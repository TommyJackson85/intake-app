import { describe, it, expect } from 'vitest'
import { buildDemoDocument } from '@/lib/demo/demoDocument'

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
})
