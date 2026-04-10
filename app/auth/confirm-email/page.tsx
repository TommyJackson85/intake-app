'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/browserClient'

export default function ConfirmEmailPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [supabase] = useState(() => {
    try { return createSupabaseBrowserClient() } catch { return null }
  })

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading || !supabase) return
    setError('')
    setLoading(true)
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      })
      if (resendError) {
        setError(resendError.message)
      } else {
        setSent(true)
      }
    } catch {
      setError('Failed to resend confirmation email')
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
            marginBottom: '12px',
            fontSize: '28px',
            textAlign: 'center',
          }}
        >
          Confirm your email
        </h1>
        <p
          style={{
            marginBottom: '24px',
            fontSize: '14px',
            color: '#627c71',
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          We sent you a confirmation link. Check your inbox and spam folder, then click the link to
          verify your account.
        </p>

        <form onSubmit={handleResend}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
              Resend confirmation email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              style={{
                width: '100%',
                padding: '10px',
                boxSizing: 'border-box',
                border: '1px solid rgba(94, 82, 64, 0.2)',
                borderRadius: '6px',
              }}
            />
          </div>
          {error && (
            <p style={{ color: '#c00', marginBottom: '12px', fontSize: '14px' }}>{error}</p>
          )}
          {sent && (
            <p style={{ color: '#208096', marginBottom: '12px', fontSize: '14px' }}>
              Confirmation email sent. Check your inbox.
            </p>
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
            {loading ? 'Sending…' : 'Resend'}
          </button>
        </form>

        <p
          style={{
            marginTop: '24px',
            fontSize: '14px',
            color: '#627c71',
            textAlign: 'center',
          }}
        >
          <a href="/auth/signin" style={{ color: '#208096' }}>
            Back to sign in
          </a>
        </p>
      </div>
    </div>
  )
}
