'use client'

import React, { useEffect, useMemo, useState } from 'react'
import type { DemoNewMatterInitialValues } from '@/lib/demo/demoIntakeFlow'
import type { DemoMatter, DemoTransactionRole } from '@/lib/demo/types'
import { useDemoStore } from '@/lib/demo/store'

export function getNextDemoFileId(existingFileIds: string[]) {
  const parsed = existingFileIds
    .map((fileId) => {
      const m = fileId.match(/^FL-(\d{4})-(\d+)$/)
      if (!m) return null
      return { year: Number(m[1]), num: Number(m[2]) }
    })
    .filter((v): v is { year: number; num: number } => Boolean(v))

  if (parsed.length === 0) return 'FL-2026-001'

  const maxYear = Math.max(...parsed.map((p) => p.year))
  const numsInMaxYear = parsed.filter((p) => p.year === maxYear).map((p) => p.num)
  const maxNum = Math.max(...numsInMaxYear)

  return `FL-${maxYear}-${String(maxNum + 1).padStart(3, '0')}`
}

const EMPTY_FORM: DemoNewMatterInitialValues = {
  matterType: 'Financed Residential Purchase',
  propertyAddress: '',
  propertyType: 'Single-Family Home',
  county: '',
  closingDate: '',
  buyerName: '',
  sellerName: '',
  transactionType: 'Purchase',
  purchasePrice: 0,
  buyerEmail: '',
  buyerPhone: '',
  intakeNotes: '',
  transactionRole: undefined,
  partyRoleOther: '',
  contactName: '',
}

type NewMatterModalProps = {
  isOpen: boolean
  onClose: () => void
  nextFileId: string
  onCreateDemo: () => void
  /** When opening from an intake lead — prefill matter fields (lawyer can edit before save) */
  initialValues?: DemoNewMatterInitialValues | null
  /** Fires after the matter is created (demo), before onCreateDemo */
  onMatterCreated?: (info: { matterId: string; fileId: string }) => void
}

