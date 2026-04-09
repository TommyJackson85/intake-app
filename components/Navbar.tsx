'use client'

import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

/**
 * Marketing/landing top navbar.
 * Behaviour:
 * - Anonymous: Logo, Features, Security, Privacy, Explore demo firm, Sign In
 * - Logged in (real firm): Logo, Features, Security, Privacy, Go to dashboard, Logout
 * - Logged in (no firm): Logo, Features, Security, Privacy, Register your law firm, Logout
 * - Demo guest (is_demo_guest): Logo, Features, Security, Privacy, Create your account (no Logout)
 */
export default function Navbar() {
  const { session, profile, firm, loading } = useAuth()

  const isAuthenticated = Boolean(session)
  const isDemoGuest = Boolean((profile as { is_demo_guest?: boolean } | null)?.is_demo_guest)
  const isDemoFirm = Boolean((firm as { is_demo_firm?: boolean } | null)?.is_demo_firm)
  const hasRealFirm = Boolean(profile?.firm_id) && !isDemoFirm

  const showExploreDemo = !isAuthenticated
  const showLoginSignup = !isAuthenticated || isDemoGuest
  const showDashboardLink = isAuthenticated && !isDemoGuest && hasRealFirm
  const showRegisterFirmLink = isAuthenticated && !isDemoGuest && !hasRealFirm
  const showLogout = isAuthenticated && !isDemoGuest

  return (
    <header
      style={{
        background: 'white',
        borderBottom: '1px solid rgba(94, 82, 64, 0.2)',
        padding: '20px 0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Link href="/" style={{ fontWeight: 600, fontSize: '24px', color: '#208096', textDecoration: 'none' }}>
          ⚖️ LawIntake
        </Link>

        <nav style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
          <a href="#features" style={{ textDecoration: 'none', color: '#134252', fontSize: '14px' }}>
            Features
          </a>
          <a href="#security" style={{ textDecoration: 'none', color: '#134252', fontSize: '14px' }}>
            Security
          </a>
          <a href="/privacy" style={{ textDecoration: 'none', color: '#134252', fontSize: '14px' }}>
            Privacy
          </a>

          {!loading && (
            <>
              {showExploreDemo && (
                <form action="/api/auth/demo-login" method="POST" style={{ display: 'inline' }}>
                  <button
                    type="submit"
                    style={{
                      background: 'transparent',
                      color: '#134252',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      border: '1px solid rgba(94, 82, 64, 0.3)',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Explore demo firm
                  </button>
                </form>
              )}

              {showDashboardLink && (
                <Link
                  href="/dashboard"
                  style={{
                    background: '#208096',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  Go to dashboard
                </Link>
              )}

              {showRegisterFirmLink && (
                <Link
                  href="/dashboard/register-firm"
                  style={{
                    background: '#208096',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  Register your law firm
                </Link>
              )}

              {showLoginSignup && (
                <>
                  {!isDemoGuest && (
                    <Link href="/auth/signup" style={{ color: '#208096', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
                      Sign up
                    </Link>
                  )}
                  <Link
                    href={isDemoGuest ? '/auth/signup' : '/auth/signin'}
                    style={{
                      background: '#208096',
                      color: 'white',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: 500,
                    }}
                  >
                    {isDemoGuest ? 'Create your account' : 'Sign In'}
                  </Link>
                </>
              )}

              {showLogout && (
                <Link
                  href="/auth/logout"
                  style={{
                    color: '#134252',
                    padding: '10px 16px',
                    fontSize: '14px',
                    textDecoration: 'none',
                  }}
                >
                  Logout
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
