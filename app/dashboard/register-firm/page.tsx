'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

function RegisterFirmContent() {
  const { profile, firm, loading: authLoading, show_dev_sudo } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [firmName, setFirmName] = useState('')
  const [state, setState] = useState('FL')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [demoError, setDemoError] = useState('')

  const isDemoFirm = Boolean((firm as { is_demo_firm?: boolean } | null)?.is_demo_firm)
  if (!authLoading && profile?.firm_id && !isDemoFirm) {
    router.replace('/dashboard')
    return null
  }

  // If user landed here with demo firm still linked (e.g. direct URL or back), leave demo first
  // so layout shows "no firm" state (no demo nav links/banner).
  useEffect(() => {
    if (authLoading || !profile?.firm_id || !isDemoFirm) return
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = '/api/auth/leave-demo-firm'
    document.body.appendChild(form)
    form.submit()
  }, [authLoading, profile?.firm_id, isDemoFirm])

  useEffect(() => {
    const msg = searchParams.get('demo_error')
    if (msg) {
      setDemoError(msg)
      window.history.replaceState({}, '', '/dashboard/register-firm')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register-firm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: firmName.trim(), state: state.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Failed to register firm')
        setLoading(false)
        return
      }
      // Full navigation so auth context refetches profile (with new firm_id)
      window.location.href = '/dashboard'
    } catch {
      setError('Something went wrong')
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

  // While we're leaving demo (form submit in flight), show brief message to avoid flash of wrong nav
  if (profile?.firm_id && isDemoFirm) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Leaving demo…</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '520px' }}>
      <h1 style={{ marginBottom: '12px', fontSize: '28px' }}>Register your law firm</h1>
      <p style={{ marginBottom: '24px', color: '#627c71', lineHeight: 1.6 }}>
        To use client intake, matters, AML checks, and other practice features, we need your firm
        details. This supports multijurisdictional and data privacy compliance.
      </p>

      {show_dev_sudo && (
        <div
          style={{
            marginBottom: '24px',
            padding: '16px',
            background: 'linear-gradient(135deg, #e8f4f6 0%, #d4edf0 100%)',
            borderRadius: '8px',
            border: '2px solid #208096',
          }}
        >
          <p style={{ fontSize: '14px', color: '#134252', marginBottom: '12px', fontWeight: 600 }}>
            Developer: Use the dev test firm for full dashboard (no demo banners)
          </p>
          <form action="/api/auth/use-dev-test-firm" method="POST" style={{ display: 'inline' }}>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                background: '#208096',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              Use Dev Test Firm
            </button>
          </form>
          <p style={{ fontSize: '12px', color: '#627c71', marginTop: '8px', marginBottom: 0 }}>
            Internal test firm with synthetic data. Full features.
          </p>
        </div>
      )}

      <div
        style={{
          marginBottom: '24px',
          padding: '16px',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid rgba(94, 82, 64, 0.15)',
        }}
      >
        <p style={{ fontSize: '14px', color: '#627c71', marginBottom: '12px' }}>
          Want to explore first? Use the demo experience with sample data.
        </p>
        <a
          href="/demo"
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            background: 'white',
            color: '#208096',
            border: '1px solid #208096',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Explore demo
        </a>
        <p style={{ fontSize: '12px', color: '#999', marginTop: '8px', marginBottom: 0 }}>
          In-memory demo data only. It resets on full page refresh.
        </p>
      </div>

      {demoError && (
        <div
          style={{
            marginBottom: '20px',
            padding: '12px 16px',
            background: '#fff8e6',
            border: '1px solid #f0b429',
            borderRadius: '6px',
            color: '#134252',
            fontSize: '14px',
          }}
        >
          {demoError}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          background: 'white',
          padding: '24px',
          borderRadius: '8px',
          border: '1px solid rgba(94, 82, 64, 0.2)',
          maxWidth: '400px',
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>Firm name</label>
          <input
            type="text"
            value={firmName}
            onChange={(e) => setFirmName(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>State</label>
          <input
            type="text"
            value={state}
            onChange={(e) => setState(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}
          />
        </div>
        {error && <p style={{ color: '#c00', marginBottom: '12px', fontSize: '14px' }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px 24px',
            background: '#208096',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Registering…' : 'Register firm'}
        </button>
      </form>
    </div>
  )
}

export default function RegisterFirmPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>}>
      <RegisterFirmContent />
    </Suspense>
  )
}
