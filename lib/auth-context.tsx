'use client'

import React, { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from './browserClient'
import type { Database } from '@/lib/database.types'
import { usePathname } from 'next/navigation'

//This gives you the exact Row type of profiles
type ProfileRow = Database['public']['Tables']['profiles']['Row']
type FirmRow = Database['public']['Tables']['firms']['Row']

interface AuthContextType {
  session: Session | null
  profile: ProfileRow | null
  firm: FirmRow | null
  loading: boolean
  impersonating: boolean
  show_dev_sudo: boolean
}

const AuthContext = React.createContext<AuthContextType>({
  session: null,
  profile: null,
  firm: null,
  loading: true,
  impersonating: false,
  show_dev_sudo: false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [firm, setFirm] = useState<FirmRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [impersonating, setImpersonating] = useState(false)
  const [showDevSudo, setShowDevSudo] = useState(false)

  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    if (pathname?.startsWith('/demo')) {
      // Demo route is intentionally local-only and does not use Supabase.
      setSession(null)
      setProfile(null)
      setFirm(null)
      setImpersonating(false)
      setShowDevSudo(false)
      setLoading(false)
      return
    }

    const supabase = createSupabaseBrowserClient()

    const fetchProfileAndFirm = async (_userId: string) => {
      // Use /api/auth/me (server-side, service-role) so profile/firm load reliably.
      // Client-side Supabase + RLS can block firm reads, causing firm=null and demo banner to not show.
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        if (res.ok) {
          const { profile: p, firm: f, impersonating: imp, show_dev_sudo: sds } = await res.json()
          setProfile(p)
          setFirm(f)
          setImpersonating(imp ?? false)
          setShowDevSudo(sds ?? false)
        } else {
          setProfile(null)
          setFirm(null)
          setImpersonating(false)
          setShowDevSudo(false)
        }
      } catch {
        setProfile(null)
        setFirm(null)
        setImpersonating(false)
        setShowDevSudo(false)
      }
    }

    if (!supabase) {
      setLoading(false)
      return
    }

    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setSession(session)

      if (session) {
        await fetchProfileAndFirm(session.user.id)
      } else {
        setProfile(null)
        setFirm(null)
        setImpersonating(false)
        setShowDevSudo(false)
      }

      setLoading(false)
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchProfileAndFirm(session.user.id)
      } else {
        setProfile(null)
        setFirm(null)
        setImpersonating(false)
        setShowDevSudo(false)
      }
    })

    return () => subscription?.unsubscribe()
  }, [pathname])

  return (
    <AuthContext.Provider value={{ session, profile, firm, loading, impersonating, show_dev_sudo: showDevSudo }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
 const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}