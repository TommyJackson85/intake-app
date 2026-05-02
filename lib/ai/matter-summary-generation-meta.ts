/**
 * Dev-only observability for matter-summary generation (no secrets, no PII).
 * Shared type so client dev tools can type the API envelope without importing server workflows.
 */

export type MatterSummaryGenerationMeta = {
  /** Model id sent to the provider (e.g. env default or override). */
  model: string
  /** Wall time for the provider `messages.create` call (ms). */
  providerDurationMs: number
  /** `max_tokens` passed on the request. */
  maxTokensRequested: number
  /** Anthropic message id when the provider returned a message. */
  anthropicMessageId?: string
  stopReason?: string | null
  inputTokens?: number
  outputTokens?: number
}
