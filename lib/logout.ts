// lib/logout.ts
// Client-side logout utility

'use client'

import { createSupabaseBrowserClient } from './browserClient'
import { useRouter } from 'next/navigation'

/**
 * Client-side logout function
 * Clears Supabase session and redirects to login
 */
export async function handleClientLogout() {
  console.log('[Client Logout] Initiating logout')
  
  try {
    const supabase = createSupabaseBrowserClient()
    
    // Sign out from Supabase (clears session storage, etc.)
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('[Client Logout] Supabase signout error:', error)
      // Continue anyway - we'll clear server-side on redirect
    }

    // Clear any client-side storage
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
    }

    console.log('[Client Logout] Client logout completed, redirecting to server logout')
    
    // Redirect to server logout route to clear cookies
    window.location.href = '/auth/logout'
  } catch (error) {
    console.error('[Client Logout] Error during logout:', error)
    // Fallback: redirect to login
    window.location.href = '/auth/signin'
  }
}
