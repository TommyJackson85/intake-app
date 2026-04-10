'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  normalizeFinCenMatterKey,
  readDemoMattersFromStorage,
  readFinCENCertRequestFromStorage,
  useDemoStore,
} from '@/lib/demo/store'
import type { FinCENBeneficialOwner } from '@/lib/demo/types'

const EMPTY_OWNER = (): FinCENBeneficialOwner => ({
  id: '',
  fullName: '',
  dob: '',
  address: '',
  citizenship: 'US Citizen',
  tin: '',
  govIdType: '',
  govIdNumber: '',
  govIdIssuer: '',
  certifiedAt: null,
})

const CITIZENSHIP_OPTIONS = ['US Citizen', 'Permanent Resident', 'Foreign National', 'Other'] as const

const GOV_ID_OPTIONS = ['Passport', "Driver's Licence", 'State ID', 'National ID', 'Other'] as const

const LABEL = {
  fontSize: 12,
  color: '#627c71',
  fontWeight: 800,
  marginBottom: 4,
  display: 'block' as const,
}

const SECTION_LABEL = {
  fontSize: 11,
  color: '#627c71',
  fontWeight: 800,
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  marginTop: 0,
  marginBottom: 8,
}

const INPUT = {
  width: '100%',
  padding: '12px',
  borderRadius: '6px',
  border: '1px solid rgba(94, 82, 64, 0.2)',
  fontSize: 14,
  color: '#134252',
}

