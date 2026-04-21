import { describe, it, expect } from 'vitest'
import { mergeStoredDocumentsWithSeed } from '@/lib/demo/demoDocument'
import type { DemoDocument } from '@/lib/demo/types'

function doc(partial: Partial<DemoDocument> & Pick<DemoDocument, 'id'>): DemoDocument {
  return {
    matter_id: 'm1',
    name: 'x.pdf',
    category: 'Contract',
    status: 'draft',
    uploaded_at: '2026-01-01T00:00:00.000Z',
    uploaded_by_staff_id: 's1',
    deletedAt: null,
    ...partial,
  }
}

describe('mergeStoredDocumentsWithSeed', () => {
  it('preserves seed documents when there is no stored override', () => {
    const seed = [doc({ id: 'd1', name: 'Seed.pdf' }), doc({ id: 'd2', name: 'Other.pdf' })]
    const merged = mergeStoredDocumentsWithSeed([], seed)
    expect(merged).toHaveLength(2)
    expect(merged.find((d) => d.id === 'd1')?.name).toBe('Seed.pdf')
    expect(merged.find((d) => d.id === 'd2')?.name).toBe('Other.pdf')
  })

  it('overrides seed documents with stored when ids collide', () => {
    const seed = [doc({ id: 'd1', name: 'Seed name' })]
    const stored = [doc({ id: 'd1', name: 'Stored name', status: 'final' })]
    const merged = mergeStoredDocumentsWithSeed(stored, seed)
    expect(merged).toHaveLength(1)
    expect(merged[0].name).toBe('Stored name')
    expect(merged[0].status).toBe('final')
  })

  it('includes stored-only documents not present in seed', () => {
    const seed = [doc({ id: 'd1' })]
    const stored = [doc({ id: 'd-only', name: 'User upload.pdf' })]
    const merged = mergeStoredDocumentsWithSeed(stored, seed)
    expect(merged).toHaveLength(2)
    expect(merged.find((d) => d.id === 'd-only')?.name).toBe('User upload.pdf')
  })

  it('does not duplicate documents with the same id', () => {
    const seed = [doc({ id: 'd1', name: 'a' })]
    const stored = [doc({ id: 'd1', name: 'b' })]
    const merged = mergeStoredDocumentsWithSeed(stored, seed)
    expect(merged.filter((d) => d.id === 'd1')).toHaveLength(1)
    expect(merged).toHaveLength(1)
  })

  it('preserves deletedAt from stored on collision', () => {
    const seed = [doc({ id: 'd1', deletedAt: null })]
    const removedAt = '2026-06-01T12:00:00.000Z'
    const stored = [doc({ id: 'd1', deletedAt: removedAt })]
    const merged = mergeStoredDocumentsWithSeed(stored, seed)
    expect(merged).toHaveLength(1)
    expect(merged[0].deletedAt).toBe(removedAt)
  })
})
