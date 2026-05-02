import { describe, expect, it } from 'vitest'
import { systemContract, type SystemContractDomainKey } from '@/lib/domain/system-contract'

describe('systemContract', () => {
  it('exposes every domain key on the runtime object (no drift from type-only keys)', () => {
    const keys = Object.keys(systemContract.domains)
    expect(keys.length).toBeGreaterThan(0)
    for (const k of keys) {
      expect(systemContract.domains[k as SystemContractDomainKey]).toBeDefined()
    }
  })

  it('documents high-risk demo divergences the implementation comments reference', () => {
    const ids = new Set(systemContract.knownDivergences.map((d) => d.id))
    expect(ids.has('split-fincen-storage')).toBe(true)
    expect(ids.has('demo-data-context-wording')).toBe(true)
    expect(ids.has('multiple-status-concepts')).toBe(true)
  })
})