export default function DemoFinCENCertPage() {
  const params = useParams()
  const token = typeof params.token === 'string' ? params.token : ''
  const { fincenCertRequests, submitFinCENCert, getMatterById, matters } = useDemoStore()

  const cert = useMemo(() => {
    if (!token) return undefined
    const fromStore = fincenCertRequests.find((r) => r.token === token)
    if (fromStore) return fromStore
    return readFinCENCertRequestFromStorage(token)
  }, [fincenCertRequests, token])

  const linkedMatter = useMemo(() => {
    if (!cert) return undefined
    const fromStore = getMatterById(cert.matterId)
    if (fromStore) return fromStore
    const idKey = normalizeFinCenMatterKey(cert.matterId)
    return readDemoMattersFromStorage().find((m) => normalizeFinCenMatterKey(m.id) === idKey)
  }, [cert, getMatterById, matters])
  const mattersBackHref = linkedMatter
    ? `/demo/matters?matter=${encodeURIComponent(linkedMatter.file_id)}`
    : '/demo/matters'
  const dashboardBackHref = linkedMatter
    ? `/demo?matter=${encodeURIComponent(linkedMatter.file_id)}`
    : '/demo'

  const [owners, setOwners] = useState<FinCENBeneficialOwner[]>([EMPTY_OWNER()])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const updateOwner = (index: number, patch: Partial<FinCENBeneficialOwner>) => {
    setOwners((prev) => prev.map((o, i) => (i === index ? { ...o, ...patch } : o)))
  }

  const addOwner = () => setOwners((prev) => [...prev, EMPTY_OWNER()])

  const removeOwner = (index: number) => {
    setOwners((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  const handleSubmit = () => {
    if (!token || !cert) return
    setError('')
    for (let i = 0; i < owners.length; i++) {
      const o = owners[i]
      if (
        !o.fullName.trim() ||
        !o.dob ||
        !o.address.trim() ||
        !o.citizenship ||
        !o.tin.trim() ||
        !o.govIdType.trim() ||
        !o.govIdNumber.trim() ||
        !o.govIdIssuer.trim()
      ) {
        setError(`Please complete all fields for beneficial owner ${i + 1}.`)
        return
      }
    }
    setSubmitting(true)
    try {
      const ts = Date.now()
      const payload: FinCENBeneficialOwner[] = owners.map((o, i) => ({
        id: o.id.trim() || `bo-${ts}-${i}`,
        fullName: o.fullName.trim(),
        dob: o.dob,
        address: o.address.trim(),
        citizenship: o.citizenship,
        tin: o.tin.trim(),
        govIdType: o.govIdType.trim(),
        govIdNumber: o.govIdNumber.trim(),
        govIdIssuer: o.govIdIssuer.trim(),
        certifiedAt: null,
      }))
      submitFinCENCert(token, payload)
    } finally {
      setSubmitting(false)
    }
  }

  if (!token) {
    return (
      <div style={{ color: '#134252' }}>
        <p>Invalid link.</p>
        <Link href="/demo/intakes" style={{ color: '#208096', fontWeight: 800 }}>
          Back to demo
        </Link>
      </div>
    )
  }

  if (!mounted) {
    return (
      <div style={{ color: '#627c71', padding: '20px 0' }}>
        Loading…
      </div>
    )
  }

  if (!cert) {
    return (
      <div style={{ maxWidth: 560 }}>
        <p style={{ color: '#134252', fontWeight: 800 }}>This link is invalid or has expired.</p>
        <Link href={mattersBackHref} style={{ color: '#208096', fontWeight: 800 }}>
          Back to Matters
        </Link>
      </div>
    )
  }

  if (cert.status === 'submitted') {
    return (
      <div style={{ maxWidth: 560 }}>
        <div
          style={{
            marginBottom: 20,
            padding: '12px 14px',
            borderRadius: 8,
            border: '1px solid #f0b429',
            background: '#fff8e6',
            color: '#134252',
            fontWeight: 800,
            fontSize: 13,
          }}
        >
          Demo FinCEN certification — updates the in-memory matter in this browser tab only.
        </div>
        <div
          style={{
            background: 'white',
            border: '1px solid rgba(94, 82, 64, 0.2)',
            borderRadius: 10,
            padding: 20,
          }}
        >
          <h1 style={{ marginTop: 0, fontSize: 22, fontWeight: 900, color: '#134252' }}>
            Thank you — your certification has been received.
          </h1>
          <p style={{ color: '#627c71', lineHeight: 1.5 }}>
            Submitted{' '}
            {cert.submittedAt ? new Date(cert.submittedAt).toLocaleString() : new Date().toLocaleString()}. Your law firm
            may contact you if anything else is needed.
          </p>
          <p style={{ color: '#134252', lineHeight: 1.5, marginTop: 14, marginBottom: 0, fontWeight: 700 }}>
            Your firm can review certification and beneficial owners on this matter under{' '}
            <strong>FinCEN / AML</strong> — the matter stays open; nothing is archived when you certify.
          </p>
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link href={mattersBackHref} style={{ color: '#208096', fontWeight: 800 }}>
              Open matter (Matters list)
            </Link>
            <Link href={dashboardBackHref} style={{ color: '#208096', fontWeight: 800 }}>
              Open matter (Dashboard)
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div
        style={{
          marginBottom: 20,
          padding: '12px 14px',
          borderRadius: 8,
          border: '1px solid #f0b429',
          background: '#fff8e6',
          color: '#134252',
          fontWeight: 800,
          fontSize: 13,
        }}
      >
        Demo FinCEN beneficial ownership certification — no data is sent to a server.
      </div>

      <div
        style={{
          background: 'white',
          border: '1px solid rgba(94, 82, 64, 0.2)',
          borderRadius: 10,
          padding: 20,
        }}
      >
        <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 900, color: '#134252' }}>Certify beneficial ownership</h1>
        <p style={{ margin: '0 0 16px', color: '#627c71', fontSize: 14, lineHeight: 1.45 }}>
          For: <strong>{cert.recipientName}</strong> · Transaction contact email on file: {cert.recipientEmail}
        </p>

        <div
          style={{
            marginBottom: 18,
            padding: 14,
            borderRadius: 8,
            border: '1px solid #208096',
            background: '#f0f9fa',
            color: '#134252',
            fontSize: 13,
            lineHeight: 1.55,
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Why we&apos;re collecting this information</div>
          <p style={{ margin: 0 }}>
            This information is collected under a legal obligation pursuant to the FinCEN Residential Real Estate Reporting
            Rule (31 CFR 1031.320) and applicable Anti-Money Laundering regulations. It will be filed with the US
            Financial Crimes Enforcement Network (FinCEN) to comply with federal law. It will not be used for any other
            purpose and will be retained for 5 years as required by law. You have the right to access, correct, or request
            restriction of this data by contacting the law firm handling your transaction.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {owners.map((owner, index) => (
            <div
              key={index}
              style={{
                border: '1px solid rgba(94,82,64,0.12)',
                borderRadius: 8,
                padding: 14,
                background: '#fcfcf9',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontWeight: 900, color: '#134252' }}>Beneficial owner {index + 1}</span>
                {owners.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeOwner(index)}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: '#c0152f',
                      fontWeight: 900,
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={LABEL}>Full legal name</label>
                <input
                  value={owner.fullName}
                  onChange={(e) => updateOwner(index, { fullName: e.target.value })}
                  style={INPUT}
                />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={LABEL}>Date of birth</label>
                <input
                  type="date"
                  value={owner.dob}
                  onChange={(e) => updateOwner(index, { dob: e.target.value })}
                  style={INPUT}
                />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={LABEL}>Complete residential street address</label>
                <textarea
                  value={owner.address}
                  onChange={(e) => updateOwner(index, { address: e.target.value })}
                  rows={3}
                  style={{ ...INPUT, resize: 'vertical' }}
                />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={LABEL}>Country / countries of citizenship</label>
                <select
                  value={owner.citizenship}
                  onChange={(e) => updateOwner(index, { citizenship: e.target.value })}
                  style={INPUT}
                >
                  {CITIZENSHIP_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={LABEL}>TIN / SSN or ITIN</label>
                <input
                  value={owner.tin}
                  onChange={(e) => updateOwner(index, { tin: e.target.value })}
                  style={INPUT}
                  autoComplete="off"
                />
                <div style={{ marginTop: 6, fontSize: 11, color: '#627c71', lineHeight: 1.4 }}>
                  Enter your full SSN/ITIN — in production this would be transmitted securely and stored encrypted.
                </div>
              </div>

              <div
                style={{
                  marginTop: 14,
                  paddingTop: 14,
                  borderTop: '1px dashed rgba(94, 82, 64, 0.25)',
                }}
              >
                <div style={SECTION_LABEL}>Government-issued ID</div>
                <div
                  style={{
                    height: 0,
                    borderBottom: '1px solid rgba(94, 82, 64, 0.15)',
                    marginBottom: 12,
                  }}
                />
                <div style={{ marginBottom: 10 }}>
                  <label style={LABEL}>Document type</label>
                  <select
                    value={owner.govIdType || ''}
                    onChange={(e) => updateOwner(index, { govIdType: e.target.value })}
                    style={INPUT}
                  >
                    <option value="">Select…</option>
                    {GOV_ID_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={LABEL}>Document number</label>
                  <input
                    value={owner.govIdNumber}
                    onChange={(e) => updateOwner(index, { govIdNumber: e.target.value })}
                    style={INPUT}
                    autoComplete="off"
                  />
                  <div style={{ marginTop: 6, fontSize: 11, color: '#627c71', lineHeight: 1.45 }}>
                    You do not need to submit a copy of this document — only the document number is required.
                  </div>
                </div>
                <div>
                  <label style={LABEL}>
                    Issuing country
                    <span style={{ display: 'block', fontWeight: 800, fontSize: 11, color: '#627c71' }}>or state</span>
                  </label>
                  <input
                    value={owner.govIdIssuer}
                    onChange={(e) => updateOwner(index, { govIdIssuer: e.target.value })}
                    style={INPUT}
                    placeholder='e.g. "Ireland", "Florida", "United Kingdom"'
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addOwner}
          style={{
            marginTop: 12,
            background: 'white',
            color: '#134252',
            border: '1px solid rgba(94,82,64,0.25)',
            borderRadius: 8,
            padding: '10px 14px',
            fontWeight: 900,
            cursor: 'pointer',
          }}
        >
          Add another beneficial owner
        </button>

        <div
          style={{
            marginTop: 20,
            padding: 12,
            borderRadius: 8,
            border: '1px solid rgba(94,82,64,0.15)',
            background: '#fafaf7',
            fontSize: 13,
            color: '#134252',
            lineHeight: 1.5,
          }}
        >
          By submitting this form, I certify that the information provided above is true and correct to the best of my
          knowledge and belief. I understand this certification is made under the requirements of the FinCEN Residential
          Real Estate Reporting Rule (31 CFR 1031.320).
        </div>

        {error && (
          <div style={{ marginTop: 14, padding: 12, borderRadius: 8, background: '#fee', color: '#842029', fontWeight: 700 }}>
            {error}
          </div>
        )}

        <button
          type="button"
          disabled={submitting}
          onClick={handleSubmit}
          style={{
            marginTop: 16,
            width: '100%',
            padding: '14px 16px',
            borderRadius: 8,
            border: 'none',
            background: submitting ? '#94a3a8' : '#208096',
            color: 'white',
            fontWeight: 900,
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontSize: 15,
          }}
        >
          {submitting ? 'Submitting…' : 'Submit certification'}
        </button>
      </div>
    </div>
  )
}
