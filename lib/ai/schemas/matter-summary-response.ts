/**
 * Zod contract for **future** AI-generated matter summaries (draft / assistive only).
 *
 * Pairs with `buildMatterSummaryPayload` as output vs input: the payload is the stable handoff *into*
 * a model; this schema is what we validate *out* of a model before showing or storing anything.
 *
 * Not legal advice, not a filing, not autonomous workflow — human review is always expected when
 * `requiresHumanReview` is true or when policy requires it.
 */

import { z } from 'zod'

/** High-level stage read the model is allowed to suggest — not the system of record for `DemoMatter.status`. */
export const matterSummaryStageInterpretationSchema = z.enum([
  'intake',
  'diligence_and_title',
  'pre_closing',
  'closing',
  'post_closing',
  'unclear',
])

export type MatterSummaryStageInterpretation = z.infer<typeof matterSummaryStageInterpretationSchema>

/** Coarse confidence for routing review — not a statistical score. */
export const matterSummaryConfidenceLabelSchema = z.enum(['low', 'medium', 'high'])

export type MatterSummaryConfidenceLabel = z.infer<typeof matterSummaryConfidenceLabelSchema>

export const matterSummaryRiskItemSchema = z.object({
  title: z.string().min(1).max(200).describe('Short risk or concern label'),
  detail: z
    .string()
    .max(800)
    .optional()
    .describe('Optional elaboration; keep factual and non-conclusive'),
})

export type MatterSummaryRiskItem = z.infer<typeof matterSummaryRiskItemSchema>

/**
 * Draft summary object safe to validate after provider returns JSON.
 * Bump `schemaVersion` only on breaking changes.
 */
export const matterSummaryResponseSchema = z.object({
  schemaVersion: z.literal('1.0.0'),
  responseKind: z.literal('ai_matter_summary_draft'),

  headline: z
    .string()
    .min(1)
    .max(180)
    .describe('One-line headline for the summary card — not a legal conclusion'),

  narrativeSummary: z
    .string()
    .min(1)
    .max(4000)
    .describe('Short plain-language overview for staff review'),

  matterStageInterpretation: matterSummaryStageInterpretationSchema.describe(
    'Model guess at lifecycle stage; must not replace recorded matter status',
  ),

  keyRisksAndConcerns: z
    .array(matterSummaryRiskItemSchema)
    .max(12)
    .describe('Structured risks — prefer bullets over one long paragraph'),

  missingInformation: z
    .array(z.string().max(400))
    .max(20)
    .describe('Gaps or open questions; not a substitute for checklist completion'),

  recommendedNextSteps: z
    .array(z.string().max(500))
    .max(20)
    .describe('Suggested actions for staff; not auto-executed'),

  clientFacingFollowUpSuggestion: z
    .string()
    .max(1500)
    .optional()
    .describe('Draft client communication idea — requires attorney approval before send'),

  internalStaffNoteSuggestion: z
    .string()
    .max(2000)
    .optional()
    .describe('Draft internal note — paste-only workflow until explicitly approved'),

  requiresHumanReview: z
    .boolean()
    .describe('If true, UI must not treat content as approved for client or filing'),

  reviewReasons: z
    .array(z.string().max(300))
    .max(15)
    .describe('Why a human should review (e.g. high stakes, missing docs, compliance)'),

  confidenceLabel: matterSummaryConfidenceLabelSchema.describe(
    'Review routing hint only — not calibrated probability',
  ),

  assistiveDisclaimer: z
    .string()
    .max(500)
    .optional()
    .describe('Optional short disclaimer line from the model or templating layer'),
})

export type MatterSummaryResponse = z.infer<typeof matterSummaryResponseSchema>

/** Strict parse — throws `ZodError` on failure. */
export function parseMatterSummaryResponse(data: unknown): MatterSummaryResponse {
  return matterSummaryResponseSchema.parse(data)
}

export function safeParseMatterSummaryResponse(data: unknown) {
  return matterSummaryResponseSchema.safeParse(data)
}

/**
 * Minimal valid example for docs/tests — still a draft, not live matter data.
 */
export const MATTER_SUMMARY_RESPONSE_EXAMPLE: MatterSummaryResponse = {
  schemaVersion: '1.0.0',
  responseKind: 'ai_matter_summary_draft',
  headline: 'Residential purchase advancing toward closing — open title and HOA items',
  narrativeSummary:
    'The file appears to be a financed residential purchase with several checklist items complete. ' +
    'Outstanding work likely includes payoff coordination and final closing package preparation. ' +
    'This text is illustrative only and requires attorney verification.',
  matterStageInterpretation: 'pre_closing',
  keyRisksAndConcerns: [
    { title: 'Timeline pressure near closing date', detail: 'Confirm all deadlines are calendared.' },
    { title: 'Document gaps', detail: 'Verify association or estoppel items if applicable.' },
  ],
  missingInformation: ['Final lender figures', 'Confirmed wire instructions process'],
  recommendedNextSteps: [
    'Confirm payoff figures with seller lender',
    'Finalize closing disclosure draft for review',
  ],
  clientFacingFollowUpSuggestion:
    'Draft only: we are preparing closing documents and will confirm the signing appointment shortly.',
  internalStaffNoteSuggestion: 'Draft only: follow up on open document requests before CD final.',
  requiresHumanReview: true,
  reviewReasons: ['Draft AI output', 'Financial and compliance-sensitive matter'],
  confidenceLabel: 'medium',
  assistiveDisclaimer: 'Assistive draft — not legal advice. Attorney review required.',
}
