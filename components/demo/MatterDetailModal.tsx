'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useDemoStore } from '@/lib/demo/store'
import type { DemoMatter, DemoMatterStatus } from '@/lib/demo/types'
import { useDemoData } from '@/context/DemoDataContext'
import DemoTaskChecklist from '@/components/demo/DemoTaskChecklist'
import DemoTimelineNotes from '@/components/demo/DemoTimelineNotes'
import { displayOrFallback, parseOtherPartyInfo } from '@/lib/demo/matterPartyDisplay'
import DemoFinCENTab from '@/components/demo/DemoFinCENTab'
import { isFincenEligibleMatter } from '@/lib/demo/fincenEligibility'
import UploadDemoDocumentModal from '@/app/demo/_components/UploadDemoDocumentModal'

type MatterDetailModalProps = {
  matter: DemoMatter | null
  open: boolean
  onClose: () => void
  onArchive: (matterId: string) => void
}

function statusColor(status: DemoMatterStatus) {
  if (status === 'Closed/Post-Closing') return '#2f855a'
  if (status === 'Scheduled for Closing') return '#805ad5'
  if (status === 'Cleared to Close') return '#208096'
  if (status === 'Title Search') return '#975a16'
  return '#627c71'
}

function formatMoneyUSD(amount: number) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
  } catch {
    return `$${amount.toLocaleString('en-US')}`
  }
}

function parseYmd(dateStr: string) {
  if (!dateStr) return null
  const dt = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(dt.getTime())) return null
  return dt
}

