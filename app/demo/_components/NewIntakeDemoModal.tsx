'use client'

import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import type { DemoIntakeDemoDelivery, DemoIntakeSnapshot, DemoMatter, DemoPartyType, DemoTransactionRole } from '@/lib/demo/types'
import { DEMO_BUYER_TYPE_OPTIONS, DEMO_TRANSACTION_ROLE_OPTIONS } from '@/lib/demo/demoIntakeFlow'
import { useDemoStore } from '@/lib/demo/store'
import { isCondoDiligenceEligible } from '@/lib/demo/condoDiligence'

type Props = {
  isOpen: boolean
  onClose: () => void
  nextFileId: string
  onCreateDemo: () => void
  mode?: 'demo' | 'standard'
}

type FormValues = {
  fileReference: string
  clientName: string
  clientEmail: string
  clientPhone: string
  transactionRole: DemoTransactionRole
  transactionRoleOther: string
  buyerType: DemoPartyType
  matterType: string
  propertyAddress: string
  propertyType: DemoMatter['property']['property_type']
  county: string
  targetClosingDate: string
  notes: string
}

type DemoPayload = {
  fileReference: string
  clientName: string
  emailGreetingName: string
  emailTo: string
  clientEmail: string
  clientPhone: string
  propertyAddress: string
  county: string
  transactionType: string
  closingDate: string
  notes: string
  transactionRoleSummary: string
}

type PreviewData = {
  payload: DemoPayload
  subject: string
  emailBody: string
  intakeUrl: string
}

const DEFAULT_EMAIL_SUBJECT = 'Please review and confirm your property details'
const DEFAULT_EMAIL_BODY =
  'Please review the details of your upcoming property transaction and update anything that is incorrect.'

type FieldRow = {
  key: keyof Omit<FormValues, 'fileReference'>
  label: string
  type: 'text' | 'email' | 'tel' | 'date' | 'select' | 'textarea'
  options?: string[]
}

const leadFieldRows: FieldRow[] = [
  { key: 'clientName', label: 'Client name', type: 'text' },
  { key: 'clientEmail', label: 'Client email', type: 'email' },
  { key: 'clientPhone', label: 'Client phone', type: 'tel' },
]

const tailFieldRows: FieldRow[] = [
  {
    key: 'matterType',
    label: 'Matter type',
    type: 'select',
    options: [
      'Financed Residential Purchase',
      'Cash Residential Purchase',
      'Residential Purchase - New File',
      'Refinance',
      'Commercial Purchase',
    ],
  },
  { key: 'propertyAddress', label: 'Property address', type: 'text' },
  {
    key: 'propertyType',
    label: 'Property type',
    type: 'select',
    options: ['Single-Family Home', 'Condo', 'Townhouse', 'Commercial', 'Land'],
  },
  { key: 'county', label: 'County', type: 'text' },
  { key: 'targetClosingDate', label: 'Target closing date', type: 'date' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
]

function transactionRoleSummary(v: FormValues): string {
  if (v.transactionRole === 'other') {
    const t = v.transactionRoleOther.trim()
    return t ? `Other (${t})` : 'Other'
  }
  return DEMO_TRANSACTION_ROLE_OPTIONS.find((o) => o.value === v.transactionRole)?.label ?? v.transactionRole
}

function toIntakeSnapshot(values: FormValues): DemoIntakeSnapshot {
  return {
    clientName: values.clientName,
    clientEmail: values.clientEmail,
    clientPhone: values.clientPhone,
    transactionRole: values.transactionRole,
    transactionRoleOther: values.transactionRole === 'other' ? values.transactionRoleOther : '',
    buyerType:
      values.transactionRole === 'buyer' || values.transactionRole === 'both' ? values.buyerType : undefined,
    matterType: values.matterType,
    propertyAddress: values.propertyAddress,
    propertyType: values.propertyType,
    county: values.county,
    targetClosingDate: values.targetClosingDate,
    notes: values.notes,
  }
}

function makePreview(
  values: FormValues,
  nextFileId: string,
  subject: string,
  emailBody: string,
  emailRecipientName: string,
  emailRecipientEmail: string,
  token: string,
  origin: string
): PreviewData {
  const fill = (v: string, d: string) => v.trim() || d
  const path = `/demo/intake/${token || 'pending'}`
  const intakeUrl = origin ? `${origin}${path}` : path
  const payload: DemoPayload = {
    fileReference: values.fileReference || nextFileId,
    clientName: fill(values.clientName, 'John Sample'),
    emailGreetingName: fill(emailRecipientName, 'Jane Recipient'),
    emailTo: fill(emailRecipientEmail, 'jane.recipient@example.com'),
    clientEmail: fill(values.clientEmail, 'john.sample@example.com'),
    clientPhone: fill(values.clientPhone, '(555) 123-4567'),
    propertyAddress: fill(values.propertyAddress, '123 Sample Street, Sampleville, FL'),
    county: fill(values.county, 'Orange County'),
    transactionType: fill(values.matterType, 'Purchase'),
    closingDate: fill(values.targetClosingDate, '2026-12-31'),
    notes: fill(values.notes, 'Please confirm legal name spelling and closing attendance details.'),
    transactionRoleSummary: transactionRoleSummary(values),
  }
  return {
    payload,
    subject: subject.trim() || DEFAULT_EMAIL_SUBJECT,
    emailBody: emailBody.trim() || DEFAULT_EMAIL_BODY,
    intakeUrl,
  }
}

function newIntakeToken(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, '').slice(0, 16)
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)
}

