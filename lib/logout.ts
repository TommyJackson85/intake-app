// lib/logout.ts
// Client-side logout utility

'use client'

import { createSupabaseBrowserClient } from './browserClient'
import {
  DEMO_LOCAL_STORAGE_KEYS,
  DEMO_SESSION_STORAGE_KEYS,
} from '@/lib/demo/demoPersistence'

/**
 * Snapshot demo sandbox keys, clear browser storage, then restore them.
 * Dashboard logout must not wipe the public `/demo` localStorage experience.
 */
function clearBrowserStoragePreservingDemoKeys() {
  if (typeof window === 'undefined') return

  const localKeep: Array<[string, string]> = []
  for (const key of DEMO_LOCAL_STORAGE_KEYS) {
    try {
      const value = window.localStorage.getItem(key)
      if (value !== null) localKeep.push([key, value])
    } catch {
      /* ignore */
    }
  }

  const sessionKeep: Array<[string, string]> = []
  for (const key of DEMO_SESSION_STORAGE_KEYS) {
    try {
      const value = window.sessionStorage.getItem(key)
      if (value !== null) sessionKeep.push([key, value])
    } catch {
      /* ignore */
    }
  }

  try {
    window.localStorage.clear()
  } catch {
    /* ignore */
  }
  try {
    window.sessionStorage.clear()
  } catch {
    /* ignore */
  }

  for (const [key, value] of localKeep) {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      /* ignore */
    }
  }
  for (const [key, value] of sessionKeep) {
    try {
      window.sessionStorage.setItem(key, value)
    } catch {
      /* ignore */
    }
  }
}

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

    clearBrowserStoragePreservingDemoKeys()

    console.log('[Client Logout] Client logout completed, redirecting to server logout')
    
    // Redirect to server logout route to clear cookies
    window.location.href = '/auth/logout'
  } catch (error) {
    console.error('[Client Logout] Error during logout:', error)
    // Fallback: redirect to login
    window.location.href = '/auth/signin'
  }
}
