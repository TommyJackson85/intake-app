'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { DEMO_BUYER_TYPE_OPTIONS, DEMO_TRANSACTION_ROLE_OPTIONS } from '@/lib/demo/demoIntakeFlow'
import type { DemoIntakeSnapshot, DemoPartyType, DemoTransactionRole } from '@/lib/demo/types'
import { useDemoStore } from '@/lib/demo/store'

function normalizeSnapshot(s: DemoIntakeSnapshot): DemoIntakeSnapshot {
  return {
    ...s,
    transactionRole: s.transactionRole ?? 'buyer',
    transactionRoleOther: s.transactionRoleOther ?? '',
    propertyType: s.propertyType ?? 'Single-Family Home',
  }
}

type FieldDef = {
  key: Exclude<keyof DemoIntakeSnapshot, 'transactionRole' | 'transactionRoleOther'>
  label: string
  kind: 'text' | 'email' | 'tel' | 'date' | 'select' | 'textarea'
  options?: string[]
}

const leadFieldDefs: FieldDef[] = [
  { key: 'clientName', label: 'Client name', kind: 'text' },
  { key: 'clientEmail', label: 'Client email', kind: 'email' },
  { key: 'clientPhone', label: 'Client phone', kind: 'tel' },
]

const tailFieldDefs: FieldDef[] = [
  {
    key: 'matterType',
    label: 'Matter type',
    kind: 'select',
    options: [
      'Financed Residential Purchase',
      'Cash Residential Purchase',
      'Residential Purchase - New File',
      'Refinance',
      'Commercial Purchase',
    ],
  },
  { key: 'propertyAddress', label: 'Property address', kind: 'text' },
  {
    key: 'propertyType',
    label: 'Property type',
    kind: 'select',
    options: ['Single-Family Home', 'Condo', 'Townhouse', 'Commercial', 'Land'],
  },
  { key: 'county', label: 'County', kind: 'text' },
  { key: 'targetClosingDate', label: 'Target closing date', kind: 'date' },
  { key: 'notes', label: 'Notes', kind: 'textarea' },
]