export default function NewIntakeDemoModal({ isOpen, onClose, nextFileId, onCreateDemo, mode = 'demo' }: Props) {
  const { registerIntakeLead } = useDemoStore()
  const [phase, setPhase] = useState<'editing' | 'generated'>('editing')
  const [lastDelivery, setLastDelivery] = useState<DemoIntakeDemoDelivery | null>(null)
  const [generated, setGenerated] = useState<PreviewData | null>(null)
  const [linkToken, setLinkToken] = useState('')
  const [origin, setOrigin] = useState('')
  const [values, setValues] = useState<FormValues>({
    fileReference: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    transactionRole: 'buyer',
    transactionRoleOther: '',
    buyerType: 'individual',
    matterType: 'Financed Residential Purchase',
    propertyAddress: '',
    propertyType: 'Single-Family Home',
    county: '',
    targetClosingDate: '',
    notes: '',
  })

  const [emailSubject, setEmailSubject] = useState(DEFAULT_EMAIL_SUBJECT)
  const [emailBody, setEmailBody] = useState(DEFAULT_EMAIL_BODY)
  const [emailRecipientName, setEmailRecipientName] = useState('')
  const [emailRecipientEmail, setEmailRecipientEmail] = useState('')

  useLayoutEffect(() => {
    if (!isOpen) return
    setPhase('editing')
    setGenerated(null)
    setLastDelivery(null)
    setLinkToken(newIntakeToken())
    setEmailSubject(DEFAULT_EMAIL_SUBJECT)
    setEmailBody(DEFAULT_EMAIL_BODY)
    setEmailRecipientName('')
    setEmailRecipientEmail('')
    setValues((prev) => ({
      ...prev,
      fileReference: nextFileId,
      transactionRole: 'buyer',
      transactionRoleOther: '',
      buyerType: 'individual',
    }))
  }, [isOpen, nextFileId])

  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKeyDown)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prev
    }
  }, [isOpen, onClose])

  const live = useMemo(
    () =>
      makePreview(
        { ...values, fileReference: values.fileReference || nextFileId },
        nextFileId,
        emailSubject,
        emailBody,
        emailRecipientName,
        emailRecipientEmail,
        linkToken,
        origin
      ),
    [values, nextFileId, emailSubject, emailBody, emailRecipientName, emailRecipientEmail, linkToken, origin]
  )
  const preview = phase === 'generated' && generated ? generated : live
  const condoDiligenceMayApply = useMemo(
    () =>
      isCondoDiligenceEligible({
        matter_type: values.matterType,
        property: { address: values.propertyAddress, property_type: values.propertyType },
      }),
    [values.matterType, values.propertyAddress, values.propertyType]
  )

  const setLawyerValue = <K extends keyof FormValues>(k: K, val: FormValues[K]) => {
    setValues((p) => ({ ...p, [k]: val }))
  }

  function commitDemoLead(delivery: DemoIntakeDemoDelivery) {
    const snap = toIntakeSnapshot(values)
    const pv = makePreview(
      { ...values, fileReference: values.fileReference || nextFileId },
      nextFileId,
      emailSubject,
      emailBody,
      emailRecipientName,
      emailRecipientEmail,
      linkToken,
      origin
    )
    setGenerated(pv)
    setLastDelivery(delivery)
    registerIntakeLead({
      token: linkToken,
      fileReference: values.fileReference || nextFileId,
      emailRecipientName: pv.payload.emailGreetingName,
      emailRecipientEmail: pv.payload.emailTo,
      emailSubject: pv.subject,
      emailBody: pv.emailBody,
      intakeUrl: pv.intakeUrl,
      demoDelivery: delivery,
      intake: snap,
    })
    setPhase('generated')
    onCreateDemo()
  }

  if (!isOpen) return null

  const roInput = {
    width: '100%' as const,
    padding: '10px 12px',
    borderRadius: 6,
    border: '1px solid rgba(94,82,64,0.22)',
    background: '#f4f4f0',
    color: '#134252',
    cursor: 'not-allowed' as const,
    boxSizing: 'border-box' as const,
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-intake-demo-title"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        zIndex: 55,
      }}
    >
      <style>{`
        @media (max-width: 960px) {
          .new-intake-demo-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div
        style={{
          width: '100%',
          maxWidth: 1120,
          background: '#fcfcf9',
          borderRadius: 10,
          border: '1px solid rgba(94,82,64,0.25)',
          boxShadow: '0 18px 40px rgba(0,0,0,0.25)',
          maxHeight: '92vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(94,82,64,0.15)',
            display: 'flex',
            alignItems: 'center',
            background: '#faf9f5',
          }}
        >
          <div>
            <div id="new-intake-demo-title" style={{ fontSize: 22, fontWeight: 900, color: '#134252' }}>
              New Intake
            </div>
            <div style={{ color: '#627c71', fontSize: 13 }}>
              Configure intake details and preview the secure form. File reference stays internal.
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#627c71', cursor: 'pointer', fontSize: 18, fontWeight: 900 }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '14px 18px', overflowY: 'auto', flex: 1 }}>
          <div className="new-intake-demo-grid" style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <section
                style={{
                  background: '#f0f4f6',
                  border: '1px solid rgba(19,66,82,0.2)',
                  borderRadius: 10,
                  padding: 14,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontWeight: 900, color: '#134252', fontSize: 15 }}>Internal (lawyer only)</div>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: '#134252',
                      color: 'white',
                      fontWeight: 900,
                      fontSize: 11,
                      letterSpacing: '0.02em',
                    }}
                  >
                    Never sent to client
                  </span>
                </div>
                <p style={{ margin: '0 0 10px', fontSize: 12, color: '#5a6d66', lineHeight: 1.45 }}>
                  File reference is not included in the client preview or emailed intake link form.
                </p>
                <label htmlFor="demo-internal-file-ref" style={{ fontSize: 12, color: '#627c71', fontWeight: 800 }}>
                  File reference
                </label>
                <input
                  id="demo-internal-file-ref"
                  value={values.fileReference || nextFileId}
                  readOnly
                  disabled
                  aria-readonly="true"
                  style={{
                    width: '100%',
                    marginTop: 6,
                    padding: '10px 12px',
                    borderRadius: 6,
                    border: '1px solid rgba(94,82,64,0.22)',
                    background: '#e8ecee',
                    color: '#134252',
                  }}
                />
              </section>

              <section style={{ background: 'white', border: '1px solid rgba(94,82,64,0.2)', borderRadius: 10, padding: 14 }}>
                <div style={{ fontWeight: 900, color: '#134252', marginBottom: 8, fontSize: 15 }}>Email (lawyer)</div>
                <p style={{ margin: '0 0 10px', fontSize: 12, color: '#627c71' }}>
                  Greeting and To line for the message. Separate from the secure intake fields below.
                </p>
                <div style={{ marginBottom: 10 }}>
                  <label htmlFor="intake-email-recipient-name" style={{ fontSize: 12, color: '#627c71', fontWeight: 800 }}>
                    Recipient name (greeting)
                  </label>
                  <input
                    id="intake-email-recipient-name"
                    type="text"
                    value={emailRecipientName}
                    onChange={(e) => setEmailRecipientName(e.target.value)}
                    placeholder="e.g. Jane Recipient"
                    style={{ width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 6, border: '1px solid rgba(94,82,64,0.22)' }}
                  />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label htmlFor="intake-email-recipient-email" style={{ fontSize: 12, color: '#627c71', fontWeight: 800 }}>
                    Recipient email (To)
                  </label>
                  <input
                    id="intake-email-recipient-email"
                    type="email"
                    value={emailRecipientEmail}
                    onChange={(e) => setEmailRecipientEmail(e.target.value)}
                    placeholder="client@example.com"
                    style={{ width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 6, border: '1px solid rgba(94,82,64,0.22)' }}
                  />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label htmlFor="intake-email-subject" style={{ fontSize: 12, color: '#627c71', fontWeight: 800 }}>
                    Subject
                  </label>
                  <input
                    id="intake-email-subject"
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    style={{ width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 6, border: '1px solid rgba(94,82,64,0.22)' }}
                  />
                </div>
                <div>
                  <label htmlFor="intake-email-body" style={{ fontSize: 12, color: '#627c71', fontWeight: 800 }}>
                    Message
                  </label>
                  <textarea
                    id="intake-email-body"
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    rows={4}
                    style={{
                      width: '100%',
                      marginTop: 4,
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: '1px solid rgba(94,82,64,0.22)',
                      resize: 'vertical',
                      lineHeight: 1.45,
                    }}
                  />
                </div>
              </section>

              <section style={{ background: 'white', border: '1px solid rgba(94,82,64,0.2)', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ fontWeight: 900, color: '#134252' }}>Intake details</div>
                  {condoDiligenceMayApply && (
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 900,
                        border: '1px solid rgba(30,64,175,0.25)',
                        color: '#1e40af',
                        background: '#dbeafe',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Condo diligence may apply
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {leadFieldRows.map((f) => (
                    <div key={f.key}>
                      <label htmlFor={`intake-${f.key}`} style={{ fontSize: 12, color: '#627c71', fontWeight: 800 }}>
                        {f.label}
                      </label>
                      <input
                        id={`intake-${f.key}`}
                        type={f.type}
                        value={values[f.key]}
                        onChange={(e) => setLawyerValue(f.key, e.target.value)}
                        style={{
                          width: '100%',
                          marginTop: 4,
                          padding: '10px 12px',
                          borderRadius: 6,
                          border: '1px solid rgba(94,82,64,0.22)',
                        }}
                      />
                    </div>
                  ))}

                  <div>
                    <div style={{ fontSize: 12, color: '#627c71', fontWeight: 800, marginBottom: 6 }}>What is your role in this transaction?</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {DEMO_TRANSACTION_ROLE_OPTIONS.map((o) => (
                        <label
                          key={o.value}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: '#134252' }}
                        >
                          <input
                            type="radio"
                            name="demo-intake-tx-role"
                            checked={values.transactionRole === o.value}
                            onChange={() => {
                              setLawyerValue('transactionRole', o.value)
                              if (o.value !== 'other') setLawyerValue('transactionRoleOther', '')
                            }}
                          />
                          {o.label}
                        </label>
                      ))}
                    </div>
                    {values.transactionRole === 'other' && (
                      <div style={{ marginTop: 10 }}>
                        <label htmlFor="intake-tx-role-other" style={{ fontSize: 12, color: '#627c71', fontWeight: 800 }}>
                          Describe (short)
                        </label>
                        <input
                          id="intake-tx-role-other"
                          type="text"
                          value={values.transactionRoleOther}
                          onChange={(e) => setLawyerValue('transactionRoleOther', e.target.value)}
                          placeholder="e.g. lender rep, POA, estate"
                          style={{
                            width: '100%',
                            marginTop: 4,
                            padding: '10px 12px',
                            borderRadius: 6,
                            border: '1px solid rgba(94,82,64,0.22)',
                          }}
                        />
                      </div>
                    )}
                    {(values.transactionRole === 'buyer' || values.transactionRole === 'both') && (
                      <div style={{ marginTop: 12 }}>
                        <label htmlFor="intake-buyer-type" style={{ fontSize: 12, color: '#627c71', fontWeight: 800 }}>
                          Buyer type
                        </label>
                        <select
                          id="intake-buyer-type"
                          value={values.buyerType}
                          onChange={(e) => setLawyerValue('buyerType', e.target.value as DemoPartyType)}
                          style={{
                            width: '100%',
                            marginTop: 4,
                            padding: '10px 12px',
                            borderRadius: 6,
                            border: '1px solid rgba(94,82,64,0.22)',
                          }}
                        >
                          {DEMO_BUYER_TYPE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {tailFieldRows.map((f) => (
                    <div key={f.key}>
                      <label htmlFor={`intake-${f.key}`} style={{ fontSize: 12, color: '#627c71', fontWeight: 800 }}>
                        {f.label}
                      </label>
                      {f.type === 'select' ? (
                        <select
                          id={`intake-${f.key}`}
                          value={values[f.key]}
                          onChange={(e) => setLawyerValue(f.key, e.target.value)}
                          style={{
                            width: '100%',
                            marginTop: 4,
                            padding: '10px 12px',
                            borderRadius: 6,
                            border: '1px solid rgba(94,82,64,0.22)',
                          }}
                        >
                          {(f.options ?? []).map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      ) : f.type === 'textarea' ? (
                        <textarea
                          id={`intake-${f.key}`}
                          value={values[f.key]}
                          onChange={(e) => setLawyerValue(f.key, e.target.value)}
                          rows={3}
                          style={{
                            width: '100%',
                            marginTop: 4,
                            padding: '10px 12px',
                            borderRadius: 6,
                            border: '1px solid rgba(94,82,64,0.22)',
                            resize: 'vertical',
                            lineHeight: 1.45,
                          }}
                        />
                      ) : (
                        <input
                          id={`intake-${f.key}`}
                          type={f.type}
                          value={values[f.key]}
                          onChange={(e) => setLawyerValue(f.key, e.target.value)}
                          style={{
                            width: '100%',
                            marginTop: 4,
                            padding: '10px 12px',
                            borderRadius: 6,
                            border: '1px solid rgba(94,82,64,0.22)',
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: '1px solid #f0b429',
                  background: '#fff8e6',
                  color: '#134252',
                  fontWeight: 900,
                  fontSize: 13,
                }}
              >
                Demo only — no real emails are sent.
              </div>

              <section style={{ background: 'white', border: '1px solid rgba(94,82,64,0.2)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(94,82,64,0.1)', background: '#fcfcf9' }}>
                  <div style={{ fontWeight: 900, color: '#134252' }}>Email preview</div>
                  <div style={{ color: '#627c71', fontSize: 12 }}>Summary only — full message below</div>
                </div>
                <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: '#627c71' }}>
                  <div>
                    <strong>To:</strong> {preview.payload.emailTo}
                  </div>
                  <div>
                    <strong>Subject:</strong> {preview.subject}
                  </div>
                  <div style={{ border: '1px solid rgba(94,82,64,0.12)', borderRadius: 8, padding: 10, background: '#fafaf7' }}>
                    <p style={{ margin: '0 0 8px', color: '#134252', fontWeight: 700 }}>Hi {preview.payload.emailGreetingName},</p>
                    <p style={{ margin: 0, color: '#134252', whiteSpace: 'pre-wrap', fontSize: 13 }}>{preview.emailBody}</p>
                    <div style={{ marginTop: 10, fontSize: 12, color: '#134252' }}>
                      <div>Role: {preview.payload.transactionRoleSummary}</div>
                      <div>Property: {preview.payload.propertyAddress}</div>
                      <div>Transaction: {preview.payload.transactionType}</div>
                      <div>Closing: {preview.payload.closingDate}</div>
                    </div>
                    <button type="button" disabled style={{ marginTop: 10, background: '#208096', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8, fontWeight: 900, opacity: 0.9 }}>
                      Open secure intake form
                    </button>
                    <div style={{ marginTop: 8, fontSize: 11, wordBreak: 'break-all' }}>{preview.intakeUrl}</div>
                  </div>
                </div>
              </section>

              <section style={{ background: 'white', border: '1px solid rgba(94,82,64,0.25)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(94,82,64,0.1)', background: 'linear-gradient(180deg, #f7faf9 0%, #fcfcf9 100%)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 900, color: '#134252', fontSize: 16 }}>Secure form preview</div>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 900,
                        border: '1px solid rgba(32,128,150,0.35)',
                        color: '#208096',
                        background: '#e8f5f0',
                      }}
                    >
                      Read-only
                    </span>
                  </div>
                  <div style={{ color: '#627c71', fontSize: 12, marginTop: 4 }}>What the client would see after opening the link</div>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 900, color: '#134252' }}>Review and complete your intake form</h3>
                  <p style={{ margin: '0 0 14px', fontSize: 13, color: '#627c71', lineHeight: 1.45 }}>
                    Please review the details below and update anything that is incorrect.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {leadFieldRows.map((f) => (
                      <div key={`pv-${f.key}`}>
                        <label htmlFor={`pv-${f.key}`} style={{ fontSize: 12, color: '#627c71', fontWeight: 800, display: 'block', marginBottom: 4 }}>
                          {f.label}
                        </label>
                        <input id={`pv-${f.key}`} type={f.type} value={values[f.key]} readOnly style={roInput} />
                      </div>
                    ))}
                    <div>
                      <div style={{ fontSize: 12, color: '#627c71', fontWeight: 800, marginBottom: 4 }}>What is your role in this transaction?</div>
                      <input readOnly value={transactionRoleSummary(values)} style={roInput} />
                      {values.transactionRole === 'other' ? (
                        <div style={{ marginTop: 10 }}>
                          <div style={{ fontSize: 12, color: '#627c71', fontWeight: 800, marginBottom: 4 }}>Describe (short)</div>
                          <input readOnly value={values.transactionRoleOther} style={roInput} />
                        </div>
                      ) : null}
                      {(values.transactionRole === 'buyer' || values.transactionRole === 'both') && (
                        <div style={{ marginTop: 10 }}>
                          <div style={{ fontSize: 12, color: '#627c71', fontWeight: 800, marginBottom: 4 }}>Buyer type</div>
                          <input
                            readOnly
                            value={DEMO_BUYER_TYPE_OPTIONS.find((o) => o.value === values.buyerType)?.label ?? ''}
                            style={roInput}
                          />
                        </div>
                      )}
                    </div>
                    {tailFieldRows.map((f) => (
                      <div key={`pv-${f.key}`}>
                        <label htmlFor={`pv-${f.key}`} style={{ fontSize: 12, color: '#627c71', fontWeight: 800, display: 'block', marginBottom: 4 }}>
                          {f.label}
                        </label>
                        {f.type === 'select' ? (
                          <select id={`pv-${f.key}`} value={values[f.key]} disabled style={roInput}>
                            {(f.options ?? []).map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        ) : f.type === 'textarea' ? (
                          <textarea id={`pv-${f.key}`} value={values[f.key]} readOnly rows={3} style={{ ...roInput, resize: 'none' }} />
                        ) : (
                          <input id={`pv-${f.key}`} type={f.type} value={values[f.key]} readOnly style={roInput} />
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled
                    style={{
                      width: '100%',
                      marginTop: 16,
                      background: '#94a3a8',
                      color: 'white',
                      border: 'none',
                      padding: '12px 14px',
                      borderRadius: 8,
                      fontWeight: 900,
                      cursor: 'not-allowed',
                    }}
                  >
                    Submit Intake
                  </button>
                </div>
              </section>
            </div>
          </div>

          {phase === 'generated' ? (
            <div
              style={{
                marginTop: 14,
                border: '1px solid rgba(47,133,90,0.25)',
                background: '#e8f5f0',
                color: '#2f855a',
                borderRadius: 8,
                padding: 12,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <strong>
                {lastDelivery === 'email_sent'
                  ? `Demo: pseudo-email sent to ${preview.payload.emailTo}, intake link saved (no real email). Lead added to Intake / Leads.`
                  : 'Intake link generated and saved locally for demo. View it on Intake / Leads (link copied below).'}
              </strong>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setPhase('editing')}
                  style={{
                    background: 'white',
                    color: '#134252',
                    border: '1px solid rgba(94,82,64,0.25)',
                    padding: '8px 10px',
                    borderRadius: 8,
                    fontWeight: 900,
                    cursor: 'pointer',
                  }}
                >
                  Back to edit
                </button>
                <button
                  type="button"
                  onClick={() => window.open(preview.intakeUrl, '_blank', 'noopener,noreferrer')}
                  style={{ background: '#208096', color: 'white', border: 'none', padding: '8px 10px', borderRadius: 8, fontWeight: 900, cursor: 'pointer' }}
                >
                  View as client
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 10,
                marginTop: 14,
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={onClose}
                style={{ background: 'white', color: '#134252', border: '1px solid rgba(94,82,64,0.25)', padding: '10px 14px', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}
              >
                Cancel
              </button>
              {mode === 'demo' ? (
                <>
                  <button
                    type="button"
                    onClick={() => commitDemoLead('link_saved')}
                    style={{
                      background: '#134252',
                      color: 'white',
                      border: 'none',
                      padding: '10px 14px',
                      borderRadius: 8,
                      fontWeight: 900,
                      cursor: 'pointer',
                    }}
                  >
                    Generate intake link and save (Demo)
                  </button>
                  <button
                    type="button"
                    onClick={() => commitDemoLead('email_sent')}
                    style={{
                      background: '#208096',
                      color: 'white',
                      border: 'none',
                      padding: '10px 14px',
                      borderRadius: 8,
                      fontWeight: 900,
                      cursor: 'pointer',
                    }}
                  >
                    Send and save (Demo)
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => onCreateDemo()}
                  style={{ background: '#208096', color: 'white', border: 'none', padding: '10px 14px', borderRadius: 8, fontWeight: 900, cursor: 'pointer' }}
                >
                  Send intake email
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
