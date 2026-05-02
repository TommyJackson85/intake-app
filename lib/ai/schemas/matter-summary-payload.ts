/**
 * Request validation for POST bodies that carry a `MatterSummaryPayload` (e.g. dev API route).
 * Kept permissive on string subfields so minor demo drift still parses; top-level structure is strict.
 */

import { z } from 'zod'
import { MATTER_SUMMARY_PAYLOAD_SCHEMA_VERSION } from '@/lib/ai/builders/build-matter-summary-payload'

export const matterSummaryPayloadRequestSchema = z.object({
  schemaVersion: z.literal(MATTER_SUMMARY_PAYLOAD_SCHEMA_VERSION),
  payloadKind: z.literal('matter_summary'),
  generatedAtIso: z.string().min(1),
  systemContractVersion: z.string().min(1),
  identity: z.object({
    matterId: z.string().min(1),
    fileId: z.string().min(1),
    matterType: z.string(),
    hasPortalToken: z.boolean(),
  }),
  property: z.object({
    address: z.string(),
    county: z.string(),
    propertyType: z.string(),
  }),
  transaction: z.object({
    transactionType: z.string(),
    purchasePrice: z.number(),
    financingType: z.string(),
    hoaFlag: z.boolean(),
    keyDates: z.object({
      effectiveDate: z.string(),
      inspectionDeadline: z.string(),
      loanApprovalDeadline: z.string(),
      closingDate: z.string(),
    }),
  }),
  status: z.object({
    matterStatusStored: z.string(),
    matterStatusDerivedFromTasks: z.string(),
  }),
  parties: z.object({
    buyer: z.object({
      name: z.string(),
      partyType: z.enum(['individual', 'entity']).optional(),
    }),
    seller: z.object({
      name: z.string(),
      partyType: z.enum(['individual', 'entity']).optional(),
    }),
    displayRows: z.array(z.object({ label: z.string(), value: z.string() })),
  }),
  tasks: z.object({
    counts: z.object({
      notStarted: z.number().int().nonnegative(),
      inProgress: z.number().int().nonnegative(),
      completed: z.number().int().nonnegative(),
    }),
    items: z.array(
      z.object({
        title: z.string(),
        status: z.enum(['not_started', 'in_progress', 'completed']),
      }),
    ),
  }),
  documents: z.object({
    matterDocumentCount: z.number().int().nonnegative(),
    byReviewStatus: z.object({
      draft: z.number().int().nonnegative(),
      reviewed: z.number().int().nonnegative(),
      final: z.number().int().nonnegative(),
    }),
    documentRequestsOpen: z.number().int().nonnegative(),
    documentRequestsFulfilled: z.number().int().nonnegative(),
  }),
  compliance: z.object({
    fincen: z.object({
      eligible: z.boolean(),
      reportStatus: z.enum(['not_started', 'in_progress', 'ready']).optional(),
      completedFields: z.number().int().optional(),
      beneficialOwnerCount: z.number().int().optional(),
      certRequestPendingClient: z.boolean().optional(),
    }),
    condoDiligence: z.object({
      eligible: z.boolean(),
      rowPresent: z.boolean(),
      applicable: z.boolean().optional(),
      status: z
        .enum(['not_started', 'in_progress', 'under_review', 'cleared', 'flagged'])
        .optional(),
      requiredDocumentsTotal: z.number().int().optional(),
      requiredDocumentsOutstanding: z.number().int().optional(),
      requiredDocumentsRequested: z.number().int().optional(),
      requiredDocumentsReceived: z.number().int().optional(),
      findingsCount: z.number().int().optional(),
    }),
  }),
  timeline: z.object({
    activeEventCount: z.number().int().nonnegative(),
    recentNotes: z.array(z.object({ at: z.string(), note: z.string() })),
  }),
})

export type MatterSummaryPayloadRequest = z.infer<typeof matterSummaryPayloadRequestSchema>

export function safeParseMatterSummaryPayloadRequest(data: unknown) {
  return matterSummaryPayloadRequestSchema.safeParse(data)
}
