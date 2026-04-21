import { describe, it, expect } from 'vitest'
import {
  appendDemoDocumentRequestIfValid,
  buildDemoDocumentRequest,
  coerceDemoDocumentRequestStatus,
  mergeStoredDocumentRequestsWithSeed,
  withCoercedDocumentRequestStatus,
} from '@/lib/demo/demoDocumentRequest'
import type { DemoDocumentRequest } from '@/lib/demo/types'

const baseInput = {
  matter_id: 'matter-1',
  title: 'Wiring instructions',
  category: 'Closing' as const,
  requested_by_staff_id: 'staff-1',
}

describe('buildDemoDocumentRequest', () => {
  it('returns a full record with description null when description omitted or blank', () => {
    const a = buildDemoDocumentRequest({ ...baseInput }, {
      idFactory: () => 'r1',
      nowIso: () => '2026-04-10T12:00:00.000Z',
    })
    expect(a?.description).toBeNull()
    expect(a?.status).toBe('open')
    expect(a?.fulfilled_document_id).toBeNull()

    const b = buildDemoDocumentRequest(
      { ...baseInput, description: '   ' },
      { idFactory: () => 'r2', nowIso: () => 't' }
    )
    expect(b?.description).toBeNull()
    expect(b?.status).toBe('open')
  })

  it('trims title, matter_id, description, staff id', () => {
    const r = buildDemoDocumentRequest(
      {
        matter_id: '  m  ',
        title: '  Title  ',
        description: '  Notes here  ',
        category: 'Title',
        requested_by_staff_id: '  staff-1  ',
      },
      { idFactory: () => 'x', nowIso: () => 't' }
    )
    expect(r?.matter_id).toBe('m')
    expect(r?.title).toBe('Title')
    expect(r?.description).toBe('Notes here')
    expect(r?.requested_by_staff_id).toBe('staff-1')
  })

  it('returns null when title, matter_id, or requested_by_staff_id is empty', () => {
    expect(buildDemoDocumentRequest({ ...baseInput, title: '' }, { idFactory: () => 'x' })).toBeNull()
    expect(buildDemoDocumentRequest({ ...baseInput, matter_id: '' }, { idFactory: () => 'x' })).toBeNull()
    expect(
      buildDemoDocumentRequest({ ...baseInput, requested_by_staff_id: ' ' }, { idFactory: () => 'x' })
    ).toBeNull()
  })

  it('defaults status to open and accepts fulfilled', () => {
    const open = buildDemoDocumentRequest(baseInput, { idFactory: () => 'a', nowIso: () => 't' })
    expect(open?.status).toBe('open')

    const fulfilled = buildDemoDocumentRequest(
      { ...baseInput, status: 'fulfilled' },
      { idFactory: () => 'b', nowIso: () => 't' }
    )
    expect(fulfilled?.status).toBe('fulfilled')
  })
})

describe('coerceDemoDocumentRequestStatus / withCoercedDocumentRequestStatus', () => {
  it('coerces unknown values to open or fulfilled only', () => {
    expect(coerceDemoDocumentRequestStatus(undefined)).toBe('open')
    expect(coerceDemoDocumentRequestStatus('fulfilled')).toBe('fulfilled')
    expect(coerceDemoDocumentRequestStatus('bogus')).toBe('open')
  })

  it('fills missing status on stored-shaped rows', () => {
    const base = buildDemoDocumentRequest(baseInput, { idFactory: () => 'z', nowIso: () => 't' })!
    const row = withCoercedDocumentRequestStatus({
      ...base,
      status: undefined,
    } as DemoDocumentRequest & { status?: unknown })
    expect(row.status).toBe('open')
  })
})

describe('appendDemoDocumentRequestIfValid', () => {
  it('appends when valid and returns same reference when invalid', () => {
    const prev: DemoDocumentRequest[] = []
    const next = appendDemoDocumentRequestIfValid(prev, baseInput, {
      idFactory: () => 'n1',
      nowIso: () => '2026-01-01T00:00:00.000Z',
    })
    expect(next).toHaveLength(1)
    expect(next[0].id).toBe('n1')
    expect(next[0].status).toBe('open')
    expect(next[0].fulfilled_document_id).toBeNull()

    const same = appendDemoDocumentRequestIfValid(next, { ...baseInput, title: '' })
    expect(same).toBe(next)
  })
})

describe('mergeStoredDocumentRequestsWithSeed', () => {
  const seed: DemoDocumentRequest[] = [
    {
      id: 's1',
      matter_id: 'm',
      title: 'Seed',
      description: null,
      category: 'Contract',
      requested_at: 'a',
      requested_by_staff_id: 'st',
      status: 'open',
      fulfilled_document_id: null,
    },
  ]

  it('stored overrides seed by id and includes stored-only rows', () => {
    const merged = mergeStoredDocumentRequestsWithSeed(
      [
        { ...seed[0], title: 'Stored title', status: 'fulfilled', fulfilled_document_id: 'doc-x' },
        {
          id: 's2',
          matter_id: 'm',
          title: 'Only stored',
          description: null,
          category: 'Title',
          requested_at: 'b',
          requested_by_staff_id: 'st',
          status: 'open',
          fulfilled_document_id: null,
        },
      ],
      seed
    )
    expect(merged.find((r) => r.id === 's1')?.title).toBe('Stored title')
    expect(merged.find((r) => r.id === 's1')?.status).toBe('fulfilled')
    expect(merged.find((r) => r.id === 's2')?.title).toBe('Only stored')
    expect(merged).toHaveLength(2)
  })
})
