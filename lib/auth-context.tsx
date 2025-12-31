'use client'

import React, { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from './browserClient'
import type { Database } from '@/lib/database.types'

//This gives you the exact Row type of profiles
type ProfileRow = Database['public']['Tables']['profiles']['Row']

interface AuthContextType {
  session: Session | null
  profile: ProfileRow | null
  loading: boolean
}

const AuthContext = React.createContext<AuthContextType>({
  session: null,
  profile: null,
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setSession(session)

      if (session) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (!error && data) {
          setProfile(data)
        }
      }

      setLoading(false)
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) setProfile(null)
    })

    return () => subscription?.unsubscribe()
  }, [supabase])

  return (
    <AuthContext.Provider value={{ session, profile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
 const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}