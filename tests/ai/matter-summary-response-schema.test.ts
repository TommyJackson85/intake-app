import { describe, expect, it } from 'vitest'
import {
  MATTER_SUMMARY_RESPONSE_EXAMPLE,
  matterSummaryResponseSchema,
  parseMatterSummaryResponse,
  safeParseMatterSummaryResponse,
} from '@/lib/ai/schemas/matter-summary-response'

describe('matterSummaryResponseSchema', () => {
  it('parses the bundled example', () => {
    const r = parseMatterSummaryResponse(MATTER_SUMMARY_RESPONSE_EXAMPLE)
    expect(r.responseKind).toBe('ai_matter_summary_draft')
    expect(r.requiresHumanReview).toBe(true)
  })

  it('accepts a minimal valid object', () => {
    const data = {
      schemaVersion: '1.0.0',
      responseKind: 'ai_matter_summary_draft',
      headline: 'Test headline',
      narrativeSummary: 'Test narrative with enough content.',
      matterStageInterpretation: 'unclear',
      keyRisksAndConcerns: [{ title: 'Risk A' }],
      missingInformation: [],
      recommendedNextSteps: ['Step one'],
      requiresHumanReview: true,
      reviewReasons: ['Test'],
      confidenceLabel: 'low',
    }
    const r = matterSummaryResponseSchema.parse(data)
    expect(r.keyRisksAndConcerns).toHaveLength(1)
  })

  it('rejects wrong responseKind', () => {
    const bad = { ...MATTER_SUMMARY_RESPONSE_EXAMPLE, responseKind: 'final_legal_holdings' }
    const r = safeParseMatterSummaryResponse(bad)
    expect(r.success).toBe(false)
  })

  it('rejects invalid stage enum', () => {
    const bad = { ...MATTER_SUMMARY_RESPONSE_EXAMPLE, matterStageInterpretation: 'litigation' }
    const r = safeParseMatterSummaryResponse(bad)
    expect(r.success).toBe(false)
  })

  it('rejects too many risk items', () => {
    const risks = Array.from({ length: 15 }, (_, i) => ({ title: `Risk ${i}` }))
    const bad = { ...MATTER_SUMMARY_RESPONSE_EXAMPLE, keyRisksAndConcerns: risks }
    const r = safeParseMatterSummaryResponse(bad)
    expect(r.success).toBe(false)
  })
})
