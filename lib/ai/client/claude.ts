/**
 * Thin Claude (Anthropic) client factory — provider-specific, replaceable later.
 * Server-side only.
 */

import Anthropic from '@anthropic-ai/sdk'
import { getAnthropicApiKey } from '@/lib/ai/env'

export type ClaudeClient = Anthropic

/**
 * Create a configured Anthropic SDK client. Throws if API key is missing.
 * Callers that need a soft check should use `getAnthropicApiKey()` first.
 */
export function createClaudeClient(overrides?: { apiKey?: string }): ClaudeClient {
  const apiKey = overrides?.apiKey ?? getAnthropicApiKey()
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set')
  }
  return new Anthropic({ apiKey })
}
