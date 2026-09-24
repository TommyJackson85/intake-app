import { describe, expect, it } from 'vitest'
import {
  buildMatterReadinessSummary,
  createEmptyTransactionContext,
  getTransactionContextDisplayRows,
  inferTransactionContextClientRoleFromIntakeRole,
  inferTransactionContextPropertyKindFromMatterPropertyType,
  normalizeTransactionContext,
  patchTransactionContext,
  shouldShowTransactionContextOverview,
  transactionContextForIntakeSnapshot,
} from '@/lib/demo/transactionContext'

describe('transactionContext helpers', () => {
  it('creates empty defaults and omits empty context from snapshots', () => {
    const empty = createEmptyTransactionContext()
    expect(empty).toEqual({
      matterKind: '',
      clientRole: '',
      propertyKind: '',
      transactionStage: '',
      primaryConcern: '',
      notes: '',
    })
    expect(normalizeTransactionContext(null)).toBeUndefined()
    expect(normalizeTransactionContext({})).toBeUndefined()
    expect(transactionContextForIntakeSnapshot(empty)).toBeUndefined()
  })

  it('normalizes unknown enum values without inventing classification', () => {
    const n = normalizeTransactionContext({
      matterKind: 'not-a-kind',
      clientRole: 'buyer',
      propertyKind: 'condominium',
      notes: '  Client reported TRIM  ',
    })
    expect(n?.matterKind).toBe('')
    expect(n?.clientRole).toBe('buyer')
    expect(n?.propertyKind).toBe('condominium')
    expect(n?.notes).toBe('  Client reported TRIM  ')
  })

  it('patches nested fields without dropping sibling values', () => {
    const base = createEmptyTransactionContext({
      matterKind: 'purchase',
      clientRole: 'buyer',
    })
    const next = patchTransactionContext(base, { primaryConcern: 'title', notes: 'Title commitment pending' })
    expect(next.matterKind).toBe('purchase')
    expect(next.clientRole).toBe('buyer')
    expect(next.primaryConcern).toBe('title')
    expect(next.notes).toBe('Title commitment pending')
  })

  it('maps existing matter/intake labels into triage kinds when useful', () => {
    expect(inferTransactionContextPropertyKindFromMatterPropertyType('Condo')).toBe('condominium')
    expect(inferTransactionContextPropertyKindFromMatterPropertyType('Single-Family Home')).toBe(
      'single_family',
    )
    expect(inferTransactionContextClientRoleFromIntakeRole('buyer')).toBe('buyer')
    expect(inferTransactionContextClientRoleFromIntakeRole('both')).toBe('')
  })

  it('displays only populated context fields', () => {
    expect(shouldShowTransactionContextOverview(undefined)).toBe(false)
    expect(getTransactionContextDisplayRows(undefined)).toEqual([])
    const rows = getTransactionContextDisplayRows(
      createEmptyTransactionContext({
        matterKind: 'condo_transaction',
        clientRole: 'buyer',
        notes: 'Florida condo under contract',
      }),
    )
    expect(rows.map((r) => r.key)).toEqual(['matterKind', 'clientRole', 'notes'])
    expect(rows.every((r) => r.value.length > 0)).toBe(true)
  })
})

describe('buildMatterReadinessSummary', () => {
  it('marks legacy matters with no context as information incomplete', () => {
    const summary = buildMatterReadinessSummary({})
    expect(summary.status).toBe('information_incomplete')
    expect(summary.message).toMatch(/Transaction context is incomplete/i)
    expect(summary.items.join(' ')).toMatch(/Matter kind/i)
    expect(summary.items.join(' ')).toMatch(/Client role/i)
  })

  it('returns ready for a complete standard purchase context', () => {
    const summary = buildMatterReadinessSummary({
      transactionContext: createEmptyTransactionContext({
        matterKind: 'purchase',
        clientRole: 'buyer',
        propertyKind: 'single_family',
        transactionStage: 'under_contract',
        primaryConcern: 'deadline',
      }),
      propertyType: 'Single-Family Home',
    })
    expect(summary.status).toBe('ready_for_next_workflow_stage')
    expect(summary.message).toMatch(/Core transaction context is complete/i)
    expect(summary.items).toEqual([])
  })

  it('recommends attorney review for landlord-tenant / dispute / title / probate kinds', () => {
    for (const matterKind of [
      'landlord_tenant',
      'property_dispute',
      'title_ownership',
      'probate_property',
    ] as const) {
      const summary = buildMatterReadinessSummary({
        transactionContext: createEmptyTransactionContext({
          matterKind,
          clientRole: 'owner',
        }),
      })
      expect(summary.status).toBe('attorney_review_recommended')
      expect(summary.message).toMatch(/Attorney review is recommended/i)
    }
  })

  it('recommends attorney review for condition/disclosure or compliance concerns', () => {
    const disclosure = buildMatterReadinessSummary({
      transactionContext: createEmptyTransactionContext({
        matterKind: 'purchase',
        clientRole: 'buyer',
        primaryConcern: 'condition_disclosure',
      }),
    })
    expect(disclosure.status).toBe('attorney_review_recommended')

    const compliance = buildMatterReadinessSummary({
      transactionContext: createEmptyTransactionContext({
        matterKind: 'sale',
        clientRole: 'seller',
        primaryConcern: 'compliance',
      }),
    })
    expect(compliance.status).toBe('attorney_review_recommended')
  })

  it('flags incomplete when condo track has outstanding diligence documents', () => {
    const summary = buildMatterReadinessSummary({
      transactionContext: createEmptyTransactionContext({
        matterKind: 'condo_transaction',
        clientRole: 'buyer',
        propertyKind: 'condominium',
        transactionStage: 'diligence',
      }),
      propertyType: 'Condo',
      condoRequiredDocuments: [
        { status: 'received' },
        { status: 'outstanding' },
        { status: 'requested' },
      ],
    })
    expect(summary.status).toBe('information_incomplete')
    expect(summary.message).toMatch(/Condo diligence items remain outstanding/i)
    expect(summary.items.join(' ')).toMatch(/2 condo diligence document/i)
  })

  it('does not invent legal compliance language in readiness messages', () => {
    const messages = [
      buildMatterReadinessSummary({}).message,
      buildMatterReadinessSummary({
        transactionContext: createEmptyTransactionContext({
          matterKind: 'purchase',
          clientRole: 'buyer',
        }),
      }).message,
      buildMatterReadinessSummary({
        transactionContext: createEmptyTransactionContext({
          matterKind: 'property_dispute',
          clientRole: 'owner',
        }),
      }).message,
    ].join(' ')
    expect(messages).not.toMatch(/legally compliant|liable|must disclose|eligible to buy/i)
  })
})
