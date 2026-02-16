// lib/terms-config.ts
// Configuration for terms versioning

/**
 * Current version of the Terms of Use
 * Increment this when terms are updated to trigger re-acceptance flow
 */
export const CURRENT_TERMS_VERSION = '1.0'

/**
 * Check if user needs to accept updated terms
 */
export function needsTermsAcceptance(
  userTermsVersion: string | null | undefined,
  userTermsAcceptedAt: string | null | undefined
): boolean {
  // User has never accepted terms
  if (!userTermsAcceptedAt || !userTermsVersion) {
    return true
  }

  // User's version doesn't match current version
  return userTermsVersion !== CURRENT_TERMS_VERSION
}
