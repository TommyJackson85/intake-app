'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/browserClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false)
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        const message = error.message.toLowerCase()
        const isEmailNotConfirmed =
          message.includes('confirm') || message.includes('email not confirmed')

        setEmailNotConfirmed(isEmailNotConfirmed)
        setError(
          isEmailNotConfirmed
            ? 'Please confirm your email address before signing in. Check your inbox and spam folder.'
            : error.message || 'Login failed'
        )
        return
      }

      if (!data.session) {
        setError('Login failed: no session returned')
        return
      }

      // Centralized post-login routing (terms, role, firm setup)
      router.push('/auth/post-login')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fcfcf9' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '8px', width: '100%', maxWidth: '400px', border: '1px solid rgba(94, 82, 64, 0.2)' }}>
        <h1 style={{ marginBottom: '10px', fontSize: '28px', textAlign: 'center' }}>Sign In</h1>
        <p style={{ marginBottom: '30px', fontSize: '14px', color: '#627c71', textAlign: 'center' }}>
          Secure client portal for your real estate matters.
        </p>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@lawfirm.com"
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
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  paddingRight: '40px',
                  border: '1px solid rgba(94, 82, 64, 0.2)',
                  borderRadius: '6px',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#627c71',
                  fontSize: '14px',
                  padding: '4px 8px',
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '20px', textAlign: 'right' }}>
            <Link href="/auth/forgot-password" style={{ color: '#208096', fontSize: '14px', textDecoration: 'none' }}>
              Forgot password?
            </Link>
          </div>

          {error && (
            <div
              style={{
                background: '#fee',
                color: '#c0152f',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '20px',
                fontSize: '14px',
              }}
            >
              {error}
              {emailNotConfirmed && (
                <p style={{ marginTop: '8px', marginBottom: 0 }}>
                  <Link href="/auth/confirm-email" style={{ color: '#208096', fontWeight: 600 }}>
                    Resend confirmation email
                  </Link>
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#ccc' : '#208096',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '24px', fontSize: '12px', color: '#627c71', textAlign: 'center', lineHeight: '1.6' }}>
          <p style={{ marginBottom: '8px' }}>
            <Link href="/terms" style={{ color: '#208096', textDecoration: 'none' }}>Terms of Use</Link>
            {' · '}
            <Link href="/privacy" style={{ color: '#208096', textDecoration: 'none' }}>Privacy Policy</Link>
            {' · '}
            <Link href="/portal-agreement" style={{ color: '#208096', textDecoration: 'none' }}>Client Portal Agreement</Link>
          </p>
          <p style={{ marginTop: '8px', marginBottom: '8px', fontSize: '11px' }}>
            Data is handled in line with our Privacy Policy.
          </p>
        </div>

        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(94, 82, 64, 0.1)', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', marginBottom: '8px' }}>
            Don't have an account?{' '}
            <Link href="/auth/signup" style={{ color: '#208096', fontWeight: 600, textDecoration: 'none' }}>
              Sign Up
            </Link>
          </p>
          <p style={{ fontSize: '12px', color: '#627c71' }}>
            <Link href="/auth/firm-registration" style={{ color: '#208096', textDecoration: 'none' }}>
              Law firm admin registering your firm? Start here.
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}