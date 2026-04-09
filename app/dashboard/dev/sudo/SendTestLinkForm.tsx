'use client'

import { useState } from 'react'

export function SendTestLinkForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/dev/send-test-intake-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setResult({ error: data.error || 'Failed to send' })
        return
      }
      setResult({ success: true })
      setEmail('')
    } catch {
      setResult({ error: 'Request failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginBottom: '24px', padding: '16px', background: '#f8f8f8', borderRadius: '8px', border: '1px solid rgba(94,82,64,0.15)' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#134252' }}>Send test intake link</h2>
      <p style={{ fontSize: '13px', color: '#627c71', marginBottom: '12px' }}>
        Dev-only: send a test intake form link to any email. For QA and deliverability testing. Not available in production.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="test@example.com"
          required
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(94,82,64,0.2)', minWidth: '200px' }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '8px 16px',
            background: loading ? '#ccc' : '#208096',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          {loading ? 'Sending…' : 'Send test link'}
        </button>
      </form>
      {result?.success && (
        <p style={{ marginTop: '8px', color: '#208096', fontSize: '13px' }}>Test link sent successfully.</p>
      )}
      {result?.error && (
        <p style={{ marginTop: '8px', color: '#c0152f', fontSize: '13px' }}>{result.error}</p>
      )}
    </div>
  )
}
