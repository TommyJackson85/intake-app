'use client'

import { useState } from 'react'

export default function NewIntakeLinkPage() {
  const [clientEmail, setClientEmail] = useState('')
  const [clientFullName, setClientFullName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [matterType, setMatterType] = useState('real_estate_purchase')
  const [propertyAddress, setPropertyAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [intakeUrl, setIntakeUrl] = useState<string | null>(null)

  const createLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)
    setIntakeUrl(null)
    try {
      const res = await fetch('/api/dashboard/intakes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientEmail: clientEmail.trim(),
          clientFullName: clientFullName.trim(),
          clientPhone: clientPhone.trim(),
          matterType,
          propertyAddress: propertyAddress.trim(),
        }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error || 'Failed to create intake link')
      setIntakeUrl(body.intakeUrl as string)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create intake link')
    } finally {
      setLoading(false)
    }
  }

  const copy = async () => {
    if (!intakeUrl) return
    try {
      await navigator.clipboard.writeText(intakeUrl)
      alert('Link copied to clipboard')
    } catch {
      alert('Could not copy automatically. Please copy the link manually.')
    }
  }

  return (
    <div style={{ maxWidth: '720px' }}>
      <h1 style={{ marginBottom: '10px', fontSize: '32px' }}>Create an intake link</h1>
      <p style={{ marginTop: 0, marginBottom: '20px', color: '#627c71', lineHeight: '1.6' }}>
        Generate a secure client link for a guided, step-by-step intake form. You can paste it into an email
        or message. (Email sending can be wired later.)
      </p>

      <form onSubmit={createLink} style={{ background: 'white', border: '1px solid rgba(94, 82, 64, 0.2)', borderRadius: '8px', padding: '18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px' }}>Client email *</label>
            <input
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              type="email"
              required
              placeholder="client@example.com"
              style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid rgba(94, 82, 64, 0.2)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px' }}>Client name</label>
            <input
              value={clientFullName}
              onChange={(e) => setClientFullName(e.target.value)}
              type="text"
              placeholder="Jane Doe"
              style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid rgba(94, 82, 64, 0.2)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px' }}>Client phone</label>
            <input
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              type="tel"
              placeholder="+1 305 555 0123"
              style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid rgba(94, 82, 64, 0.2)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px' }}>Matter type *</label>
            <select
              value={matterType}
              onChange={(e) => setMatterType(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid rgba(94, 82, 64, 0.2)' }}
            >
              <option value="real_estate_purchase">Real estate purchase</option>
              <option value="real_estate_sale">Real estate sale</option>
              <option value="conveyancing">Conveyancing</option>
              <option value="lease_agreement">Lease agreement</option>
              <option value="property_dispute">Property dispute</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: '12px' }}>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px' }}>Property address</label>
          <input
            value={propertyAddress}
            onChange={(e) => setPropertyAddress(e.target.value)}
            type="text"
            placeholder="123 Palm Ave, Miami, FL"
            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid rgba(94, 82, 64, 0.2)' }}
          />
        </div>

        {error && (
          <div style={{ marginTop: '12px', background: '#fee', color: '#c0152f', padding: '10px', borderRadius: '6px' }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: '14px', display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 18px',
              background: loading ? '#ccc' : '#208096',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Creating…' : 'Create link'}
          </button>
        </div>
      </form>

      {intakeUrl && (
        <div style={{ marginTop: '16px', background: 'white', border: '1px solid rgba(94, 82, 64, 0.2)', borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontWeight: 900, marginBottom: '8px' }}>Client intake link</div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              readOnly
              value={intakeUrl}
              style={{ flex: 1, minWidth: '280px', padding: '12px', borderRadius: '6px', border: '1px solid rgba(94, 82, 64, 0.2)' }}
            />
            <button
              type="button"
              onClick={copy}
              style={{
                padding: '12px 16px',
                borderRadius: '6px',
                background: 'rgba(94, 82, 64, 0.12)',
                color: '#134252',
                border: 'none',
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              Copy
            </button>
          </div>
          <p style={{ marginTop: '10px', marginBottom: 0, color: '#627c71', fontSize: '12px', lineHeight: '1.6' }}>
            This link is unique. If you need to revoke it later, you’ll be able to from the intake record (coming next).
          </p>
        </div>
      )}
    </div>
  )
}

