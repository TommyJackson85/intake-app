'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

export default function FirmSetupPage() {
  const { profile, firm, loading: authLoading } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [firmName, setFirmName] = useState('')
  const [state, setState] = useState('FL')
  const [emailContact, setEmailContact] = useState('')

  // If user already has a firm, redirect to dashboard
  if (!authLoading && profile?.firm_id) {
    router.push('/dashboard')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/register-firm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: firmName.trim(),
          state: state.trim(),
          email_contact: emailContact.trim() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create firm')
      }

      // Success - reload to get updated profile with firm_id
      window.location.href = '/dashboard'
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '12px' }}>Welcome – Set up your firm</h1>
      <p style={{ fontSize: '16px', color: '#627c71', marginBottom: '20px', lineHeight: '1.6' }}>
        To start using the client intake portal, first create your firm profile.
        Your firm profile helps us apply the correct legal and compliance settings.
      </p>

      <div style={{
        marginBottom: '32px',
        padding: '16px',
        background: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid rgba(94, 82, 64, 0.15)',
      }}>
        <p style={{ fontSize: '14px', color: '#627c71', marginBottom: '12px' }}>
          Want to explore first? Try the demo firm to see the app in action.
        </p>
        <form action="/api/auth/demo-login" method="POST" style={{ display: 'inline' }}>
          <button
            type="submit"
            style={{
              padding: '8px 16px',
              background: 'white',
              color: '#208096',
              border: '1px solid #208096',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Try a demo firm
          </button>
        </form>
        <p style={{ fontSize: '12px', color: '#999', marginTop: '8px', marginBottom: 0 }}>
          You’ll be signed in as a demo lawyer. No signup needed. Data may be reset.
        </p>
      </div>

      {/* Stepper */}
      <div style={{ marginBottom: '32px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: step >= 1 ? '#208096' : '#e0e0e0',
          color: step >= 1 ? 'white' : '#999',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
          fontSize: '14px',
        }}>
          1
        </div>
        <div style={{ flex: 1, height: '2px', background: step >= 2 ? '#208096' : '#e0e0e0' }} />
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: step >= 2 ? '#208096' : '#e0e0e0',
          color: step >= 2 ? 'white' : '#999',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
          fontSize: '14px',
        }}>
          2
        </div>
        <div style={{ flex: 1, height: '2px', background: step >= 3 ? '#208096' : '#e0e0e0' }} />
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: step >= 3 ? '#208096' : '#e0e0e0',
          color: step >= 3 ? 'white' : '#999',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
          fontSize: '14px',
        }}>
          3
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Firm Details */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Firm Details</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Firm Name <span style={{ color: '#c00' }}>*</span>
              </label>
              <input
                type="text"
                value={firmName}
                onChange={(e) => setFirmName(e.target.value)}
                required
                placeholder="Smith & Associates Law Firm"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid rgba(94, 82, 64, 0.2)',
                  borderRadius: '6px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                State/Jurisdiction <span style={{ color: '#c00' }}>*</span>
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
                placeholder="FL"
                maxLength={2}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid rgba(94, 82, 64, 0.2)',
                  borderRadius: '6px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Contact Email (optional)
              </label>
              <input
                type="email"
                value={emailContact}
                onChange={(e) => setEmailContact(e.target.value)}
                placeholder="contact@lawfirm.com"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid rgba(94, 82, 64, 0.2)',
                  borderRadius: '6px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!firmName.trim() || !state.trim()}
                style={{
                  padding: '12px 24px',
                  background: '#208096',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: (!firmName.trim() || !state.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (!firmName.trim() || !state.trim()) ? 0.5 : 1,
                }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Review */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Review</h2>
            
            <div style={{
              background: '#f5f5f5',
              padding: '20px',
              borderRadius: '6px',
              marginBottom: '20px',
            }}>
              <div style={{ marginBottom: '12px' }}>
                <strong>Firm Name:</strong> {firmName}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>State:</strong> {state}
              </div>
              {emailContact && (
                <div>
                  <strong>Contact Email:</strong> {emailContact}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
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
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                style={{
                  padding: '12px 24px',
                  background: '#208096',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Complete */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Complete Setup</h2>
            
            <p style={{ marginBottom: '24px', color: '#627c71', lineHeight: '1.6' }}>
              You can add branding, offices, and invite team members later from your dashboard settings.
            </p>

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

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={() => setStep(2)}
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
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  background: loading ? '#ccc' : '#208096',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Creating...' : 'Create Firm'}
              </button>
            </div>
          </div>
        )}
      </form>

      <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(94, 82, 64, 0.1)', fontSize: '12px', color: '#627c71' }}>
        <p style={{ marginBottom: '8px' }}>
          By continuing, you agree to our{' '}
          <Link href="/terms" style={{ color: '#208096', textDecoration: 'none' }}>Terms of Use</Link>
          {' '}and acknowledge our{' '}
          <Link href="/privacy" style={{ color: '#208096', textDecoration: 'none' }}>Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}
