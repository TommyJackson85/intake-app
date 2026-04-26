import { describe, expect, it } from 'vitest'
import { buildPreviewSourceLabel, buildPreviewTitle } from '@/lib/demo/documentPreviewPresentation'

describe('documentPreviewPresentation', () => {
  it('uses subtype when file name is weak', () => {
    const result = buildPreviewTitle({
      name: 'adsadsasd',
      subtype: 'Purchase contract',
      categoryTitle: 'Purchase Contract Addendum',
    })
    expect(result).toEqual({ title: 'Purchase contract', secondaryLine: null })
  })

  it('avoids subtype-name duplication when they overlap', () => {
    const result = buildPreviewTitle({
      name: 'Title commitment overview.pdf',
      subtype: 'Title commitment',
      categoryTitle: 'Title Commitment Overview',
    })
    expect(result).toEqual({ title: 'Title commitment overview', secondaryLine: null })
  })

  it('falls back to category title when both name and subtype are weak/missing', () => {
    const result = buildPreviewTitle({
      name: 'doc',
      subtype: null,
      categoryTitle: 'Closing Package Summary',
    })
    expect(result).toEqual({ title: 'Closing Package Summary', secondaryLine: null })
  })

  it('uses friendly matter-context source wording for internal uploads', () => {
    expect(
      buildPreviewSourceLabel({
        source: 'Internal upload',
        status: 'draft',
        hasMatterLink: true,
        fulfilledRequestTitle: null,
      })
    ).toBe('Firm-generated draft')
  })

  it('prioritizes fulfilled-request wording when linked', () => {
    expect(
      buildPreviewSourceLabel({
        source: null,
        status: 'draft',
        hasMatterLink: true,
        fulfilledRequestTitle: 'Photo ID',
      })
    ).toBe('Client-submitted fulfillment')
  })
})