export default function NewMatterModal({
  isOpen,
  onClose,
  nextFileId,
  onCreateDemo,
  initialValues = null,
  onMatterCreated,
}: NewMatterModalProps) {
  const { createDemoMatter } = useDemoStore()
  const [matterType, setMatterType] = useState(EMPTY_FORM.matterType)
  const [propertyAddress, setPropertyAddress] = useState('')
  const [propertyType, setPropertyType] = useState(EMPTY_FORM.propertyType)
  const [county, setCounty] = useState('')
  const [closingDate, setClosingDate] = useState('')
  const [buyerName, setBuyerName] = useState('')
  const [sellerName, setSellerName] = useState('')
  const [transactionType, setTransactionType] = useState(EMPTY_FORM.transactionType)
  const [purchasePrice, setPurchasePrice] = useState(0)
  const [buyerEmail, setBuyerEmail] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [intakeNotes, setIntakeNotes] = useState('')
  const [intakeTransactionRole, setIntakeTransactionRole] = useState<DemoTransactionRole | null>(null)
  const [otherTitleRole, setOtherTitleRole] = useState('')
  const [titleName, setTitleName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const isDismissable = useMemo(() => isOpen, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    setSaveError(null)
    setSaving(false)
    if (initialValues) {
      setMatterType(initialValues.matterType)
      setPropertyAddress(initialValues.propertyAddress)
      setPropertyType(initialValues.propertyType)
      setCounty(initialValues.county)
      setClosingDate(initialValues.closingDate)
      setBuyerName(initialValues.buyerName)
      setSellerName(initialValues.sellerName)
      setTransactionType(initialValues.transactionType)
      setPurchasePrice(initialValues.purchasePrice)
      setBuyerEmail(initialValues.buyerEmail)
      setBuyerPhone(initialValues.buyerPhone)
      setIntakeNotes(initialValues.intakeNotes)
      const role = initialValues.transactionRole ?? null
      setIntakeTransactionRole(role)
      setOtherTitleRole(role === 'other' ? (initialValues.partyRoleOther ?? '') : '')
      setTitleName(role === 'other' ? (initialValues.contactName ?? '') : '')
      return
    }
    setMatterType(EMPTY_FORM.matterType)
    setPropertyAddress('')
    setPropertyType(EMPTY_FORM.propertyType)
    setCounty('')
    setClosingDate('')
    setBuyerName('')
    setSellerName('')
    setTransactionType(EMPTY_FORM.transactionType)
    setPurchasePrice(0)
    setBuyerEmail('')
    setBuyerPhone('')
    setIntakeNotes('')
    setIntakeTransactionRole(null)
    setOtherTitleRole('')
    setTitleName('')
  }, [isOpen, initialValues])

  useEffect(() => {
    if (!isDismissable) return

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
  }, [isDismissable, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label=" (Demo)"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '18px',
        zIndex: 50,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '880px',
          background: '#fcfcf9',
          borderRadius: '10px',
          border: '1px solid rgba(94,82,64,0.25)',
          boxShadow: '0 18px 40px rgba(0,0,0,0.25)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(94,82,64,0.15)', display: 'flex', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#134252', marginBottom: '2px' }}></div>
            <div style={{ color: '#627c71', fontSize: '13px' }}>
              Demo mode: creates a local in-memory matter
              {initialValues ? ' — fields prefilled from intake (edit as needed).' : ''}
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#627c71',
                fontSize: '18px',
                fontWeight: 900,
                padding: 0,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        </div>

        <div style={{ padding: '18px 20px' }}>
          {saveError && (
            <div
              role="alert"
              style={{
                marginBottom: 14,
                padding: '10px 12px',
                borderRadius: 8,
                background: '#fee',
                border: '1px solid #f5c2c7',
                color: '#842029',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {saveError}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#627c71', fontWeight: 700 }}>File reference</label>
              <input
                value={nextFileId}
                readOnly
                disabled
                style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(94,82,64,0.22)' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#627c71', fontWeight: 700 }}>Matter type</label>
              <select value={matterType} onChange={(e) => setMatterType(e.target.value)} style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(94,82,64,0.22)' }}>
                <option>Financed Residential Purchase</option>
                <option>Cash Residential Purchase</option>
                <option>Residential Purchase - New File</option>
                <option>Refinance</option>
                <option>Commercial Purchase</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '12px', color: '#627c71', fontWeight: 700 }}>Property address</label>
              <input
                value={propertyAddress}
                onChange={(e) => setPropertyAddress(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(94,82,64,0.22)' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#627c71', fontWeight: 700 }}>Property type</label>
              <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(94,82,64,0.22)' }}>
                <option>Single-Family Home</option>
                <option>Condo</option>
                <option>Townhouse</option>
                <option>Commercial</option>
                <option>Land</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#627c71', fontWeight: 700 }}>County</label>
              <input value={county} onChange={(e) => setCounty(e.target.value)} style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(94,82,64,0.22)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#627c71', fontWeight: 700 }}>Closing date</label>
              <input
                type="date"
                value={closingDate}
                onChange={(e) => setClosingDate(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(94,82,64,0.22)' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#627c71', fontWeight: 700 }}>Purchase price (demo)</label>
              <input
                type="number"
                min={0}
                value={purchasePrice || ''}
                onChange={(e) => setPurchasePrice(Number(e.target.value) || 0)}
                style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(94,82,64,0.22)' }}
              />
            </div>

            {intakeTransactionRole === 'other' && (
              <div
                style={{
                  gridColumn: '1 / -1',
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(32,128,150,0.25)',
                  background: '#f0f8f7',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 900, color: '#134252' }}>Intake: role &ldquo;Other&rdquo;</div>
                <p style={{ margin: 0, fontSize: '12px', color: '#627c71', lineHeight: 1.45 }}>
                  This lead did not map the contact to buyer or seller. The title role and title name are prefilled from intake and kept separate
                  from buyer/seller.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: '#627c71', fontWeight: 700 }}>Other Title</label>
                  <input
                    value={otherTitleRole}
                    onChange={(e) => setOtherTitleRole(e.target.value)}
                    placeholder="e.g. lender representative, POA, estate executor"
                    style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(94,82,64,0.22)' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: '#627c71', fontWeight: 700 }}>Title&apos;s Name</label>
                  <input
                    value={titleName}
                    onChange={(e) => setTitleName(e.target.value)}
                    placeholder="Name from intake"
                    style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(94,82,64,0.22)' }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#627c71', fontWeight: 700 }}>Buyer name</label>
              <input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(94,82,64,0.22)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#627c71', fontWeight: 700 }}>Buyer email</label>
              <input
                type="email"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(94,82,64,0.22)' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#627c71', fontWeight: 700 }}>Buyer phone</label>
              <input
                type="tel"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(94,82,64,0.22)' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#627c71', fontWeight: 700 }}>Seller name</label>
              <input value={sellerName} onChange={(e) => setSellerName(e.target.value)} style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(94,82,64,0.22)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#627c71', fontWeight: 700 }}>Transaction type</label>
              <select
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(94,82,64,0.22)' }}
              >
                <option>Purchase</option>
                <option>Sale</option>
                <option>Refinance</option>
                <option>Both</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '12px', color: '#627c71', fontWeight: 700 }}>Notes (from intake / internal)</label>
              <textarea
                value={intakeNotes}
                onChange={(e) => setIntakeNotes(e.target.value)}
                rows={3}
                style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(94,82,64,0.22)', resize: 'vertical' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                background: 'white',
                color: '#134252',
                border: '1px solid rgba(94,82,64,0.25)',
                padding: '10px 14px',
                borderRadius: '8px',
                fontWeight: 800,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setSaveError(null)
                setSaving(true)
                try {
                  const otherBlock =
                    intakeTransactionRole === 'other'
                      ? [
                          otherTitleRole.trim() ? `Other Title: ${otherTitleRole.trim()}.` : '',
                          titleName.trim() ? `Title's Name: ${titleName.trim()}.` : '',
                        ]
                          .filter(Boolean)
                          .join(' ')
                      : ''
                  const special_notes = [otherBlock, intakeNotes.trim()].filter(Boolean).join('\n\n')

                  createDemoMatter({
                    file_id: nextFileId,
                    matter_type: matterType,
                    transactionType,
                    purchasePrice,
                    property_address: propertyAddress,
                    property_type: propertyType as DemoMatter['property']['property_type'],
                    county,
                    closing_date: closingDate,
                    buyer_name: buyerName,
                    seller_name: sellerName,
                    buyer_email: buyerEmail,
                    buyer_phone: buyerPhone,
                    special_notes,
                    onCreated: (info) => {
                      onMatterCreated?.(info)
                    },
                  })
                  onCreateDemo()
                  onClose()
                } catch (e) {
                  setSaveError(e instanceof Error ? e.message : 'Could not create matter.')
                } finally {
                  setSaving(false)
                }
              }}
              style={{
                background: '#208096',
                color: 'white',
                border: 'none',
                padding: '10px 14px',
                borderRadius: '8px',
                fontWeight: 900,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.75 : 1,
              }}
            >
              {saving ? 'Saving…' : 'Create Matter (Demo)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
