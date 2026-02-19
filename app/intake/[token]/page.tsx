'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type IntakeApiResponse = {
  firm: { id: string; name: string; state: string } | null
  lead: {
    id: string
    status: string | null
    client_full_name: string | null
    client_email: string | null
    client_phone: string | null
    matter_type: string | null
    property_address: string | null
    intake_data: Record<string, any>
    created_at: string | null
    submitted_at: string | null
  }
}

type StepKey = 'contact' | 'property' | 'matter' | 'kyc'

export default function IntakeTokenPage({ params }: { params: { token: string } }) {
  const token = params.token
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<IntakeApiResponse | null>(null)
  const [step, setStep] = useState<StepKey>('contact')

  // Form state (kept minimal + guided)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const [propertyAddress, setPropertyAddress] = useState('')
  const [matterDescription, setMatterDescription] = useState('')
  const [targetClosingDate, setTargetClosingDate] = useState('')

  const [citizenshipCountry, setCitizenshipCountry] = useState('')
  const [isUsPerson, setIsUsPerson] = useState<'yes' | 'no' | ''>('')
  const [sourceOfFunds, setSourceOfFunds] = useState('')

  const firmName = data?.firm?.name || 'Client intake'

  const steps: Array<{ key: StepKey; label: string }> = useMemo(
    () => [
      { key: 'contact', label: 'Contact' },
      { key: 'property', label: 'Property' },
      { key: 'matter', label: 'Matter' },
      { key: 'kyc', label: 'KYC basics' },
    ],
    []
  )

  const stepIndex = steps.findIndex((s) => s.key === step)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/intake/${encodeURIComponent(token)}`, { method: 'GET' })
        const body = (await res.json().catch(() => null)) as IntakeApiResponse | null
        if (!res.ok || !body) throw new Error((body as any)?.error || 'This intake link is invalid or expired.')

        setData(body)

        // Prefill
        setFullName(body.lead.client_full_name || '')
        setEmail(body.lead.client_email || '')
        setPhone(body.lead.client_phone || '')
        setPropertyAddress(body.lead.property_address || '')

        const d = body.lead.intake_data || {}
        setMatterDescription(d.matterDescription || '')
        setTargetClosingDate(d.targetClosingDate || '')
        setCitizenshipCountry(d.citizenshipCountry || '')
        setIsUsPerson(d.isUsPerson || '')
        setSourceOfFunds(d.sourceOfFunds || '')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load intake')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  const save = async (patch: Record<string, any>) => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/intake/${encodeURIComponent(token)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientFullName: fullName,
          clientEmail: email,
          clientPhone: phone,
          propertyAddress,
          intakeDataPatch: {
            ...patch,
            progressStep: step,
          },
        }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error || 'Failed to save')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const next = async () => {
    // Save minimal data for the current step before advancing
    if (step === 'contact') await save({})
    if (step === 'property') await save({})
    if (step === 'matter')
      await save({
        matterDescription,
        targetClosingDate,
      })
    if (step === 'kyc')
      await save({
        citizenshipCountry,
        isUsPerson,
        sourceOfFunds,
      })

    const nextStep = steps[Math.min(stepIndex + 1, steps.length - 1)].key
    setStep(nextStep)
  }

  const back = () => {
    const prevStep = steps[Math.max(stepIndex - 1, 0)].key
    setStep(prevStep)
  }

  const submit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/intake/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intakeDataPatch: {
            matterDescription,
            targetClosingDate,
            citizenshipCountry,
            isUsPerson,
            sourceOfFunds,
            submittedFrom: 'intake_token_flow',
          },
        }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error || 'Failed to submit')

      // Reload for submitted state
      window.location.reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#fcfcf9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#627c71' }}>Loading…</div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div style={{ minHeight: '100vh', background: '#fcfcf9', padding: '40px 20px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', background: 'white', borderRadius: '8px', border: '1px solid rgba(94, 82, 64, 0.2)', padding: '22px' }}>
          <h1 style={{ marginTop: 0, marginBottom: '10px' }}>{firmName}</h1>
          <div style={{ background: '#fee', color: '#c0152f', padding: '12px', borderRadius: '6px' }}>{error}</div>
          <div style={{ marginTop: '16px' }}>
            <Link href="/privacy" style={{ color: '#208096', textDecoration: 'none', fontWeight: 700 }}>Privacy Policy</Link>
          </div>
        </div>
      </div>
    )
  }

  const alreadySubmitted = data?.lead?.status === 'submitted'

  return (
    <div style={{ minHeight: '100vh', background: '#fcfcf9', padding: '40px 20px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontWeight: 900, fontSize: '22px', color: '#134252' }}>{data?.firm?.name || 'LawIntake'}</div>
          <div style={{ color: '#627c71', fontSize: '13px' }}>
            Secure intake form · Your information is used to open and manage your matter.
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '10px', border: '1px solid rgba(94, 82, 64, 0.2)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(94, 82, 64, 0.15)', background: '#fcfcf9' }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {steps.map((s) => {
                const selected = s.key === step
                return (
                  <div
                    key={s.key}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '999px',
                      border: selected ? '1px solid #208096' : '1px solid rgba(94, 82, 64, 0.2)',
                      background: selected ? '#e8f5f0' : 'white',
                      fontWeight: 900,
                      fontSize: '12px',
                      color: '#134252',
                    }}
                  >
                    {s.label}
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ padding: '18px 16px' }}>
            {alreadySubmitted ? (
              <div>
                <h1 style={{ marginTop: 0, marginBottom: '10px', fontSize: '26px' }}>Thanks — we’ve received your intake</h1>
                <p style={{ marginTop: 0, color: '#627c71', lineHeight: '1.6' }}>
                  Your law firm has been notified. If additional documents or information are needed, they will contact you.
                </p>
              </div>
            ) : (
              <>
                {step === 'contact' && (
                  <div>
                    <h1 style={{ marginTop: 0, marginBottom: '10px', fontSize: '26px' }}>Contact details</h1>
                    <p style={{ marginTop: 0, color: '#627c71', lineHeight: '1.6' }}>
                      Start with the basics so the firm can reach you quickly.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontWeight: 800, marginBottom: '6px' }}>Full name</label>
                        <input
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid rgba(94, 82, 64, 0.2)' }}
                          placeholder="Jane Doe"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: 800, marginBottom: '6px' }}>Email *</label>
                        <input
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          type="email"
                          style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid rgba(94, 82, 64, 0.2)' }}
                          placeholder="jane@example.com"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: 800, marginBottom: '6px' }}>Phone</label>
                        <input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid rgba(94, 82, 64, 0.2)' }}
                          placeholder="+1 305 555 0123"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {step === 'property' && (
                  <div>
                    <h1 style={{ marginTop: 0, marginBottom: '10px', fontSize: '26px' }}>Property details</h1>
                    <p style={{ marginTop: 0, color: '#627c71', lineHeight: '1.6' }}>
                      This helps the firm quickly identify the transaction and run the right checks.
                    </p>

                    <div>
                      <label style={{ display: 'block', fontWeight: 800, marginBottom: '6px' }}>Property address</label>
                      <input
                        value={propertyAddress}
                        onChange={(e) => setPropertyAddress(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid rgba(94, 82, 64, 0.2)' }}
                        placeholder="123 Palm Ave, Miami, FL"
                      />
                    </div>
                  </div>
                )}

                {step === 'matter' && (
                  <div>
                    <h1 style={{ marginTop: 0, marginBottom: '10px', fontSize: '26px' }}>Your matter</h1>
                    <p style={{ marginTop: 0, color: '#627c71', lineHeight: '1.6' }}>
                      A short description is enough — you can provide more later.
                    </p>

                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontWeight: 800, marginBottom: '6px' }}>Brief description</label>
                      <textarea
                        value={matterDescription}
                        onChange={(e) => setMatterDescription(e.target.value)}
                        rows={5}
                        style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid rgba(94, 82, 64, 0.2)' }}
                        placeholder="Example: We’re purchasing a condo and need title search + closing..."
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: 800, marginBottom: '6px' }}>Target closing date (optional)</label>
                      <input
                        value={targetClosingDate}
                        onChange={(e) => setTargetClosingDate(e.target.value)}
                        type="date"
                        style={{ padding: '12px', borderRadius: '6px', border: '1px solid rgba(94, 82, 64, 0.2)' }}
                      />
                    </div>
                  </div>
                )}

                {step === 'kyc' && (
                  <div>
                    <h1 style={{ marginTop: 0, marginBottom: '10px', fontSize: '26px' }}>KYC basics</h1>
                    <p style={{ marginTop: 0, color: '#627c71', lineHeight: '1.6' }}>
                      Some firms are required to collect identity/source-of-funds information for AML compliance.
                      Provide what you can now — the firm may request documents later.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontWeight: 800, marginBottom: '6px' }}>Citizenship country</label>
                        <input
                          value={citizenshipCountry}
                          onChange={(e) => setCitizenshipCountry(e.target.value)}
                          style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid rgba(94, 82, 64, 0.2)' }}
                          placeholder="United States"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: 800, marginBottom: '6px' }}>US citizen or resident?</label>
                        <select
                          value={isUsPerson}
                          onChange={(e) => setIsUsPerson(e.target.value as any)}
                          style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid rgba(94, 82, 64, 0.2)' }}
                        >
                          <option value="">Select…</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ marginTop: '12px' }}>
                      <label style={{ display: 'block', fontWeight: 800, marginBottom: '6px' }}>
                        Source of funds (optional)
                      </label>
                      <input
                        value={sourceOfFunds}
                        onChange={(e) => setSourceOfFunds(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid rgba(94, 82, 64, 0.2)' }}
                        placeholder="Savings, sale of property, mortgage, gift, etc."
                      />
                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#627c71', lineHeight: '1.5' }}>
                        Why we ask: firms may need to record source-of-funds information to meet anti–money laundering requirements.
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {error && (
              <div style={{ marginTop: '14px', background: '#fee', color: '#c0152f', padding: '12px', borderRadius: '6px' }}>
                {error}
              </div>
            )}
          </div>

          {!alreadySubmitted && (
            <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(94, 82, 64, 0.15)', display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={back}
                disabled={stepIndex === 0 || saving || submitting}
                style={{
                  padding: '12px 16px',
                  borderRadius: '6px',
                  background: 'white',
                  border: '1px solid rgba(94, 82, 64, 0.2)',
                  fontWeight: 900,
                  cursor: stepIndex === 0 ? 'not-allowed' : 'pointer',
                  opacity: stepIndex === 0 ? 0.5 : 1,
                }}
              >
                Back
              </button>

              {stepIndex < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={next}
                  disabled={saving || submitting || !email.trim()}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '6px',
                    background: saving ? '#ccc' : '#208096',
                    color: 'white',
                    border: 'none',
                    fontWeight: 900,
                    cursor: saving || !email.trim() ? 'not-allowed' : 'pointer',
                    opacity: !email.trim() ? 0.7 : 1,
                  }}
                >
                  {saving ? 'Saving…' : 'Continue'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting || saving || !email.trim()}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '6px',
                    background: submitting ? '#ccc' : '#208096',
                    color: 'white',
                    border: 'none',
                    fontWeight: 900,
                    cursor: submitting || !email.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submitting ? 'Submitting…' : 'Submit intake'}
                </button>
              )}
            </div>
          )}

          <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(94, 82, 64, 0.08)', fontSize: '12px', color: '#627c71', lineHeight: '1.6' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link href="/terms" style={{ color: '#208096', textDecoration: 'none', fontWeight: 800 }}>Terms of Use</Link>
              <Link href="/privacy" style={{ color: '#208096', textDecoration: 'none', fontWeight: 800 }}>Privacy Notice</Link>
              <Link href="/portal-agreement" style={{ color: '#208096', textDecoration: 'none', fontWeight: 800 }}>Client Portal Agreement</Link>
            </div>
            <div style={{ marginTop: '8px' }}>
              Security: this form uses a private link and stores only what’s needed to progress your matter.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

