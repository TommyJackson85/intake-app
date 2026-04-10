'use client'

import { useAuth } from '@/lib/auth-context'
import { ImpersonationBanner } from '@/components/ImpersonationBanner'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { session, profile, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/auth/signin')
      return
    }
    if (!loading && session && profile && profile.role !== 'client') {
      // Law-firm users should not use the client portal.
      router.replace('/dashboard')
      return
    }
  }, [loading, session, profile, router, pathname])

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading…</div>
  if (!session) return null

  return (
    <div style={{ minHeight: '100vh', background: '#fcfcf9' }}>
      <ImpersonationBanner />
      <header
        style={{
          background: 'white',
          borderBottom: '1px solid rgba(94, 82, 64, 0.2)',
          padding: '16px 0',
        }}
      >
        <div style={{ maxWidth: '980px', margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 900, color: '#134252' }}>Client portal</div>
          <nav style={{ display: 'flex', gap: '14px', alignItems: 'center', fontSize: '14px' }}>
            <Link href="/portal" style={{ color: '#208096', textDecoration: 'none', fontWeight: 800 }}>Home</Link>
            <Link href="/privacy" style={{ color: '#627c71', textDecoration: 'none', fontWeight: 700 }}>Privacy</Link>
            <a href="/auth/logout" style={{ color: '#627c71', textDecoration: 'none', fontWeight: 700 }}>Sign out</a>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: '980px', margin: '0 auto', padding: '28px 20px' }}>{children}</main>
    </div>
  )
}

