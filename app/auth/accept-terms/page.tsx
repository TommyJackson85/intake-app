'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { CURRENT_TERMS_VERSION } from '@/lib/terms-config'

export default function AcceptTermsPage() {
  const { session, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !session) {
      router.push('/auth/signin')
    }
  }, [session, authLoading, router])

  // Check if user actually needs to accept terms
  useEffect(() => {
    if (!authLoading && profile) {
      // Type assertion needed until database types are regenerated
      const profileWithTerms = profile as any
      const hasAcceptedCurrentTerms = 
        profileWithTerms.terms_accepted_at && 
        profileWithTerms.terms_version === CURRENT_TERMS_VERSION

      if (hasAcceptedCurrentTerms) {
        // User already accepted current terms, redirect to dashboard
        router.push('/dashboard')
      }
    }
  }, [profile, authLoading, router])

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!termsAccepted || loading) return

    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/accept-terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          termsVersion: CURRENT_TERMS_VERSION,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept terms')
      }

      // Success - redirect to dashboard (or firm-setup if needed)
      window.location.href = '/dashboard'
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fcfcf9' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '8px', width: '100%', maxWidth: '600px', border: '1px solid rgba(94, 82, 64, 0.2)' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '12px' }}>Updated Terms of Use</h1>
        <p style={{ fontSize: '16px', color: '#627c71', marginBottom: '32px', lineHeight: '1.6' }}>
          Our Terms of Use have been updated. Please review and accept the updated terms to continue using the service.
        </p>

        <div style={{ marginBottom: '24px', padding: '16px', background: '#f5f5f5', borderRadius: '6px' }}>
          <p style={{ marginBottom: '12px', fontSize: '14px' }}>
            <strong>Current Terms Version:</strong> {CURRENT_TERMS_VERSION}
          </p>
          {(profile as any)?.terms_version && (
            <p style={{ fontSize: '14px', color: '#627c71' }}>
              <strong>Your Previous Version:</strong> {(profile as any).terms_version}
            </p>
          )}
        </div>

        <form onSubmit={handleAccept}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                required
                style={{ marginTop: '4px' }}
              />
              <span style={{ fontSize: '14px', lineHeight: '1.6' }}>
                I have read and agree to the updated{' '}
                <Link href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#208096', fontWeight: 600 }}>
                  Terms of Use
                </Link>
                {' '}(version {CURRENT_TERMS_VERSION}). <span style={{ color: '#c00' }}>*</span>
              </span>
            </label>
          </div>

          {error && (
            <div style={{
              background: '#fee',
              color: '#c0152f',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => {
                // Sign out if user doesn't want to accept
                window.location.href = '/auth/logout'
              }}
              style={{
                padding: '12px 24px',
                background: 'white',
                color: '#208096',
                border: '1px solid #208096',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !termsAccepted}
              style={{
                padding: '12px 24px',
                background: (loading || !termsAccepted) ? '#ccc' : '#208096',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: (loading || !termsAccepted) ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Accepting...' : 'Accept & Continue'}
            </button>
          </div>
        </form>

        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(94, 82, 64, 0.1)', fontSize: '12px', color: '#627c71' }}>
          <p style={{ marginBottom: '8px' }}>
            You can review our{' '}
            <Link href="/privacy" style={{ color: '#208096', textDecoration: 'none' }}>Privacy Policy</Link>
            {' '}at any time.
          </p>
        </div>
      </div>
    </div>
  )
}
