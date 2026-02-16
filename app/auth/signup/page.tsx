'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signUpAction } from './signupAction'

const ALLOW_DEV_SIGNUP = process.env.NEXT_PUBLIC_ALLOW_DEV_SIGNUP === 'true'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firmName, setFirmName] = useState('')
  const [usState, setUsState] = useState('FL')
  const [registerFirmNow, setRegisterFirmNow] = useState(false)
  const [asDeveloper, setAsDeveloper] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    setError('')
    setLoading(true)

    try {
      if (!termsAccepted) {
        setError('You must agree to the Terms of Use to create an account')
        return
      }

      const result = await signUpAction({
        email: email.trim(),
        password,
        firmName: registerFirmNow ? firmName.trim() : undefined,
        usState: registerFirmNow ? usState.trim() : undefined,
        asDeveloper: ALLOW_DEV_SIGNUP && asDeveloper,
        termsAccepted: true,
      })
      if (result.needsConfirmation) {
        router.push('/auth/confirm-email')
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fcfcf9',
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '40px',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '420px',
          border: '1px solid rgba(94, 82, 64, 0.2)',
        }}
      >
        <h1
          style={{
            marginBottom: '10px',
            fontSize: '28px',
            textAlign: 'center',
          }}
        >
          Create Account
        </h1>
        <p
          style={{
            marginBottom: '24px',
            fontSize: '14px',
            color: '#627c71',
            textAlign: 'center',
          }}
        >
          You can register a law firm now or later from your dashboard.
        </p>

        <form onSubmit={handleSignUp}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={registerFirmNow}
                onChange={(e) => setRegisterFirmNow(e.target.checked)}
              />
              <span>Register with a law firm now</span>
            </label>
          </div>

          {registerFirmNow && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px' }}>Firm Name</label>
                <input
                  type="text"
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  required={registerFirmNow}
                  style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px' }}>State</label>
                <input
                  type="text"
                  value={usState}
                  onChange={(e) => setUsState(e.target.value)}
                  required={registerFirmNow}
                  style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}
                />
              </div>
            </>
          )}

          {ALLOW_DEV_SIGNUP && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={asDeveloper}
                  onChange={(e) => setAsDeveloper(e.target.checked)}
                />
                <span>Sign up as developer (test law firm, full access)</span>
              </label>
            </div>
          )}

          {/* Terms Acceptance */}
          <div style={{ marginBottom: '20px', padding: '16px', background: '#f5f5f5', borderRadius: '6px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                required
                style={{ marginTop: '4px' }}
              />
              <span style={{ fontSize: '14px', lineHeight: '1.6' }}>
                I agree to the{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#208096', fontWeight: 600 }}>
                  Terms of Use
                </a>
                {' '}and acknowledge the{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#208096', fontWeight: 600 }}>
                  Privacy Policy
                </a>
                . <span style={{ color: '#c00' }}>*</span>
              </span>
            </label>
          </div>

          {error && <p style={{ color: '#c00', marginBottom: '12px', fontSize: '14px' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading || !termsAccepted}
            style={{
              width: '100%',
              padding: '12px',
              background: (loading || !termsAccepted) ? '#ccc' : '#208096',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: (loading || !termsAccepted) ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Creating…' : 'Create Account'}
          </button>
        </form>

        <p style={{ marginTop: '20px', fontSize: '14px', color: '#627c71', textAlign: 'center' }}>
          Already have an account? <a href="/auth/signin" style={{ color: '#208096' }}>Sign in</a>
        </p>
      </div>
    </div>
  )
}
