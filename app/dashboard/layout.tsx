'use client'

import { useAuth } from '@/lib/auth-context'
import { ImpersonationBanner } from '@/components/ImpersonationBanner'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { needsTermsAcceptance } from '@/lib/terms-config'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { session, profile, firm, loading, show_dev_sudo } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const hasFirm = Boolean(profile?.firm_id)
  const isTestFirm = Boolean(firm?.is_test_firm)
  const isDemoFirm = Boolean((firm as { is_demo_firm?: boolean } | null)?.is_demo_firm)
  const isDemoGuest = Boolean((profile as { is_demo_guest?: boolean } | null)?.is_demo_guest)
  const isRegisterFirmPage = pathname === '/dashboard/register-firm'

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

    // Users without a firm go to register-firm (with option to explore demo first)
    if (!loading && session && !hasFirm && !isRegisterFirmPage) {
      router.replace('/dashboard/register-firm')
    }
  }, [session, loading, router, hasFirm, isRegisterFirmPage])

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
          <a href="/" style={{ color: 'inherit', textDecoration: 'none' }}>⚖️ LawIntake</a>
          {isDemoFirm && (
            <span
              style={{
                display: 'inline-block',
                marginLeft: '8px',
                fontSize: '11px',
                background: '#f0b429',
                color: '#134252',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 600,
              }}
            >
              Demo
            </span>
          )}
          {isTestFirm && !isDemoFirm && (
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
              {!isDemoFirm && (
                <a href="/dashboard/billing" style={{ color: 'white', textDecoration: 'none' }}>Billing</a>
              )}
              <a href="/dashboard/clients" style={{ color: 'white', textDecoration: 'none' }}>Clients</a>
              <a href="/dashboard/aml" style={{ color: 'white', textDecoration: 'none' }}>AML</a>
            </>
          )}
          {!hasFirm && !isRegisterFirmPage && (
            <a href="/dashboard/register-firm" style={{ color: '#90cfd9', textDecoration: 'none', fontWeight: 600 }}>
              Register your firm
            </a>
          )}
          {hasFirm && isDemoFirm && (
            <form action="/api/auth/leave-demo-firm" method="POST" style={{ display: 'inline' }}>
              <button
                type="submit"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#90cfd9',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: 'inherit',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Register your firm
              </button>
            </form>
          )}
          {hasFirm && (
            <a href="/dashboard/settings" style={{ color: isDemoFirm ? 'rgba(255,255,255,0.8)' : 'white', textDecoration: 'none' }} title={isDemoFirm ? 'Settings are limited in demo mode' : undefined}>
              Settings{isDemoFirm ? ' (limited)' : ' / Firm'}
            </a>
          )}
          {show_dev_sudo && (
            <a href="/dashboard/dev/sudo" style={{ color: '#f0b429', textDecoration: 'none', fontSize: '14px' }}>Dev Sudo</a>
          )}
        </nav>
        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          {isDemoGuest ? (
            <a
              href="/auth/signup"
              style={{ color: '#f0b429', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}
            >
              Create your account
            </a>
          ) : (
            <a
              href="/auth/logout"
              onClick={handleLogout}
              style={{ color: '#90cfd9', textDecoration: 'none', fontSize: '14px', cursor: 'pointer' }}
            >
              Sign Out
            </a>
          )}
        </div>
      </aside>

      <main style={{
        marginLeft: '250px',
        flex: 1,
        padding: '40px',
        background: '#fcfcf9',
      }}>
        <ImpersonationBanner />
        {/* Demo firm banner: shown on every dashboard page when currentFirm.is_demo_firm. CTA = Create account (Flow A) or Register firm (Flow B). */}
        {isDemoFirm && (
          <div
            role="alert"
            aria-live="polite"
            style={{
              marginBottom: '24px',
              padding: '16px 20px',
              background: 'linear-gradient(135deg, #fff8e6 0%, #fff4d6 100%)',
              border: '2px solid #f0b429',
              borderRadius: '8px',
              fontSize: '15px',
              color: '#134252',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              boxShadow: '0 2px 8px rgba(240, 180, 41, 0.15)',
            }}
          >
            <div>
              <strong style={{ fontSize: '16px' }}>You are using a demo firm</strong>
              <p style={{ margin: '6px 0 0', fontSize: '14px', opacity: 0.9 }}>
                This is dummy data. Do not enter real client information. Data may be reset regularly.
              </p>
            </div>
            {isDemoGuest ? (
              <a
                href="/auth/signup"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  background: '#208096',
                  color: 'white',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '15px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 4px rgba(32, 128, 150, 0.3)',
                }}
              >
                Create your account
              </a>
            ) : (
              <form action="/api/auth/leave-demo-firm" method="POST" style={{ display: 'inline' }}>
                <button
                  type="submit"
                  style={{
                    display: 'inline-block',
                    padding: '12px 24px',
                    background: '#208096',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '15px',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(32, 128, 150, 0.3)',
                  }}
                >
                  Register your law firm
                </button>
              </form>
            )}
          </div>
        )}
        {children}
      </main>
    </div>
  )
}