import { describe, expect, it } from 'vitest'
import { demoSeedData } from '@/lib/demo/demoData'
import { buildMatterSummaryPayload } from '@/lib/ai/builders/build-matter-summary-payload'
import { safeParseMatterSummaryPayloadRequest } from '@/lib/ai/schemas/matter-summary-payload'

describe('matterSummaryPayloadRequestSchema', () => {
  it('accepts output of buildMatterSummaryPayload for seed matter-001', () => {
    const matter = demoSeedData.matters.find((m) => m.id === 'matter-001')
    if (!matter) throw new Error('fixture missing')
    const payload = buildMatterSummaryPayload({
      matter,
      documents: [],
      documentRequests: [],
      generatedAtIso: '2026-05-01T12:00:00.000Z',
    })
    const r = safeParseMatterSummaryPayloadRequest(payload)
    expect(r.success).toBe(true)
  })
})
