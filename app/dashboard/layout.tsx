'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { needsTermsAcceptance } from '@/lib/terms-config'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { session, profile, firm, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const hasFirm = Boolean(profile?.firm_id)
  const isTestFirm = Boolean(firm?.is_test_firm)
  const isFirmSetupPage = pathname === '/dashboard/firm-setup'

  useEffect(() => {
    if (!loading && !session) {
      router.push('/auth/signin')
      return
    }

    // Terms acceptance has highest priority
    if (!loading && session && profile) {
      const p: any = profile
      if (needsTermsAcceptance(p.terms_version, p.terms_accepted_at)) {
        router.replace('/auth/accept-terms')
        return
      }
    }

    // Role split: clients should never see the law-firm dashboard.
    if (!loading && session && profile?.role === 'client') {
      router.replace('/portal')
      return
    }

    // Post-login routing: redirect to firm-setup if user has no firm
    // Skip redirect if already on firm-setup page to avoid loops
    if (!loading && session && !hasFirm && !isFirmSetupPage) {
      router.push('/dashboard/firm-setup')
    }
  }, [session, loading, router, hasFirm, isFirmSetupPage])

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault()
    // Use server-side logout route
    window.location.href = '/auth/logout'
  }

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
  }

  if (!session) {
    return null
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: '250px',
        background: '#134252',
        color: 'white',
        padding: '20px',
        position: 'fixed',
        height: '100vh',
        overflowY: 'auto',
      }}>
        <div style={{ marginBottom: '40px', fontSize: '20px', fontWeight: 600 }}>
          ⚖️ LawIntake
          {isTestFirm && (
            <span
              style={{
                display: 'inline-block',
                marginLeft: '8px',
                fontSize: '11px',
                background: '#90cfd9',
                color: '#134252',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 600,
              }}
            >
              Dev
            </span>
          )}
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {hasFirm && (
            <>
              <a href="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>Dashboard</a>
              <a href="/dashboard/matters" style={{ color: 'white', textDecoration: 'none' }}>Matters</a>
              <a href="/dashboard/intakes" style={{ color: 'white', textDecoration: 'none' }}>Intake/Leads</a>
              <a href="/dashboard/calendar" style={{ color: 'white', textDecoration: 'none' }}>Calendar</a>
              <a href="/dashboard/documents" style={{ color: 'white', textDecoration: 'none' }}>Documents</a>
              <a href="/dashboard/billing" style={{ color: 'white', textDecoration: 'none' }}>Billing</a>
              <a href="/dashboard/clients" style={{ color: 'white', textDecoration: 'none' }}>Clients</a>
              <a href="/dashboard/aml" style={{ color: 'white', textDecoration: 'none' }}>AML</a>
            </>
          )}
          {!hasFirm && !isFirmSetupPage && (
            <a href="/dashboard/firm-setup" style={{ color: '#90cfd9', textDecoration: 'none', fontWeight: 600 }}>
              Set up your firm
            </a>
          )}
          {hasFirm && (
            <a href="/dashboard/settings" style={{ color: 'white', textDecoration: 'none' }}>Settings / Firm</a>
          )}
        </nav>
        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <a 
            href="/auth/logout" 
            onClick={handleLogout}
            style={{ color: '#90cfd9', textDecoration: 'none', fontSize: '14px', cursor: 'pointer' }}
          >
            Sign Out
          </a>
        </div>
      </aside>

      <main style={{
        marginLeft: '250px',
        flex: 1,
        padding: '40px',
        background: '#fcfcf9',
      }}>
        {children}
      </main>
    </div>
  )
}