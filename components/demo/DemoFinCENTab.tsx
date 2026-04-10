'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useDemoStore } from '@/lib/demo/store'
import { isFincenEligibleMatter } from '@/lib/demo/fincenEligibility'
import type { DemoMatter, FinCENPropertyInfo, FinCENReportStatus, FinCENReportingParty } from '@/lib/demo/types'

type Props = {
  matter: DemoMatter
}

const INPUT_STYLE = {
  width: '100%',
  padding: '8px',
  borderRadius: '6px',
  border: '1px solid rgba(94,82,64,0.2)',
  fontSize: '14px',
  color: '#134252',
} as const

const LABEL_STYLE = {
  fontSize: '12px',
  color: '#627c71',
  fontWeight: 800,
  marginBottom: '4px',
  display: 'block' as const,
}

function progressColor(value: number) {
  if (value >= 111) return '#2f855a'
  if (value >= 50) return '#208096'
  return '#f0b429'
}

function statusBadgeStyle(status: FinCENReportStatus) {
  if (status === 'ready') return { bg: '#e8f5f0', color: '#2f855a', border: 'rgba(47,133,90,0.35)', label: 'Ready to File' }
  if (status === 'in_progress') return { bg: '#fff8e6', color: '#b45309', border: 'rgba(240,180,41,0.35)', label: 'In Progress' }
  return { bg: '#f5f5f5', color: '#627c71', border: 'rgba(94,82,64,0.2)', label: 'Not Started' }
}

function formatDobDisplay(dob: string) {
  if (!dob) return ''
  const d = new Date(`${dob}T00:00:00`)
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  return dob
}

