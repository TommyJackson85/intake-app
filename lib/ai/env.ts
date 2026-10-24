/**
 * Centralized access to AI-related environment variables (server-side only).
 * Do not import this from client components — keys must stay off the wire to browsers.
 */

/** Default model id; override with ANTHROPIC_MODEL for upgrades or regional defaults. */
export const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-4-20250514'

export function getAnthropicApiKey(): string | undefined {
  const k = process.env.ANTHROPIC_API_KEY?.trim()
  return k && k.length > 0 ? k : undefined
}

export function getAnthropicModel(): string {
  const m = process.env.ANTHROPIC_MODEL?.trim()
  return m && m.length > 0 ? m : DEFAULT_ANTHROPIC_MODEL
}

/**
 * Gates `POST /api/demo/dev/generate-matter-summary` (used by the dev-only page `/demo/dev/ai-payloads`).
 * Fail closed unless explicitly enabled — prototype / lab tooling, not a production feature.
 *
 * Requires both:
 * - `NODE_ENV !== 'production'` (hard block on production builds even if the flag is set), and
 * - `ENABLE_DEV_AI_GENERATION=true` on the server for intentional local/staging testing.
 *
 * Optional header secret (`DEV_AI_ROUTE_SECRET` + `x-dev-ai-secret`) is intentionally omitted here:
 * a browser cannot send it without exposing a `NEXT_PUBLIC_*` value. Add later via server action,
 * VPN, or tooling that injects headers — not from this client bundle.
 */
export function isDevAiMatterSummaryRouteEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') return false
  return process.env.ENABLE_DEV_AI_GENERATION === 'true'
}