export default function DemoClientIntakePage() {
  const params = useParams()
  const token = typeof params.token === 'string' ? params.token : ''
  const { intakeLeads, submitDemoIntakeLead } = useDemoStore()
  const lead = useMemo(() => intakeLeads.find((l) => l.token === token), [intakeLeads, token])

  const [form, setForm] = useState<DemoIntakeSnapshot | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!lead) return
    setForm(normalizeSnapshot(lead.submittedIntake ?? lead.intake))
  }, [lead])

  const submitted = lead?.status === 'submitted'

  const setField = <K extends keyof DemoIntakeSnapshot>(k: K, v: DemoIntakeSnapshot[K]) => {
    setForm((prev) => (prev ? { ...prev, [k]: v } : prev))
  }

  const setTransactionRole = (role: DemoTransactionRole) => {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            transactionRole: role,
            transactionRoleOther: role === 'other' ? prev.transactionRoleOther : '',
          }
        : prev
    )
  }

  if (!token) {
    return (
      <div style={{ color: '#134252' }}>
        <p>Invalid link.</p>
        <Link href="/demo/intakes" style={{ color: '#208096', fontWeight: 800 }}>
          Back to Intake / Leads
        </Link>
      </div>
    )
  }

  if (!lead) {
    return (
      <div style={{ color: '#134252' }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Intake link not found</h1>
        <p style={{ color: '#627c71' }}>This demo link is invalid or the session was refreshed (demo data is in-memory only).</p>
        <Link href="/demo/intakes" style={{ color: '#208096', fontWeight: 800 }}>
          Back to Intake / Leads
        </Link>
      </div>
    )
  }

  if (!form) return <p style={{ color: '#627c71' }}>Loading…</p>

  const renderFields = (defs: FieldDef[]) =>
    defs.map((f) => {
      const common = {
        width: '100%',
        padding: '10px 12px',
        borderRadius: 6,
        border: '1px solid rgba(94,82,64,0.22)',
        background: submitted ? '#f4f4f0' : 'white',
        color: '#134252',
      } as const
      return (
        <div key={f.key}>
          <label htmlFor={`cf-${f.key}`} style={{ fontSize: 12, color: '#627c71', fontWeight: 800 }}>
            {f.label}
          </label>
          {f.kind === 'select' ? (
            <select
              id={`cf-${f.key}`}
              value={form[f.key]}
              disabled={submitted}
              onChange={(e) => setField(f.key, e.target.value)}
              style={{ ...common, marginTop: 4, cursor: submitted ? 'not-allowed' : 'pointer' }}
            >
              {(f.options ?? []).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : f.kind === 'textarea' ? (
            <textarea
              id={`cf-${f.key}`}
              value={form[f.key]}
              readOnly={submitted}
              onChange={(e) => setField(f.key, e.target.value)}
              rows={3}
              style={{ ...common, marginTop: 4, resize: submitted ? 'none' : 'vertical' }}
            />
          ) : (
            <input
              id={`cf-${f.key}`}
              type={f.kind}
              value={form[f.key]}
              readOnly={submitted}
              onChange={(e) => setField(f.key, e.target.value)}
              style={{ ...common, marginTop: 4 }}
            />
          )}
        </div>
      )
    })

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
        Demo client intake — no real data is saved to a server. Submitting updates the firm&apos;s demo Intake / Leads list in this browser tab only.
      </div>

      <div
        style={{
          background: 'white',
          border: '1px solid rgba(94,82,64,0.2)',
          borderRadius: 10,
          padding: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
          <div>
            <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 900, color: '#134252' }}>Review and complete your intake</h1>
            <p style={{ margin: 0, color: '#627c71', fontSize: 14, lineHeight: 1.45 }}>
              Please review the details below and update anything that is incorrect.
            </p>
          </div>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 900,
              border: '1px solid rgba(32,128,150,0.35)',
              color: '#208096',
              background: '#e8f5f0',
              whiteSpace: 'nowrap',
            }}
          >
            Secure form
          </span>
        </div>

        {submitted && (
          <div
            role="status"
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 8,
              background: '#e8f5f0',
              border: '1px solid rgba(47,133,90,0.35)',
              color: '#2f855a',
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            Submitted on {lead.clientSubmittedAt ? new Date(lead.clientSubmittedAt).toLocaleString() : '—'}. You can close this page.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {renderFields(leadFieldDefs)}

          <div>
            <div style={{ fontSize: 12, color: '#627c71', fontWeight: 800, marginBottom: 6 }}>What is your role in this transaction?</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DEMO_TRANSACTION_ROLE_OPTIONS.map((o) => (
                <label
                  key={o.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: submitted ? 'not-allowed' : 'pointer',
                    fontSize: 14,
                    color: '#134252',
                  }}
                >
                  <input
                    type="radio"
                    name="client-intake-tx-role"
                    checked={form.transactionRole === o.value}
                    disabled={submitted}
                    onChange={() => setTransactionRole(o.value)}
                  />
                  {o.label}
                </label>
              ))}
            </div>
            {form.transactionRole === 'other' && (
              <div style={{ marginTop: 10 }}>
                <label htmlFor="cf-transactionRoleOther" style={{ fontSize: 12, color: '#627c71', fontWeight: 800 }}>
                  Describe (short)
                </label>
                <input
                  id="cf-transactionRoleOther"
                  type="text"
                  value={form.transactionRoleOther}
                  readOnly={submitted}
                  onChange={(e) => setField('transactionRoleOther', e.target.value)}
                  placeholder="e.g. lender rep, POA, estate"
                  style={{
                    width: '100%',
                    marginTop: 4,
                    padding: '10px 12px',
                    borderRadius: 6,
                    border: '1px solid rgba(94,82,64,0.22)',
                    background: submitted ? '#f4f4f0' : 'white',
                    color: '#134252',
                  }}
                />
              </div>
            )}
          </div>

          {(form.transactionRole === 'buyer' || form.transactionRole === 'both') && (
            <div>
              <div style={{ fontSize: 12, color: '#627c71', fontWeight: 800, marginBottom: 6 }}>Buyer type</div>
              <select
                value={form.buyerType ?? ''}
                disabled={submitted}
                onChange={(e) => {
                  const v = e.target.value
                  setField('buyerType', v === '' ? undefined : (v as DemoPartyType))
                }}
                style={{
                  width: '100%',
                  marginTop: 4,
                  padding: '10px 12px',
                  borderRadius: 6,
                  border: '1px solid rgba(94,82,64,0.22)',
                  background: submitted ? '#f4f4f0' : 'white',
                  color: '#134252',
                  cursor: submitted ? 'not-allowed' : 'pointer',
                }}
              >
                <option value="">Select…</option>
                {DEMO_BUYER_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {renderFields(tailFieldDefs)}
        </div>

        {submitError && (
          <div role="alert" style={{ marginTop: 12, padding: 10, borderRadius: 8, background: '#fee', color: '#842029', fontWeight: 700, fontSize: 13 }}>
            {submitError}
          </div>
        )}

        <button
          type="button"
          disabled={submitted}
          onClick={() => {
            setSubmitError(null)
            const needsBuyer =
              form.transactionRole === 'buyer' || form.transactionRole === 'both'
            if (needsBuyer && form.buyerType !== 'individual' && form.buyerType !== 'entity') {
              setSubmitError('Please select buyer type (Individual or Legal entity / trust).')
              return
            }
            submitDemoIntakeLead(token, form)
          }}
          style={{
            width: '100%',
            marginTop: 18,
            background: submitted ? '#94a3a8' : '#208096',
            color: 'white',
            border: 'none',
            padding: '12px 14px',
            borderRadius: 8,
            fontWeight: 900,
            cursor: submitted ? 'not-allowed' : 'pointer',
          }}
        >
          {submitted ? 'Already submitted' : 'Submit Intake'}
        </button>

        <p style={{ margin: '16px 0 0', fontSize: 12, color: '#627c71' }}>
          File reference (internal): <strong>{lead.fileReference}</strong>
        </p>
      </div>
    </div>
  )
}
