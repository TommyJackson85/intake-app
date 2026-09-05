import { describe, expect, it } from 'vitest'
import { demoSeedData } from '@/lib/demo/demoData'
import {
  buildMatterSummaryPayload,
  MATTER_SUMMARY_PAYLOAD_SCHEMA_VERSION,
} from '@/lib/ai/builders/build-matter-summary-payload'
import { systemContract } from '@/lib/domain/system-contract'

describe('buildMatterSummaryPayload', () => {
  const matter = demoSeedData.matters.find((m) => m.id === 'matter-001')
  if (!matter) throw new Error('fixture matter-001 missing from demoSeedData')

  it('returns stable top-level shape aligned with schema version', () => {
    const payload = buildMatterSummaryPayload({
      matter,
      documents: [],
      documentRequests: [],
      generatedAtIso: '2026-05-01T12:00:00.000Z',
    })

    expect(payload.schemaVersion).toBe(MATTER_SUMMARY_PAYLOAD_SCHEMA_VERSION)
    expect(payload.payloadKind).toBe('matter_summary')
    expect(payload.generatedAtIso).toBe('2026-05-01T12:00:00.000Z')
    expect(payload.systemContractVersion).toBe(systemContract.meta.version)

    expect(payload.identity).toEqual({
      matterId: 'matter-001',
      fileId: 'FL-2026-001',
      matterType: 'Financed Residential Purchase',
      hasPortalToken: true,
    })

    expect(payload.property.county).toBe('Orange County')
    expect(payload.transaction.purchasePrice).toBe(385000)
    expect(payload.status.matterStatusStored).toBe('Cleared to Close')
    expect(payload.tasks.counts.completed).toBeGreaterThan(0)
    expect(payload.tasks.items.length).toBeGreaterThan(0)
    expect(payload.documents.matterDocumentCount).toBe(0)
    expect(payload.documents.documentRequestsOpen).toBe(0)
    expect(payload.compliance.fincen.eligible).toBe(false)
    expect(payload.compliance.condoDiligence.eligible).toBe(false)
    expect(payload.timeline.recentNotes.length).toBeGreaterThan(0)
  })

  it('filters documents and requests to the matter id', () => {
    const payload = buildMatterSummaryPayload({
      matter,
      documents: [
        {
          id: 'd1',
          matter_id: matter.id,
          name: 'Test',
          category: 'Contract',
          uploaded_at: '2026-01-01T00:00:00.000Z',
          uploaded_by_staff_id: 'staff-1',
          status: 'draft',
          deletedAt: null,
        },
        {
          id: 'd2',
          matter_id: 'other-matter',
          name: 'Other',
          category: 'Contract',
          uploaded_at: '2026-01-01T00:00:00.000Z',
          uploaded_by_staff_id: 'staff-1',
          status: 'final',
          deletedAt: null,
        },
      ],
      documentRequests: [
        {
          id: 'r1',
          matter_id: matter.id,
          title: 'Need HOA',
          description: null,
          category: 'Compliance',
          requested_at: '2026-01-01T00:00:00.000Z',
          requested_by_staff_id: 'staff-1',
          status: 'open',
          fulfilled_document_id: null,
          staff_receipt_acknowledged_at: null,
    staff_receipt_reviewed_by_staff_id: null,
    staff_receipt_reviewed_document_id: null,
    staff_follow_up: { status: 'none' as const, note: '', markedById: null, markedByName: null, markedAt: null },
        },
      ],
    })

    expect(payload.documents.matterDocumentCount).toBe(1)
    expect(payload.documents.byReviewStatus.draft).toBe(1)
    expect(payload.documents.byReviewStatus.final).toBe(0)
    expect(payload.documents.documentRequestsOpen).toBe(1)
  })
})
