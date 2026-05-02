/**
 * Dev / server workflow: call Claude once, then validate against `matterSummaryResponseSchema`.
 * No UI, no store, no OpenClaw — replaceable provider boundary.
 */

import Anthropic from '@anthropic-ai/sdk'
import type { Message } from '@anthropic-ai/sdk/resources/messages/messages'
import type { MatterSummaryPayload } from '@/lib/ai/builders/build-matter-summary-payload'
import { createClaudeClient } from '@/lib/ai/client/claude'
import { getAnthropicApiKey, getAnthropicModel } from '@/lib/ai/env'
import type { MatterSummaryGenerationMeta } from '@/lib/ai/matter-summary-generation-meta'
import {
  MATTER_SUMMARY_SYSTEM_PROMPT,
  buildMatterSummaryUserPrompt,
} from '@/lib/ai/prompts/matter-summary-generation'
import type { MatterSummaryResponse } from '@/lib/ai/schemas/matter-summary-response'
import { safeParseMatterSummaryResponse } from '@/lib/ai/schemas/matter-summary-response'
import { extractJsonStringFromModelText } from '@/lib/ai/utils/extract-json-from-model-text'

export type GenerateMatterSummarySuccess = {
  ok: true
  data: MatterSummaryResponse
  meta: MatterSummaryGenerationMeta
  rawText?: string
}

export type SchemaValidationIssue = { path: string; message: string }

export type GenerateMatterSummaryFailure = {
  ok: false
  errorKind: 'missing_api_key' | 'provider_error' | 'invalid_json' | 'schema_validation_failed'
  message: string
  rawText?: string
  issues?: SchemaValidationIssue[]
  /** Present when the provider was called (or failed after timing started). */
  meta?: MatterSummaryGenerationMeta
}

export type GenerateMatterSummaryResult = GenerateMatterSummarySuccess | GenerateMatterSummaryFailure

export type GenerateMatterSummaryOptions = {
  /** Inject client for tests; otherwise created with env API key. */
  client?: Anthropic
  model?: string
  maxTokens?: number
}

function collectTextFromMessage(content: Message['content']): string {
  const parts: string[] = []
  for (const block of content) {
    if (block.type === 'text') {
      parts.push(block.text)
    }
  }
  return parts.join('\n').trim()
}

/**
 * Generate a draft matter summary via Claude and validate with Zod before returning.
 */
export async function generateMatterSummaryDraft(
  payload: MatterSummaryPayload,
  options: GenerateMatterSummaryOptions = {},
): Promise<GenerateMatterSummaryResult> {
  if (!getAnthropicApiKey() && !options.client) {
    return {
      ok: false,
      errorKind: 'missing_api_key',
      message: 'ANTHROPIC_API_KEY is not set. Cannot call Claude.',
    }
  }

  const client = options.client ?? createClaudeClient()
  const model = options.model ?? getAnthropicModel()
  const maxTokens = options.maxTokens ?? 4096

  const providerStarted = performance.now()
  let message: Message
  try {
    message = await client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature: 0.2,
      system: MATTER_SUMMARY_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildMatterSummaryUserPrompt(payload) }],
    })
  } catch (e) {
    const providerDurationMs = Math.round(performance.now() - providerStarted)
    const errMessage = e instanceof Error ? e.message : 'Unknown provider error'
    return {
      ok: false,
      errorKind: 'provider_error',
      message: errMessage,
      meta: { model, maxTokensRequested: maxTokens, providerDurationMs },
    }
  }

  const providerDurationMs = Math.round(performance.now() - providerStarted)
  const meta: MatterSummaryGenerationMeta = {
    model: String(message.model),
    maxTokensRequested: maxTokens,
    providerDurationMs,
    anthropicMessageId: message.id,
    stopReason: message.stop_reason,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  }

  const rawText = collectTextFromMessage(message.content)

  const jsonSlice = extractJsonStringFromModelText(rawText)

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonSlice) as unknown
  } catch (e) {
    const errMessage = e instanceof Error ? e.message : 'JSON parse failed'
    return {
      ok: false,
      errorKind: 'invalid_json',
      message: errMessage,
      rawText,
      meta,
    }
  }

  const validated = safeParseMatterSummaryResponse(parsed)
  if (!validated.success) {
    const issues: SchemaValidationIssue[] = validated.error.issues.map((issue) => ({
      path: issue.path.length > 0 ? issue.path.join('.') : '(root)',
      message: issue.message,
    }))
    return {
      ok: false,
      errorKind: 'schema_validation_failed',
      message: 'Model output did not match matterSummaryResponseSchema.',
      rawText,
      issues,
      meta,
    }
  }

  return { ok: true, data: validated.data, meta, rawText }
}
