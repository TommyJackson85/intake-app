'use client'

import React, { useEffect, useMemo, useState } from 'react'
import type { DemoNewMatterInitialValues } from '@/lib/demo/demoIntakeFlow'
import type { DemoMatter, DemoPartyType, DemoTransactionRole } from '@/lib/demo/types'
import { useDemoStore } from '@/lib/demo/store'
import { buildEngagementLetterDraftInput } from '@/lib/demo/demoDocument'
import { resolveEngagementLetterPreview } from '@/lib/demo/engagementLetterPreview'

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
  buyerType: 'individual',
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
  const { demoFirm, createDemoMatter, addDemoDocument, staff } = useDemoStore()
  const defaultAttorneyName = useMemo(
    () =>
      staff.find((s) => s.role.toLowerCase().includes('attorney'))?.full_name ??
      staff[0]?.full_name ??
      '',
    [staff]
  )
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
  const [buyerType, setBuyerType] = useState<DemoPartyType>('individual')
  const [activeTab, setActiveTab] = useState<'matter' | 'starter'>('matter')
  const [createEngagementLetterDraft, setCreateEngagementLetterDraft] = useState(true)
  const [engagementClientName, setEngagementClientName] = useState('')
  const [engagementAttorneyName, setEngagementAttorneyName] = useState('')
  const [engagementPropertyAddress, setEngagementPropertyAddress] = useState('')
  const [engagementScopeSummary, setEngagementScopeSummary] = useState('')
  const [engagementFeeSummary, setEngagementFeeSummary] = useState('')
  const [engagementExclusionsSummary, setEngagementExclusionsSummary] = useState('')
  const [engagementCostsSummary, setEngagementCostsSummary] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const isDismissable = useMemo(() => isOpen, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    setSaveError(null)
    setSaving(false)
    setActiveTab('matter')
    setCreateEngagementLetterDraft(true)
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
      setBuyerType(initialValues.buyerType ?? 'individual')
      setEngagementClientName(initialValues.buyerName || '')
      setEngagementAttorneyName(defaultAttorneyName)
      setEngagementPropertyAddress(initialValues.propertyAddress || '')
      setEngagementScopeSummary(
        `Representation for ${initialValues.transactionType || 'Purchase'} closing and related settlement coordination.`
      )
      setEngagementFeeSummary('Flat closing fee per engagement terms; third-party costs billed separately.')
      setEngagementExclusionsSummary(
        'No litigation, tax advice, lender representation, or post-closing disputes unless separately agreed in writing.'
      )
      setEngagementCostsSummary(
        'Recording, title, courier, wire, HOA/estoppel, and other third-party charges remain client responsibility.'
      )
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
    setBuyerType('individual')
    setEngagementClientName('')
    setEngagementAttorneyName(defaultAttorneyName)
    setEngagementPropertyAddress('')
    setEngagementScopeSummary('Representation for purchase closing and related settlement coordination.')
    setEngagementFeeSummary('Flat closing fee per engagement terms; third-party costs billed separately.')
    setEngagementExclusionsSummary(
      'No litigation, tax advice, lender representation, or post-closing disputes unless separately agreed in writing.'
    )
    setEngagementCostsSummary(
      'Recording, title, courier, wire, HOA/estoppel, and other third-party charges remain client responsibility.'
    )
  }, [defaultAttorneyName, isOpen, initialValues])

  useEffect(() => {
    if (!isOpen) return
    if (!engagementClientName.trim() && buyerName.trim()) {
      setEngagementClientName(buyerName)
    }
  }, [buyerName, engagementClientName, isOpen])

  useEffect(() => {
    if (!isOpen) return
    if (!engagementPropertyAddress.trim() && propertyAddress.trim()) {
      setEngagementPropertyAddress(propertyAddress)
    }
  }, [engagementPropertyAddress, isOpen, propertyAddress])

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

  const engagementPreview = resolveEngagementLetterPreview({
    dateLabel: closingDate || new Date().toISOString().slice(0, 10),
    matterType,
    defaults: {
      clientName: buyerName || 'Client Name',
      attorneyName: defaultAttorneyName || 'Assigned attorney',
      fileReference: nextFileId,
      propertyAddress: propertyAddress || 'Property address pending',
    },
    fields: {
      clientName: engagementClientName,
      attorneyName: engagementAttorneyName,
      fileReference: nextFileId,
      propertyAddress: engagementPropertyAddress,
      scopeSummary: engagementScopeSummary,
      feeSummary: engagementFeeSummary,
      exclusionsSummary: engagementExclusionsSummary,
      costsSummary: engagementCostsSummary,
    },
  })

  const handleCreateMatter = () => {
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
        buyer_type: buyerType,
        buyer_email: buyerEmail,
        buyer_phone: buyerPhone,
        special_notes,
        onCreated: (info) => {
          if (createEngagementLetterDraft) {
            const uploadedByStaffId = staff[0]?.id ?? ''
            const draftInput = buildEngagementLetterDraftInput({
              matter_id: info.matterId,
              uploaded_by_staff_id: uploadedByStaffId,
              namePrefix: info.fileId,
              document_date: closingDate.trim(),
              source: 'Matter setup (demo)',
              clientName: engagementClientName || buyerName,
              attorneyName: engagementAttorneyName || defaultAttorneyName,
              fileReference: info.fileId,
              propertyAddress: engagementPropertyAddress || propertyAddress,
              scopeSummary: engagementScopeSummary,
              feeSummary: engagementFeeSummary,
              exclusionsSummary: engagementExclusionsSummary,
              costsSummary: engagementCostsSummary,
            })
            if (draftInput) addDemoDocument(draftInput)
          }
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
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Create matter (demo)"
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
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(94,82,64,0.15)', display: 'flex', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#134252', marginBottom: '2px' }}>Create matter</div>
            <div style={{ color: '#627c71', fontSize: '13px' }}>
              Demo only — creates a local in-memory matter record.
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


        <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1 }}>
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
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <button
              type="button"
              onClick={() => setActiveTab('matter')}
              style={{
                padding: '8px 12px',
                borderRadius: 999,
                border: activeTab === 'matter' ? 'none' : '1px solid rgba(94,82,64,0.25)',
                background: activeTab === 'matter' ? '#208096' : '#fff',
                color: activeTab === 'matter' ? '#fff' : '#134252',
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Matter details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('starter')}
              style={{
                padding: '8px 12px',
                borderRadius: 999,
                border: activeTab === 'starter' ? 'none' : '1px solid rgba(94,82,64,0.25)',
                background: activeTab === 'starter' ? '#208096' : '#fff',
                color: activeTab === 'starter' ? '#fff' : '#134252',
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Starter documents
            </button>
          </div>

          {activeTab === 'matter' ? (
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
              <label style={{ fontSize: '12px', color: '#627c71', fontWeight: 700 }}>Buyer type</label>
              <select
                value={buyerType}
                onChange={(e) => setBuyerType(e.target.value as DemoPartyType)}
                style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(94,82,64,0.22)' }}
              >
                <option value="individual">Individual</option>
                <option value="entity">Legal entity / trust</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#627c71', fontWeight: 700 }}>Buyer name</label>
              <input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(94,82,64,0.22)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#627c71', fontWeight: 700 }}>
                Buyer email <span style={{ fontWeight: 500 }}>(optional)</span>
              </label>
              <input
                type="email"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(94,82,64,0.22)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#627c71', fontWeight: 700 }}>
                Buyer phone <span style={{ fontWeight: 500 }}>(optional)</span>
              </label>
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
              <label style={{ fontSize: '12px', color: '#627c71', fontWeight: 700 }}>
                Notes (from intake / internal) <span style={{ fontWeight: 500 }}>(optional)</span>
              </label>
              <textarea
                value={intakeNotes}
                onChange={(e) => setIntakeNotes(e.target.value)}
                rows={3}
                style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(94,82,64,0.22)', resize: 'vertical' }}
              />
            </div>

            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(94,82,64,0.2)',
                  background: '#fff',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={createEngagementLetterDraft}
                  onChange={(e) => setCreateEngagementLetterDraft(e.target.checked)}
                  style={{ marginTop: 2 }}
                />
                <span style={{ fontSize: 13, color: '#134252', fontWeight: 700 }}>
                  Create engagement letter draft
                  <span style={{ display: 'block', marginTop: 2, fontWeight: 500, color: '#627c71' }}>
                    Demo only — metadata only. No real file generated.
                  </span>
                </span>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, opacity: createEngagementLetterDraft ? 1 : 0.65 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#627c71', fontWeight: 700, gridColumn: '1 / -1' }}>
                  File reference (from matter)
                  <input
                    value={nextFileId}
                    readOnly
                    disabled
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 6, border: '1px solid rgba(94,82,64,0.22)', background: '#f4f4f0', color: '#134252' }}
                  />
                </label>
                <label style={{ display: 'block', fontSize: 12, color: '#627c71', fontWeight: 700 }}>
                  Client / buyer name
                  <input
                    value={engagementClientName}
                    onChange={(e) => setEngagementClientName(e.target.value)}
                    disabled={!createEngagementLetterDraft}
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 6, border: '1px solid rgba(94,82,64,0.22)' }}
                  />
                </label>
                <label style={{ display: 'block', fontSize: 12, color: '#627c71', fontWeight: 700 }}>
                  Attorney
                  <input
                    value={engagementAttorneyName}
                    onChange={(e) => setEngagementAttorneyName(e.target.value)}
                    disabled={!createEngagementLetterDraft}
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 6, border: '1px solid rgba(94,82,64,0.22)' }}
                  />
                </label>
                <label style={{ display: 'block', fontSize: 12, color: '#627c71', fontWeight: 700, gridColumn: '1 / -1' }}>
                  Property address
                  <input
                    value={engagementPropertyAddress}
                    onChange={(e) => setEngagementPropertyAddress(e.target.value)}
                    disabled={!createEngagementLetterDraft}
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 6, border: '1px solid rgba(94,82,64,0.22)' }}
                  />
                </label>
                <label style={{ display: 'block', fontSize: 12, color: '#627c71', fontWeight: 700, gridColumn: '1 / -1' }}>
                  Scope summary
                  <textarea
                    value={engagementScopeSummary}
                    onChange={(e) => setEngagementScopeSummary(e.target.value)}
                    disabled={!createEngagementLetterDraft}
                    rows={2}
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 6, border: '1px solid rgba(94,82,64,0.22)', resize: 'vertical' }}
                  />
                </label>
                <label style={{ display: 'block', fontSize: 12, color: '#627c71', fontWeight: 700, gridColumn: '1 / -1' }}>
                  Fee / representation summary
                  <textarea
                    value={engagementFeeSummary}
                    onChange={(e) => setEngagementFeeSummary(e.target.value)}
                    disabled={!createEngagementLetterDraft}
                    rows={2}
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 6, border: '1px solid rgba(94,82,64,0.22)', resize: 'vertical' }}
                  />
                </label>
                <label style={{ display: 'block', fontSize: 12, color: '#627c71', fontWeight: 700, gridColumn: '1 / -1' }}>
                  Exclusions summary
                  <textarea
                    value={engagementExclusionsSummary}
                    onChange={(e) => setEngagementExclusionsSummary(e.target.value)}
                    disabled={!createEngagementLetterDraft}
                    rows={2}
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 6, border: '1px solid rgba(94,82,64,0.22)', resize: 'vertical' }}
                  />
                </label>
                <label style={{ display: 'block', fontSize: 12, color: '#627c71', fontWeight: 700, gridColumn: '1 / -1' }}>
                  Costs / third-party expenses summary
                  <textarea
                    value={engagementCostsSummary}
                    onChange={(e) => setEngagementCostsSummary(e.target.value)}
                    disabled={!createEngagementLetterDraft}
                    rows={2}
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 6, border: '1px solid rgba(94,82,64,0.22)', resize: 'vertical' }}
                  />
                </label>
              </div>

              <div style={{ border: '1px solid rgba(94,82,64,0.2)', borderRadius: 8, background: '#fff', padding: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#134252', marginBottom: 6 }}>
                  Engagement letter draft preview (demo template)
                </div>
                <div style={{ fontSize: 12, color: '#627c71', marginBottom: 8 }}>
                  This preview shows how the metadata-only draft will be saved.
                </div>
                <div
                  style={{
                    border: '1px solid rgba(17,24,39,0.18)',
                    borderRadius: 4,
                    padding: '14px 12px',
                    background: '#fcfcff',
                    fontSize: 12,
                    color: '#134252',
                    lineHeight: 1.6,
                    maxHeight: 320,
                    overflowY: 'auto',
                  }}
                >
                  <div style={{ fontWeight: 800 }}>{demoFirm.name}</div>
                  <div style={{ color: '#627c71' }}>{demoFirm.office_location}</div>
                  <div style={{ color: '#627c71', marginBottom: 10 }}>{demoFirm.email}</div>
                  <div style={{ marginBottom: 8 }}>
                    Date: {engagementPreview.dateLabel}
                  </div>
                  <div>Via email</div>
                  <div style={{ marginBottom: 8 }}>
                    {engagementPreview.clientName}
                  </div>
                  <div>
                    Re: Engagement for {engagementPreview.matterType} - File {engagementPreview.fileReference}
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    Property: {engagementPreview.propertyAddress}
                  </div>
                  <p style={{ margin: '0 0 10px' }}>
                    Dear {engagementPreview.clientName},
                  </p>
                  <p style={{ margin: '0 0 10px' }}>
                    Thank you for selecting {demoFirm.name} to represent you in connection with the above-referenced
                    Florida real estate transaction. This draft engagement letter outlines our representation for your
                    review before any final execution.
                  </p>
                  <p style={{ margin: '0 0 10px' }}>
                    <strong>Scope of representation.</strong> {engagementPreview.scopeSummary}
                  </p>
                  <p style={{ margin: '0 0 10px' }}>
                    <strong>Exclusions.</strong> {engagementPreview.exclusionsSummary}
                  </p>
                  <p style={{ margin: '0 0 10px' }}>
                    <strong>Fee arrangement.</strong> {engagementPreview.feeSummary}
                  </p>
                  <p style={{ margin: '0 0 10px' }}>
                    <strong>Costs and third-party charges.</strong> {engagementPreview.costsSummary}
                  </p>
                  <p style={{ margin: '0 0 10px' }}>
                    If these terms are acceptable, please sign below to acknowledge this draft engagement structure.
                  </p>
                  <div style={{ marginTop: 10 }}>
                    Acknowledged and agreed:
                    <div style={{ marginTop: 14 }}>______________________________</div>
                    <div style={{ color: '#627c71' }}>Client signature (demo placeholder)</div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    Sincerely,
                    <div style={{ marginTop: 8 }}>{engagementPreview.attorneyName}</div>
                    <div style={{ color: '#627c71' }}>{demoFirm.name}</div>
                  </div>
                  <div style={{ marginTop: 10, color: '#627c71' }}>
                    Demo template preview only; not an executed legal document.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0', padding: '14px 20px', borderTop: '1px solid rgba(94,82,64,0.15)', background: '#fcfcf9' }}>
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
            onClick={handleCreateMatter}
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
  )
}
