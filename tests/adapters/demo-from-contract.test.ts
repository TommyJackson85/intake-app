import { describe, expect, it } from 'vitest'
import { systemContract, type SystemContractDomainKey } from '@/lib/domain/system-contract'
import { demoImplementationByDomain } from '@/lib/adapters/demo-from-contract'
import { liveImplementationPlaceholderByDomain } from '@/lib/adapters/live-from-contract'
import { aiImplementationPlaceholderByDomain } from '@/lib/adapters/ai-from-contract'

describe('adapters ↔ systemContract domain keys', () => {
  const contractKeys = Object.keys(systemContract.domains) as SystemContractDomainKey[]

  it('demoImplementationByDomain covers every contract domain key', () => {
    for (const k of contractKeys) {
      expect(demoImplementationByDomain[k]).toBeDefined()
    }
  })

  it('liveImplementationPlaceholderByDomain covers every contract domain key', () => {
    for (const k of contractKeys) {
      expect(liveImplementationPlaceholderByDomain[k]).toBeDefined()
    }
  })

  it('aiImplementationPlaceholderByDomain covers every contract domain key', () => {
    for (const k of contractKeys) {
      expect(aiImplementationPlaceholderByDomain[k]).toBeDefined()
    }
  })
})
