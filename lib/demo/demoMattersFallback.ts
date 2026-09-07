/**
 * Pure copy helpers for demo matters not-found / error fallbacks.
 * Never include stack traces, secrets, or raw internal IDs in user-facing text.
 */

export type DemoMattersFallbackKind = 'not_found' | 'error'

export type DemoMattersFallbackCopy = {
  kind: DemoMattersFallbackKind
  title: string
  description: string
  recoveryLabel: string
  recoveryHref: '/demo/matters'
}

const RECOVERY_HREF = '/demo/matters' as const

/** Sanitize a route param for optional non-sensitive display (file-like refs only). */
export function sanitizeDemoMatterRefForDisplay(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  // Allow common demo file refs only; reject anything that looks like a stack/token/path dump.
  if (trimmed.length > 64) return null
  if (!/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(trimmed)) return null
  if (trimmed.includes('..')) return null
  return trimmed
}

export function buildDemoMatterNotFoundCopy(options?: {
  attemptedRef?: string | null
}): DemoMattersFallbackCopy {
  const safeRef = sanitizeDemoMatterRefForDisplay(options?.attemptedRef)
  return {
    kind: 'not_found',
    title: 'Matter not found',
    description: safeRef
      ? `We couldn’t find “${safeRef}” in this demo. It may have been removed, or the link may be incorrect.`
      : 'We couldn’t find that matter in this demo. It may have been removed, or the link may be incorrect.',
    recoveryLabel: 'Back to matters',
    recoveryHref: RECOVERY_HREF,
  }
}

export function buildDemoMattersErrorCopy(): DemoMattersFallbackCopy {
  return {
    kind: 'error',
    title: 'Something went wrong',
    description:
      'This demo page hit an unexpected problem. You can return to the matters list and try again.',
    recoveryLabel: 'Back to matters',
    recoveryHref: RECOVERY_HREF,
  }
}

/** True when a detail-route param should trigger not-found (missing / blank / unknown seed). */
export function shouldNotFoundDemoMatterParam(
  id: string | null | undefined,
  resolve: (id: string | null | undefined) => unknown | null,
): boolean {
  if (typeof id !== 'string' || !id.trim()) return true
  return resolve(id) == null
}
