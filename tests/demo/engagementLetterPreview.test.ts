import { describe, expect, it } from 'vitest'
import {
  buildEngagementLetterDescription,
  isEngagementLetterDocument,
  parseEngagementLetterDescription,
} from '@/lib/demo/engagementLetterPreview'

describe('engagement letter preview helpers', () => {
  it('detects engagement letter documents by category and subtype or name', () => {
    expect(
      isEngagementLetterDocument({
        category: 'Contract',
        name: 'Engagement Letter (Draft)',
        document_subtype: null,
      }),
    ).toBe(true)
    expect(
      isEngagementLetterDocument({
        category: 'Contract',
        name: 'Initial draft',
        document_subtype: 'Engagement letter',
      }),
    ).toBe(true)
    expect(
      isEngagementLetterDocument({
        category: 'Title',
        name: 'Engagement Letter (Draft)',
        document_subtype: null,
      }),
    ).toBe(false)
  })

  it('round-trips template fields through the shared description format', () => {
    const description = buildEngagementLetterDescription({
      clientName: 'Alex Buyer',
      attorneyName: 'Jordan Law',
      fileReference: 'MAT-100',
      propertyAddress: '123 Main St',
      scopeSummary: 'Represent buyer through closing.',
      exclusionsSummary: 'No litigation services.',
      feeSummary: '$1,950 flat legal fee.',
      costsSummary: 'Client pays recording and title charges.',
    })

    expect(parseEngagementLetterDescription(description)).toEqual({
      clientName: 'Alex Buyer',
      attorneyName: 'Jordan Law',
      fileReference: 'MAT-100',
      propertyAddress: '123 Main St',
      scopeSummary: 'Represent buyer through closing.',
      exclusionsSummary: 'No litigation services.',
      feeSummary: '$1,950 flat legal fee.',
      costsSummary: 'Client pays recording and title charges.',
    })
  })
})