function retentionBannerStyle(deadlineIso: string) {
  const deadline = new Date(`${deadlineIso}T00:00:00`)
  const now = new Date()
  const diffDays = Math.floor((deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
  if (diffDays < 0) return { bg: '#fee2e2', border: '#c0152f', color: '#7f1d1d' }
  if (diffDays <= 90) return { bg: '#fff8e6', border: '#f0b429', color: '#b45309' }
  return { bg: '#f0f9fa', border: '#208096', color: '#134252' }
}

function countReportingComplete(f: NonNullable<DemoMatter['fincen']>) {
  const rp = f.reportingParty
  let n = 0
  if (rp.firmName.trim()) n += 1
  if (rp.firmAddress.trim()) n += 1
  if (rp.firmEin.trim()) n += 1
  if (rp.filingAttorney.trim()) n += 1
  return n
}

function countPropertyComplete(f: NonNullable<DemoMatter['fincen']>) {
  const pi = f.propertyInfo
  let n = 0
  if (pi.purchaserEntityName.trim()) n += 1
  if (pi.purchaserEntityType.trim()) n += 1
  if (pi.purchaserEin.trim()) n += 1
  if (pi.stateOfFormation.trim()) n += 1
  if (pi.totalCashAmount.trim()) n += 1
  if (pi.paymentMethods.length > 0) n += 1
  return n
}

const PAYMENT_OPTIONS = ['Wire Transfer', "Cashier's Check", 'Certified Check', 'Other'] as const

export default function DemoFinCENTab({ matter: matterProp }: Props) {
  const {
    getMatterById,
    initFinCENReport,
    updateFinCENReportingParty,
    updateFinCENPropertyInfo,
    registerFinCENCertRequest,
    cancelPendingFinCENCert,
  } = useDemoStore()

  const matter = getMatterById(matterProp.id) ?? matterProp

  const [openReporting, setOpenReporting] = useState(true)
  const [openProperty, setOpenProperty] = useState(true)
  const [openOwners, setOpenOwners] = useState(true)
  const [savedKey, setSavedKey] = useState<string | null>(null)
  const [recipientName, setRecipientName] = useState(matter.buyer.name)
  const [recipientEmail, setRecipientEmail] = useState(matter.buyerEmail)

  const isRequired = isFincenEligibleMatter(matter)
  const fincen = matter.fincen

  const progress = fincen?.completedFields ?? 0
  const barColor = progressColor(progress)
  const badge = statusBadgeStyle(fincen?.reportStatus ?? 'not_started')
  const percentage = Math.max(0, Math.min(100, Math.round((progress / 111) * 100)))

  const markSaved = (k: string) => {
    setSavedKey(k)
    window.setTimeout(() => setSavedKey((prev) => (prev === k ? null : prev)), 1500)
  }

  const certifiedOwners = useMemo(
    () => fincen?.beneficialOwners.filter((o) => o.certifiedAt) ?? [],
    [fincen?.beneficialOwners]
  )

  const suspensionBanner = (
    <div
      style={{
        border: '1px solid #f0b429',
        borderRadius: 8,
        background: '#fff8e6',
        padding: 12,
        fontSize: 13,
        color: '#134252',
        fontWeight: 700,
        lineHeight: 1.45,
      }}
    >
      ⚠️ FinCEN reporting rule currently suspended (as of March 20, 2026 — federal court ruling). Prepare your report
      now so you&apos;re ready to file when the rule resumes.
    </div>
  )

  if (!isRequired) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {suspensionBanner}
        <div
          style={{
            border: '1px solid rgba(94,82,64,0.2)',
            borderRadius: '8px',
            background: '#f8fafc',
            padding: '14px',
            color: '#134252',
            fontWeight: 700,
          }}
        >
          ℹ️ FinCEN reporting is only required for non-financed (cash) purchases by legal entities or trusts. This matter
          does not meet the filing threshold.
        </div>
      </div>
    )
  }

  if (!fincen) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {suspensionBanner}
        <div style={{ color: '#134252', fontWeight: 700 }}>
          This matter requires a FinCEN Real Estate Report.
        </div>
        <button
          type="button"
          onClick={() => initFinCENReport(matter.id)}
          style={{
            alignSelf: 'flex-start',
            background: '#208096',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '10px 20px',
            fontWeight: 900,
            cursor: 'pointer',
          }}
        >
          Begin FinCEN Report
        </button>
      </div>
    )
  }

  const rpCount = countReportingComplete(fincen)
  const piCount = countPropertyComplete(fincen)
  const certReq = fincen.certRequest

  const retentionAt = fincen.retentionDeadline
  const retentionStyle = retentionAt ? retentionBannerStyle(retentionAt) : null

  const onRp = (key: string, patch: Partial<FinCENReportingParty>) => {
    updateFinCENReportingParty(matter.id, patch)
    markSaved(key)
  }
  const onPi = (key: string, patch: Partial<FinCENPropertyInfo>) => {
    updateFinCENPropertyInfo(matter.id, patch)
    markSaved(key)
  }

  const handleSendLink = () => {
    registerFinCENCertRequest({
      matterId: matter.id,
      recipientName: recipientName.trim() || matter.buyer.name,
      recipientEmail: recipientEmail.trim() || matter.buyerEmail,
    })
  }

  const handleResend = () => {
    cancelPendingFinCENCert(matter.id)
    handleSendLink()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <style>{`
        @keyframes demoSavedFade {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-4px); }
        }
      `}</style>

      {suspensionBanner}

      <div style={{ border: '1px solid rgba(94,82,64,0.12)', borderRadius: '8px', background: 'white', padding: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ color: '#134252', fontWeight: 900 }}>FinCEN Real Estate Report</div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: '12px',
              fontWeight: 900,
              background: badge.bg,
              color: badge.color,
              border: `1px solid ${badge.border}`,
            }}
          >
            {badge.label}
          </span>
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ flex: 1, height: 10, borderRadius: 999, background: 'rgba(94,82,64,0.1)', overflow: 'hidden' }}>
            <div style={{ width: `${percentage}%`, height: '100%', background: barColor }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#134252', whiteSpace: 'nowrap' }}>
            {progress} / 111 fields complete
          </span>
        </div>
      </div>

      {/* Section 1 — Reporting Party */}
      <section style={{ border: '1px solid rgba(94,82,64,0.12)', borderRadius: '8px', background: 'white', padding: '14px' }}>
        <button
          type="button"
          onClick={() => setOpenReporting((v) => !v)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#134252', fontWeight: 900, width: '100%', textAlign: 'left' }}
        >
          {openReporting ? '▼' : '▶'} Reporting Party{' '}
          <span style={{ color: '#627c71', fontWeight: 700 }}>({rpCount}/4 fields)</span>
        </button>
        {openReporting && (
          <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={LABEL_STYLE}>Firm name</label>
              <input
                value={fincen.reportingParty.firmName}
                onChange={(e) => onRp('rp-name', { firmName: e.target.value })}
                style={INPUT_STYLE}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={LABEL_STYLE}>Firm address</label>
              <input
                value={fincen.reportingParty.firmAddress}
                onChange={(e) => onRp('rp-address', { firmAddress: e.target.value })}
                style={INPUT_STYLE}
              />
            </div>
            <div>
              <label style={LABEL_STYLE}>Firm EIN</label>
              <input
                value={fincen.reportingParty.firmEin}
                onChange={(e) => onRp('rp-ein', { firmEin: e.target.value })}
                style={INPUT_STYLE}
              />
            </div>
            <div>
              <label style={LABEL_STYLE}>Filing attorney</label>
              <input
                value={fincen.reportingParty.filingAttorney}
                onChange={(e) => onRp('rp-att', { filingAttorney: e.target.value })}
                style={INPUT_STYLE}
              />
            </div>
          </div>
        )}
      </section>

      {/* Section 2 — Property & Purchaser */}
      <section style={{ border: '1px solid rgba(94,82,64,0.12)', borderRadius: '8px', background: 'white', padding: '14px' }}>
        <button
          type="button"
          onClick={() => setOpenProperty((v) => !v)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#134252', fontWeight: 900, width: '100%', textAlign: 'left' }}
        >
          {openProperty ? '▼' : '▶'} Property &amp; Purchaser Entity{' '}
          <span style={{ color: '#627c71', fontWeight: 700 }}>({piCount}/6 items)</span>
        </button>
        {openProperty && (
          <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={LABEL_STYLE}>Purchaser entity name</label>
              <input
                value={fincen.propertyInfo.purchaserEntityName}
                onChange={(e) => onPi('pi-name', { purchaserEntityName: e.target.value })}
                style={INPUT_STYLE}
              />
            </div>
            <div>
              <label style={LABEL_STYLE}>Entity type</label>
              <select
                value={fincen.propertyInfo.purchaserEntityType}
                onChange={(e) => onPi('pi-type', { purchaserEntityType: e.target.value })}
                style={INPUT_STYLE}
              >
                <option value="">Select…</option>
                <option>LLC</option>
                <option>Trust</option>
                <option>Corporation</option>
                <option>Partnership</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label style={LABEL_STYLE}>Entity EIN / TIN</label>
              <input
                value={fincen.propertyInfo.purchaserEin}
                onChange={(e) => onPi('pi-ein', { purchaserEin: e.target.value })}
                style={INPUT_STYLE}
              />
            </div>
            <div>
              <label style={LABEL_STYLE}>State of formation</label>
              <input
                value={fincen.propertyInfo.stateOfFormation}
                onChange={(e) => onPi('pi-state', { stateOfFormation: e.target.value })}
                style={INPUT_STYLE}
              />
            </div>
            <div>
              <label style={LABEL_STYLE}>Total cash amount</label>
              <input
                value={fincen.propertyInfo.totalCashAmount}
                onChange={(e) => onPi('pi-amt', { totalCashAmount: e.target.value })}
                style={INPUT_STYLE}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={LABEL_STYLE}>Payment methods</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: '#134252', fontWeight: 700 }}>
                {PAYMENT_OPTIONS.map((method) => {
                  const checked = fincen.propertyInfo.paymentMethods.includes(method)
                  return (
                    <label key={method} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...fincen.propertyInfo.paymentMethods, method]
                            : fincen.propertyInfo.paymentMethods.filter((m) => m !== method)
                          onPi('pi-pay', { paymentMethods: next })
                        }}
                      />
                      {method}
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Section 3 — Beneficial Owners & Certification */}
      <section style={{ border: '1px solid rgba(94,82,64,0.12)', borderRadius: '8px', background: 'white', padding: '14px' }}>
        <button
          type="button"
          onClick={() => setOpenOwners((v) => !v)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#134252', fontWeight: 900, width: '100%', textAlign: 'left' }}
        >
          {openOwners ? '▼' : '▶'} Beneficial Owners &amp; Certification
        </button>
        {openOwners && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#627c71', lineHeight: 1.5 }}>
              ℹ️ Beneficial ownership data is collected under a legal obligation (31 CFR 1031.320 / AML). Data is filed
              with FinCEN, retained 5 years, and not used for any other purpose. Beneficial owners are notified via the
              certification form.
            </p>

            {certReq?.status === 'submitted' && certReq.submittedAt && (
              <div
                style={{
                  border: '1px solid rgba(47,133,90,0.35)',
                  borderRadius: 8,
                  background: '#ecfdf5',
                  padding: 12,
                  color: '#134252',
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontWeight: 900, color: '#166534', marginBottom: 6 }}>
                  ✓ Certification verification — beneficial ownership received
                </div>
                <div>
                  <span style={{ fontWeight: 800 }}>Submitted</span>{' '}
                  {new Date(certReq.submittedAt).toLocaleString()}. Certified owners are stored on this matter (see
                  below). The matter remains open; you can send another link if you need an updated certification.
                </div>
              </div>
            )}

            {certifiedOwners.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {certifiedOwners.map((owner) => (
                  <div
                    key={owner.id}
                    style={{
                      border: '1px solid rgba(47,133,90,0.35)',
                      borderRadius: 8,
                      background: '#f0fdf4',
                      padding: 12,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 12,
                        marginBottom: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ fontWeight: 900, color: '#166534' }}>✓ {owner.fullName}</div>
                      <div style={{ fontSize: 12, color: '#627c71', fontWeight: 800, whiteSpace: 'nowrap' }}>
                        Certified{' '}
                        {owner.certifiedAt
                          ? new Date(owner.certifiedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : ''}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: '#134252', lineHeight: 1.5 }}>
                      <div>DOB: {formatDobDisplay(owner.dob)}</div>
                      <div>Address: {owner.address}</div>
                      <div>Citizenship: {owner.citizenship}</div>
                      <div>TIN: {owner.tin}</div>
                      {owner.govIdType?.trim() && owner.govIdNumber?.trim() ? (
                        <div>
                          ID: {owner.govIdType} — {owner.govIdNumber}
                          {owner.govIdIssuer?.trim() ? ` (${owner.govIdIssuer})` : ''}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(!certReq || certReq.status === 'submitted') && (
              <div
                style={{
                  borderTop: '1px solid rgba(94,82,64,0.12)',
                  paddingTop: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ fontWeight: 900, color: '#134252' }}>Request client certification</div>
                <p style={{ margin: 0, fontSize: 13, color: '#627c71', lineHeight: 1.45 }}>
                  Under FinCEN rules, beneficial ownership data must be certified in writing by the entity representative.
                  Send a secure link to:
                </p>
                <div>
                  <label style={LABEL_STYLE}>Recipient name</label>
                  <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} style={INPUT_STYLE} />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Recipient email</label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    style={INPUT_STYLE}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendLink}
                  style={{
                    alignSelf: 'flex-start',
                    background: '#208096',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 16px',
                    fontWeight: 900,
                    cursor: 'pointer',
                  }}
                >
                  Send Certification Link
                </button>
              </div>
            )}

            {certReq?.status === 'pending_client' && (
              <div
                style={{
                  border: '1px solid rgba(32,128,150,0.35)',
                  borderRadius: 8,
                  background: '#f0f9fa',
                  padding: 12,
                }}
              >
                <div style={{ fontWeight: 900, color: '#166534', marginBottom: 6 }}>
                  ✓ Certification link sent to {certReq.recipientEmail}
                </div>
                <div style={{ fontSize: 13, color: '#134252', marginBottom: 6 }}>Demo link (preview as client):</div>
                <div style={{ marginBottom: 10 }}>
                  <Link href={certReq.certUrl} target="_blank" rel="noreferrer" style={{ color: '#208096', fontWeight: 800, wordBreak: 'break-all' }}>
                    {certReq.certUrl}
                  </Link>
                </div>
                <div style={{ fontWeight: 900, color: '#134252', marginBottom: 6 }}>⏳ Awaiting client certification</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleResend}
                    style={{
                      background: 'white',
                      color: '#134252',
                      border: '1px solid rgba(94,82,64,0.25)',
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Resend
                  </button>
                  <button
                    type="button"
                    onClick={() => cancelPendingFinCENCert(matter.id)}
                    style={{
                      background: 'white',
                      color: '#c0152f',
                      border: '1px solid rgba(192,21,47,0.35)',
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {retentionAt && retentionStyle && (
        <div
          style={{
            border: `1px solid ${retentionStyle.border}`,
            background: retentionStyle.bg,
            color: retentionStyle.color,
            borderRadius: '8px',
            padding: '12px',
            fontWeight: 800,
            fontSize: 13,
          }}
        >
          ⏱ AML records must be retained until{' '}
          {new Date(`${retentionAt}T00:00:00`).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}{' '}
          (5 years — 31 CFR 1031.320)
        </div>
      )}

      {savedKey && (
        <div
          style={{
            alignSelf: 'flex-end',
            color: '#2f855a',
            fontWeight: 900,
            fontSize: '12px',
            animation: 'demoSavedFade 1.5s ease forwards',
          }}
        >
          Saved ✓
        </div>
      )}
    </div>
  )
}
