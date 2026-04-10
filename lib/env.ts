/**
 * Central environment helpers for demo vs developer sudo.
 * Separates user-facing demo from internal dev-only sudo/impersonation.
 */

/**
 * True when running outside production (development, test, or staging).
 * Use for feature flags that should never be enabled in production.
 */
export function isNonProductionEnv(): boolean {
  return process.env.NODE_ENV !== 'production'
}

/**
 * True when developer sudo/impersonation is allowed.
 * - In production: only if ENABLE_PROD_IMPERSONATION === 'true' (GDPR trade-off; must be explicit).
 * - In non-production: true unless ENABLE_SUDO === 'false'.
 */
export function isSudoEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return process.env.ENABLE_PROD_IMPERSONATION === 'true'
  }
  if (process.env.ENABLE_SUDO === 'false') return false
  return true
}

/**
 * True when the "Sign up as developer" checkbox should be shown.
 * Only in non-production; does NOT grant sudo powers.
 */
export function isDevSignupAllowed(): boolean {
  return isNonProductionEnv() && process.env.NEXT_PUBLIC_ALLOW_DEV_SIGNUP === 'true'
}
