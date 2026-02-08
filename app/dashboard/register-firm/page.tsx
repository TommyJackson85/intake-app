'use client'

import { useState } from 'react'

export default function RegisterFirmPage() {
  const [firmName, setFirmName] = useState('')
  const [state, setState] = useState('FL')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register-firm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firmName: firmName.trim(), state: state.trim() }),
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

  return (
    <div>
      <h1 style={{ marginBottom: '12px', fontSize: '28px' }}>Register your law firm</h1>
      <p style={{ marginBottom: '24px', color: '#627c71', maxWidth: '560px' }}>
        To use client intake, matters, AML checks, and other practice features, we need your firm
        details. This supports multijurisdictional and data privacy compliance.
      </p>

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