function formatYmd(dateStr: string) {
  const dt = parseYmd(dateStr)
  if (!dt) return dateStr
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function dateBadgeAndColors(dateStr: string) {
  const dt = parseYmd(dateStr)
  if (!dt) return { leftBorder: '#627c71', text: '#627c71', pill: null as null | string }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.floor((dt.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))

  if (diffDays < 0) {
    return { leftBorder: '#cbd5e0', text: '#6b7280', pill: '✓ Passed' }
  }
  if (diffDays <= 3) {
    return { leftBorder: '#f0b429', text: '#b45309', pill: '⚠ Soon' }
  }
  return { leftBorder: '#208096', text: '#134252', pill: null as null | string }
}

type KeyDateItem = { label: string; dateStr: string }

export default function MatterDetailModal({ matter, open, onClose, onArchive }: MatterDetailModalProps) {
  const { documents, staff } = useDemoStore()
  const { matters } = useDemoData()
  const [activeTab, setActiveTab] = useState<
    'Overview' | 'Parties & Contacts' | 'Key Dates' | 'Tasks' | 'Documents' | 'Notes' | 'FinCEN / AML'
  >(
    'Overview'
  )
  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false)

  const effectiveMatter = useMemo(() => {
    if (!matter) return null
    return matters.find((m) => m.id === matter.id) ?? matter
  }, [matter, matters])

  const matterDocuments = useMemo(() => {
    if (!effectiveMatter) return []
    return documents.filter((d) => d.matter_id === effectiveMatter.id)
  }, [documents, effectiveMatter])

  useEffect(() => {
    if (!open) return
    setActiveTab('Overview')
    setIsAddDocumentOpen(false)
  }, [open])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  if (!effectiveMatter) return null

  const status = effectiveMatter.status
  const statusHex = statusColor(status)
  const otherParty = parseOtherPartyInfo(effectiveMatter.specialNotes)

  const keyDateItems: KeyDateItem[] = [
    { label: 'File opened', dateStr: effectiveMatter.fileOpenedDate },
    { label: 'Contract executed', dateStr: effectiveMatter.contractDate },
    { label: 'Inspection deadline', dateStr: effectiveMatter.inspectionDeadline },
    {
      label: 'Financing deadline',
      dateStr: effectiveMatter.financingType === 'Cash' ? '' : effectiveMatter.financingDeadline,
    },
    { label: 'Title commitment', dateStr: effectiveMatter.titleCommitmentDeadline },
    { label: 'Closing date', dateStr: effectiveMatter.key_dates.closing_date },
    { label: 'Possession date', dateStr: effectiveMatter.possessionDate },
  ].filter((i) => Boolean(i.dateStr))

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Matter details"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 60,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'stretch',
        padding: '18px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1024px',
          background: '#fcfcf9',
          borderRadius: '10px',
          border: '1px solid rgba(94,82,64,0.25)',
          boxShadow: '0 18px 40px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 18px',
            borderBottom: '1px solid rgba(94,82,64,0.15)',
            background: '#fcfcf9',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#134252', lineHeight: 1 }}>{effectiveMatter.file_id}</div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                width: 'fit-content',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 900,
                border: `1px solid ${statusHex}33`,
                background: `${statusHex}14`,
                color: statusHex,
              }}
            >
              {effectiveMatter.status}
            </span>
          </div>

          <div style={{ marginLeft: 'auto' }}>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#627c71',
                fontSize: '20px',
                fontWeight: 900,
                lineHeight: 1,
                padding: 6,
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            padding: '12px 18px',
            borderBottom: '1px solid rgba(94,82,64,0.12)',
            background: '#fcfcf9',
          }}
        >
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(
              ['Overview', 'Parties & Contacts', 'Key Dates', 'Tasks', 'Documents', 'Notes', 'FinCEN / AML'] as const
            ).map((tab) => {
              const active = tab === activeTab
              const isFinCENRequired = isFincenEligibleMatter(effectiveMatter)
              const isFinCENReady = (effectiveMatter.fincen?.completedFields ?? 0) >= 111
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  style={{
                    background: active ? '#208096' : 'white',
                    color: active ? 'white' : '#134252',
                    border: active ? 'none' : '1px solid rgba(94,82,64,0.2)',
                    borderRadius: '999px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontWeight: 900,
                    fontSize: '13px',
                  }}
                >
                  {tab}
                  {tab === 'FinCEN / AML' && isFinCENRequired && !isFinCENReady && (
                    <span
                      style={{
                        display: 'inline-block',
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#c0152f',
                        marginLeft: '5px',
                        verticalAlign: 'middle',
                        flexShrink: 0,
                      }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 18px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'Overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#627c71', fontWeight: 800, marginBottom: '4px' }}>Matter type</div>
                  <div style={{ color: '#134252', fontWeight: 900 }}>{effectiveMatter.matter_type}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#627c71', fontWeight: 800, marginBottom: '4px' }}>Transaction type</div>
                  <div style={{ color: '#134252', fontWeight: 900 }}>{effectiveMatter.transactionType}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#627c71', fontWeight: 800, marginBottom: '4px' }}>Property type</div>
                  <div style={{ color: '#134252', fontWeight: 900 }}>{effectiveMatter.property.property_type}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#627c71', fontWeight: 800, marginBottom: '4px' }}>County</div>
                  <div style={{ color: '#134252', fontWeight: 900 }}>{effectiveMatter.property.county}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: '#627c71', fontWeight: 800, marginBottom: '4px' }}>Property address</div>
                <div style={{ color: '#134252', fontWeight: 900 }}>{effectiveMatter.property.address}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#627c71', fontWeight: 800, marginBottom: '4px' }}>Purchase price</div>
                  <div style={{ color: '#134252', fontWeight: 900 }}>{formatMoneyUSD(effectiveMatter.purchasePrice)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#627c71', fontWeight: 800, marginBottom: '4px' }}>Financing type</div>
                  <div style={{ color: '#134252', fontWeight: 900 }}>{effectiveMatter.financingType}</div>
                </div>
              </div>

              {effectiveMatter.financingType !== 'Cash' && (
                <div>
                  <div style={{ fontSize: '12px', color: '#627c71', fontWeight: 800, marginBottom: '4px' }}>Loan number</div>
                  <div style={{ color: '#134252', fontWeight: 900 }}>{effectiveMatter.loanNumber}</div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#627c71', fontWeight: 800, marginBottom: '4px' }}>HOA</div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '6px 10px',
                      borderRadius: '999px',
                      fontWeight: 900,
                      fontSize: '13px',
                      border: effectiveMatter.hoaFlag ? '1px solid rgba(47,133,90,0.35)' : '1px solid rgba(98,124,113,0.25)',
                      background: effectiveMatter.hoaFlag ? '#e8f5f0' : '#f5f5f5',
                      color: effectiveMatter.hoaFlag ? '#2f855a' : '#627c71',
                    }}
                  >
                    {effectiveMatter.hoaFlag ? 'HOA ✓' : 'No HOA'}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#627c71', fontWeight: 800, marginBottom: '4px' }}>Referral source</div>
                  <div style={{ color: '#134252', fontWeight: 900 }}>{effectiveMatter.referralSource}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: '#627c71', fontWeight: 800, marginBottom: '4px' }}>Assigned staff</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 900, color: '#134252' }}>Attorney</div>
                    <div style={{ color: '#134252', fontWeight: 900 }}>{effectiveMatter.assignedAttorney}</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, color: '#134252' }}>Paralegal</div>
                    <div style={{ color: '#134252', fontWeight: 900 }}>{effectiveMatter.assignedParalegal}</div>
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: '#627c71', fontWeight: 800, marginBottom: '4px' }}>File opened</div>
                <div style={{ color: '#134252', fontWeight: 900 }}>{formatYmd(effectiveMatter.fileOpenedDate)}</div>
              </div>

              {effectiveMatter.specialNotes.trim() !== '' && (
                <div
                  style={{
                    background: '#fef3c7',
                    border: '1px solid #f0b429',
                    borderRadius: '8px',
                    padding: '12px',
                    color: '#7c2d12',
                    fontSize: '14px',
                    fontWeight: 700,
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                  }}
                >
                  <span style={{ fontSize: '18px', lineHeight: 1 }}>⚠</span>
                  <div>{effectiveMatter.specialNotes}</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Parties & Contacts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ border: '1px solid rgba(94,82,64,0.12)', borderRadius: '8px', padding: '14px', background: 'white' }}>
                  <div style={{ fontSize: '14px', color: '#627c71', fontWeight: 900, marginBottom: '6px' }}>Buyer</div>
                  <div style={{ fontWeight: 900, fontSize: '18px', color: '#134252', marginBottom: '6px' }}>
                    {displayOrFallback(effectiveMatter.buyer.name, 'No name provided')}
                  </div>
                  <div style={{ color: '#134252', marginBottom: '4px' }}>
                    {effectiveMatter.buyerEmail.trim() ? (
                      <a href={`mailto:${effectiveMatter.buyerEmail}`} style={{ color: '#208096', textDecoration: 'none', fontWeight: 800 }}>
                        {effectiveMatter.buyerEmail}
                      </a>
                    ) : (
                      'No email provided'
                    )}
                  </div>
                  <div style={{ color: '#134252' }}>{displayOrFallback(effectiveMatter.buyerPhone, 'No phone provided')}</div>
                </div>
                <div style={{ border: '1px solid rgba(94,82,64,0.12)', borderRadius: '8px', padding: '14px', background: 'white' }}>
                  <div style={{ fontSize: '14px', color: '#627c71', fontWeight: 900, marginBottom: '6px' }}>Seller</div>
                  <div style={{ fontWeight: 900, fontSize: '18px', color: '#134252', marginBottom: '6px' }}>
                    {displayOrFallback(effectiveMatter.seller.name, 'No name provided')}
                  </div>
                  <div style={{ color: '#134252', marginBottom: '4px' }}>
                    {effectiveMatter.sellerEmail.trim() ? (
                      <a href={`mailto:${effectiveMatter.sellerEmail}`} style={{ color: '#208096', textDecoration: 'none', fontWeight: 800 }}>
                        {effectiveMatter.sellerEmail}
                      </a>
                    ) : (
                      'No email provided'
                    )}
                  </div>
                  <div style={{ color: '#134252' }}>{displayOrFallback(effectiveMatter.sellerPhone, 'No phone provided')}</div>
                </div>
              </div>

              {(otherParty.name || otherParty.title) && (
                <div style={{ border: '1px solid rgba(94,82,64,0.12)', borderRadius: '8px', padding: '14px', background: 'white' }}>
                  <div style={{ fontSize: '14px', color: '#627c71', fontWeight: 900, marginBottom: '6px' }}>
                    {otherParty.title ? `Other: ${otherParty.title}` : 'Other'}
                  </div>
                  <div style={{ fontWeight: 900, fontSize: '18px', color: '#134252', marginBottom: '6px' }}>
                    {displayOrFallback(otherParty.name, 'No name provided')}
                  </div>
                  <div style={{ color: '#134252' }}>Stored from intake/matter setup.</div>
                </div>
              )}

              {effectiveMatter.financingType !== 'Cash' && (
                <div style={{ border: '1px solid rgba(94,82,64,0.12)', borderRadius: '8px', padding: '14px', background: 'white' }}>
                  <div style={{ fontSize: '14px', color: '#627c71', fontWeight: 900, marginBottom: '6px' }}>Lender</div>
                  <div style={{ fontWeight: 900, fontSize: '18px', color: '#134252', marginBottom: '6px' }}>
                    {displayOrFallback(effectiveMatter.lenderName, 'No lender provided')}
                  </div>
                  <div style={{ color: '#134252', marginBottom: '4px' }}>
                    {effectiveMatter.lenderEmail.trim() ? (
                      <a href={`mailto:${effectiveMatter.lenderEmail}`} style={{ color: '#208096', textDecoration: 'none', fontWeight: 800 }}>
                        {effectiveMatter.lenderEmail}
                      </a>
                    ) : (
                      'No email provided'
                    )}
                  </div>
                  <div style={{ color: '#134252', fontWeight: 800 }}>
                    Loan: {displayOrFallback(effectiveMatter.loanNumber, 'No loan number provided')}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ border: '1px solid rgba(94,82,64,0.12)', borderRadius: '8px', padding: '14px', background: 'white' }}>
                  <div style={{ fontSize: '12px', color: '#627c71', fontWeight: 900, marginBottom: '6px' }}>Buyer&apos;s agent</div>
                  <div style={{ color: '#134252', fontWeight: 900 }}>{effectiveMatter.buyerAgent}</div>
                </div>
                <div style={{ border: '1px solid rgba(94,82,64,0.12)', borderRadius: '8px', padding: '14px', background: 'white' }}>
                  <div style={{ fontSize: '12px', color: '#627c71', fontWeight: 900, marginBottom: '6px' }}>Listing agent</div>
                  <div style={{ color: '#134252', fontWeight: 900 }}>{effectiveMatter.listingAgent}</div>
                </div>
              </div>

              <div style={{ border: '1px solid rgba(94,82,64,0.12)', borderRadius: '8px', padding: '14px', background: 'white' }}>
                <div style={{ fontSize: '12px', color: '#627c71', fontWeight: 900, marginBottom: '6px' }}>Assigned staff</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#627c71', fontWeight: 900, marginBottom: '4px' }}>Attorney</div>
                    <div style={{ color: '#134252', fontWeight: 900 }}>{effectiveMatter.assignedAttorney}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#627c71', fontWeight: 900, marginBottom: '4px' }}>Paralegal</div>
                    <div style={{ color: '#134252', fontWeight: 900 }}>{effectiveMatter.assignedParalegal}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Key Dates' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {keyDateItems.map((item) => {
                const badge = dateBadgeAndColors(item.dateStr)
                return (
                  <div
                    key={item.label}
                    style={{
                      border: '1px solid rgba(94,82,64,0.12)',
                      borderRadius: '8px',
                      padding: '12px',
                      background: 'white',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div style={{ width: '4px', borderRadius: '999px', background: badge.leftBorder, flexShrink: 0, height: '100%' }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: badge.text, marginBottom: '6px' }}>{item.label}</div>
                      <div style={{ color: badge.text, fontWeight: 900 }}>{formatYmd(item.dateStr)}</div>
                      {badge.pill && (
                        <span
                          style={{
                            display: 'inline-block',
                            marginTop: '8px',
                            fontSize: '12px',
                            fontWeight: 900,
                            padding: '4px 10px',
                            borderRadius: '999px',
                            border: `1px solid ${badge.leftBorder}55`,
                            background: `${badge.leftBorder}14`,
                            color: badge.text,
                          }}
                        >
                          {badge.pill}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'Tasks' && (
            <div>
              <h3 style={{ marginBottom: '8px', fontSize: '15px' }}>Task checklist</h3>
              <DemoTaskChecklist matterId={effectiveMatter.id} />
            </div>
          )}

          {activeTab === 'Documents' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div style={{ color: '#627c71', fontSize: 13 }}>
                  Demo only - metadata only. No real file is stored.
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddDocumentOpen(true)}
                  style={{
                    background: '#134252',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Add document
                </button>
              </div>
              {matterDocuments.length === 0 ? (
                <div style={{ color: '#627c71' }}>No documents on file for this matter.</div>
              ) : (
                matterDocuments
                  .slice()
                  .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())
                  .map((doc) => {
                    const statusStyle =
                      doc.status === 'final'
                        ? { bg: '#e8f5f0', color: '#2f855a', border: 'rgba(47,133,90,0.35)' }
                        : doc.status === 'reviewed'
                          ? { bg: '#fff4d6', color: '#b45309', border: 'rgba(240,180,41,0.35)' }
                          : { bg: '#f5f5f5', color: '#627c71', border: 'rgba(94,82,64,0.2)' }

                    const uploadedBy = staff.find((s) => s.id === doc.uploaded_by_staff_id)?.full_name ?? 'Staff'
                    return (
                      <div
                        key={doc.id}
                        style={{
                          border: '1px solid rgba(94,82,64,0.12)',
                          borderRadius: '8px',
                          padding: '12px',
                          background: 'white',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 900, color: '#134252', marginBottom: '4px' }}>{doc.name}</div>
                            <div style={{ color: '#627c71', fontWeight: 800, fontSize: '12px', marginBottom: '8px' }}>{doc.category}</div>
                          </div>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '6px 10px',
                              borderRadius: '999px',
                              fontSize: '12px',
                              fontWeight: 900,
                              background: statusStyle.bg,
                              color: statusStyle.color,
                              border: `1px solid ${statusStyle.border}`,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {doc.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', color: '#627c71', fontSize: '12px', fontWeight: 800 }}>
                          <div>Uploaded: {new Date(doc.uploaded_at).toLocaleString()}</div>
                          <div>By: {uploadedBy}</div>
                        </div>
                      </div>
                    )
                  })
              )}
              <UploadDemoDocumentModal
                isOpen={isAddDocumentOpen}
                onClose={() => setIsAddDocumentOpen(false)}
                preferredMatterId={effectiveMatter.id}
              />
            </div>
          )}

          {activeTab === 'Notes' && (
            <div>
              <h3 style={{ marginBottom: '8px', fontSize: '15px' }}>Timeline notes</h3>
              <DemoTimelineNotes matterId={effectiveMatter.id} />
            </div>
          )}

          {activeTab === 'FinCEN / AML' && <DemoFinCENTab matter={effectiveMatter} />}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 18px',
            borderTop: '1px solid rgba(94,82,64,0.15)',
            background: '#fcfcf9',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              onArchive(effectiveMatter.id)
              onClose()
            }}
            style={{
              background: 'white',
              color: '#134252',
              border: '1px solid rgba(94,82,64,0.25)',
              padding: '10px 14px',
              borderRadius: '8px',
              fontWeight: 900,
              cursor: 'pointer',
            }}
          >
            Archive
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#208096',
              color: 'white',
              border: 'none',
              padding: '10px 14px',
              borderRadius: '8px',
              fontWeight: 900,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

