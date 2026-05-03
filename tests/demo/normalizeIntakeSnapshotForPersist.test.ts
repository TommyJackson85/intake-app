import { describe, it, expect } from 'vitest'
import {
  normalizeIntakeSnapshotForPersist,
  parseRelatedPartiesFromMultiline,
} from '@/lib/demo/demoIntakeFlow'
import type { DemoIntakeSnapshot } from '@/lib/demo/types'

const base: DemoIntakeSnapshot = {
  clientName: '  Pat Lee  ',
  clientEmail: ' p@x.com ',
  clientPhone: ' 555 ',
  transactionRole: 'buyer',
  transactionRoleOther: '',
  matterType: ' Financed ',
  propertyAddress: ' 123 Main ',
  county: ' Orange ',
  targetClosingDate: ' 2026-01-01 ',
  notes: ' hi ',
  buyerType: 'individual',
  propertyType: 'Condo',
}

describe('normalizeIntakeSnapshotForPersist', () => {
  it('trims core text fields and clears empty developmentOrBuildingName', () => {
    expect(
      normalizeIntakeSnapshotForPersist({
        ...base,
        developmentOrBuildingName: '  ',
        relatedParties: undefined,
      })
    ).toEqual({
      clientName: 'Pat Lee',
      clientEmail: 'p@x.com',
      clientPhone: '555',
      transactionRole: 'buyer',
      transactionRoleOther: '',
      buyerType: 'individual',
      matterType: 'Financed',
      propertyAddress: '123 Main',
      propertyType: 'Condo',
      county: 'Orange',
      targetClosingDate: '2026-01-01',
      notes: 'hi',
      relatedParties: undefined,
    })
  })

  it('keeps developmentOrBuildingName when non-empty after trim', () => {
    const n = normalizeIntakeSnapshotForPersist({
      ...base,
      developmentOrBuildingName: '  The Oaks  ',
    })
    expect(n.developmentOrBuildingName).toBe('The Oaks')
  })

  it('normalizes related parties and drops empty names', () => {
    const n = normalizeIntakeSnapshotForPersist({
      ...base,
      relatedParties: [
        { name: '  Alex  ', roleLabel: '  spouse  ' },
        { name: '   ', roleLabel: 'x' },
      ],
    })
    expect(n.relatedParties).toEqual([{ name: 'Alex', roleLabel: 'spouse' }])
  })

  it('omits relatedParties when all names empty', () => {
    const n = normalizeIntakeSnapshotForPersist({
      ...base,
      relatedParties: parseRelatedPartiesFromMultiline('\n  \n'),
    })
    expect(n.relatedParties).toBeUndefined()
  })

  it('clears transactionRoleOther when role is not other', () => {
    const n = normalizeIntakeSnapshotForPersist({
      ...base,
      transactionRole: 'seller',
      transactionRoleOther: '  should drop  ',
    })
    expect(n.transactionRoleOther).toBe('')
    expect(n.buyerType).toBeUndefined()
  })

  it('normalizes clientAliases', () => {
    const n = normalizeIntakeSnapshotForPersist({
      ...base,
      clientAliases: ['  A  ', '', 'B'],
    })
    expect(n.clientAliases).toEqual(['A', 'B'])
  })

  it('defaults transactionRole and propertyType when missing', () => {
    const n = normalizeIntakeSnapshotForPersist({
      ...base,
      transactionRole: undefined as unknown as DemoIntakeSnapshot['transactionRole'],
      propertyType: undefined,
    })
    expect(n.transactionRole).toBe('buyer')
    expect(n.propertyType).toBe('Single-Family Home')
  })
})
