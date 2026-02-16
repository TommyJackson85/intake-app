// lib/post-login-routing.ts
// Post-login routing logic: redirects users to firm-setup if they don't have a firm

import { createSupabaseServerClientStrict } from './serverClientStrict'
import { CURRENT_TERMS_VERSION, needsTermsAcceptance } from './terms-config'

export interface PostLoginRouteResult {
  shouldRedirect: boolean
  redirectTo: string | null
  reason?: string
}

/**
 * Determines where a user should be redirected after login
 * - If user needs to accept updated terms: redirect to /auth/accept-terms (highest priority)
 * - If user has no firm: redirect to /dashboard/firm-setup
 * - If user has firm: redirect to /dashboard
 */
export async function getPostLoginRoute(userId: string): Promise<PostLoginRouteResult> {
  try {
    const supabase = await createSupabaseServerClientStrict()

    // Fetch user profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('firm_id, terms_accepted_at, terms_version')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      console.error('[PostLoginRouting] Error fetching profile:', error)
      // Default to dashboard - let it handle the error
      return { shouldRedirect: false, redirectTo: null }
    }

    // Check if user needs to accept updated terms (highest priority)
    if (needsTermsAcceptance(profile.terms_version, profile.terms_accepted_at)) {
      return {
        shouldRedirect: true,
        redirectTo: '/auth/accept-terms',
        reason: 'terms_update_required',
      }
    }

    // Check if user has a firm
    if (!profile.firm_id) {
      return {
        shouldRedirect: true,
        redirectTo: '/dashboard/firm-setup',
        reason: 'no_firm',
      }
    }

    // User has firm and accepted terms - go to dashboard
    return {
      shouldRedirect: false,
      redirectTo: null,
    }
  } catch (error) {
    console.error('[PostLoginRouting] Error in getPostLoginRoute:', error)
    // On error, default to dashboard
    return { shouldRedirect: false, redirectTo: null }
  }
}
