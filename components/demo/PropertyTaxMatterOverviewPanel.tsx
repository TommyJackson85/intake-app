'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import type { DemoDocumentRequest, DemoMatter } from '@/lib/demo/types'
import {
  buildPropertyTaxMatterOverviewModel,
  shouldShowPropertyTaxMatterOverviewPanel,
} from '@/lib/demo/propertyTaxIssue'
import {
  PROPERTY_TAX_SUGGESTED_DOCS_SAFE_COPY,
  annotatePropertyTaxDocumentRequestPresets,
  getPropertyTaxPresetKindLabels,
  selectPropertyTaxDocumentRequestsToCreate,
  shouldShowPropertyTaxSuggestedDocuments,
  type DemoPropertyTaxDocumentRequestPresetRow,
} from '@/lib/demo/staffPropertyTaxDocumentRequestPresets'
import type { AddDemoDocumentRequestInput } from '@/lib/demo/demoDocumentRequest'

type Props = {
  matter: DemoMatter
  documentRequests?: DemoDocumentRequest[]
  staffId?: string
  onCreateDocumentRequests?: (inputs: AddDemoDocumentRequestInput[]) => void
  onGoToDocuments?: () => void
}

/**
 * Compact Matter Overview panel for Florida property-tax / tax-deed intake facts,
 * plus staff-controlled suggested document-request presets.
 */
export default function PropertyTaxMatterOverviewPanel({
  matter,
  documentRequests = [],
  staffId = '',
  onCreateDocumentRequests,
  onGoToDocuments,
}: Props) {
  if (
    !shouldShowPropertyTaxMatterOverviewPanel({
      propertyAddress: matter.property.address,
      propertyTaxIssue: matter.propertyTaxIssue,
    })
  ) {
    return null
  }

  const model = buildPropertyTaxMatterOverviewModel(matter.propertyTaxIssue)
  const showSuggested = shouldShowPropertyTaxSuggestedDocuments({
    propertyAddress: matter.property.address,
    propertyTaxIssue: matter.propertyTaxIssue,
  })

  return (
    <section
      id="matter-property-tax-overview"
      data-testid="matter-property-tax-overview"
      aria-labelledby="matter-property-tax-overview-title"
      style={{
        border: '1px solid rgba(94,82,64,0.12)',
        borderRadius: 8,
        padding: 12,
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h3
            id="matter-property-tax-overview-title"
            style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#134252' }}
          >
            {model.title}
          </h3>
          {(model.floridaCounty || model.parcelOrFolio) && (
            <div style={{ marginTop: 4, fontSize: 11, color: '#627c71' }}>
              {model.floridaCounty ? <span>County: {model.floridaCounty}</span> : null}
              {model.floridaCounty && model.parcelOrFolio ? <span> · </span> : null}
              {model.parcelOrFolio ? <span>Parcel/folio: {model.parcelOrFolio}</span> : null}
            </div>
          )}
        </div>
        <span
          style={{
            display: 'inline-block',
            padding: '5px 10px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 900,
            background: model.overallStatusPresentation.bg,
            color: model.overallStatusPresentation.color,
            border: `1px solid ${model.overallStatusPresentation.border}`,
            whiteSpace: 'nowrap',
          }}
        >
          {model.overallStatusPresentation.label}
        </span>
      </div>

      {model.involvementBanner ? (
        <p style={{ margin: 0, fontSize: 12, color: '#8a6d1d', lineHeight: 1.4 }}>
          {model.involvementBanner}
        </p>
      ) : null}

      {model.kinds.length === 0 && model.involvementUnknown ? (
        <p style={{ margin: 0, fontSize: 12, color: '#627c71', lineHeight: 1.45 }}>
          No issue kind selected yet. Capture available documents and route for attorney review when
          more facts are known.
        </p>
      ) : null}

      {model.kinds.map((row) => (
        <div
          key={row.kind}
          data-testid={`matter-property-tax-kind-${row.kind}`}
          style={{
            border: '1px solid rgba(94,82,64,0.12)',
            borderRadius: 8,
            padding: 10,
            background: '#fafaf7',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, color: '#134252' }}>{row.label}</div>
            <span
              style={{
                display: 'inline-block',
                padding: '4px 8px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 800,
                background: row.statusPresentation.bg,
                color: row.statusPresentation.color,
                border: `1px solid ${row.statusPresentation.border}`,
                whiteSpace: 'nowrap',
              }}
            >
              {row.statusPresentation.label}
            </span>
          </div>

          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: '#627c71', lineHeight: 1.45 }}>
            {row.summaryLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>

          {row.relevantDate ? (
            <div style={{ fontSize: 11, color: '#134252', lineHeight: 1.45 }}>
              <strong>{row.relevantDate.label}:</strong> {row.relevantDate.dated.date}
              {row.dateVerificationLabel ? (
                <span style={{ color: '#627c71' }}> · {row.dateVerificationLabel}</span>
              ) : null}
              {row.statedDeadlineBanner ? (
                <div style={{ marginTop: 4, color: '#627c71' }}>{row.statedDeadlineBanner}</div>
              ) : null}
            </div>
          ) : null}

          <div style={{ fontSize: 11, color: '#627c71', lineHeight: 1.45 }}>
            <strong style={{ color: '#134252' }}>Next:</strong> {row.nextStep}
          </div>

          <div>
            <a
              href="#matter-property-tax-overview"
              aria-label={`Review intake details for ${row.label}`}
              style={{
                display: 'inline-block',
                background: 'white',
                border: '1px solid rgba(94,82,64,0.25)',
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: 11,
                fontWeight: 800,
                color: '#134252',
                textDecoration: 'none',
              }}
            >
              Review intake details
            </a>
          </div>
        </div>
      ))}

      {showSuggested ? (
        <SuggestedPropertyTaxDocuments
          matter={matter}
          documentRequests={documentRequests}
          staffId={staffId}
          onCreateDocumentRequests={onCreateDocumentRequests}
          onGoToDocuments={onGoToDocuments}
        />
      ) : null}

      <p style={{ margin: 0, fontSize: 11, color: '#627c71', lineHeight: 1.45 }}>{model.disclaimer}</p>
    </section>
  )
}

function SuggestedPropertyTaxDocuments({
  matter,
  documentRequests,
  staffId,
  onCreateDocumentRequests,
  onGoToDocuments,
}: {
  matter: DemoMatter
  documentRequests: DemoDocumentRequest[]
  staffId: string
  onCreateDocumentRequests?: (inputs: AddDemoDocumentRequestInput[]) => void
  onGoToDocuments?: () => void
}) {
  const rows = useMemo(
    () =>
      annotatePropertyTaxDocumentRequestPresets({
        issue: matter.propertyTaxIssue,
        matterId: matter.id,
        documentRequests,
      }),
    [matter.propertyTaxIssue, matter.id, documentRequests],
  )

  const [reviewOpen, setReviewOpen] = useState(false)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [titleEdits, setTitleEdits] = useState<Record<string, string>>({})
  const [createdTitles, setCreatedTitles] = useState<string[]>([])
  const [createError, setCreateError] = useState<string | null>(null)
  const presetIdsKey = rows.map((r) => r.id).join('|')

  useEffect(() => {
    const nextSelected: Record<string, boolean> = {}
    const nextTitles: Record<string, string> = {}
    for (const row of rows) {
      nextSelected[row.id] = row.defaultSelected && !row.alreadyRequested
      nextTitles[row.id] = row.title
    }
    setSelected(nextSelected)
    setTitleEdits(nextTitles)
    setCreateError(null)
    // Do not clear createdTitles here — request creation updates documentRequests and would wipe success.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed by preset id set only
  }, [presetIdsKey])

  // Keep already-requested rows deselected when open requests appear after create.
  useEffect(() => {
    setSelected((prev) => {
      let changed = false
      const next = { ...prev }
      for (const row of rows) {
        if (row.alreadyRequested && next[row.id]) {
          next[row.id] = false
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [rows])

  const selectedCount = rows.filter((r) => selected[r.id] && !r.alreadyRequested).length
  const canCreate = Boolean(staffId && onCreateDocumentRequests && selectedCount > 0)

  const createSelected = () => {
    setCreateError(null)
    if (!onCreateDocumentRequests || !staffId) {
      setCreateError('Staff create action is unavailable.')
      return
    }
    const selectedIds = rows.filter((r) => selected[r.id] && !r.alreadyRequested).map((r) => r.id)
    const payloads = selectPropertyTaxDocumentRequestsToCreate({
      matter,
      staffId,
      documentRequests,
      selectedPresetIds: selectedIds,
      titleOverrides: titleEdits,
    })
    if (payloads.length === 0) {
      setCreateError('No new requests to create. Deselect already-requested items or select suggestions.')
      return
    }
    onCreateDocumentRequests(payloads)
    setCreatedTitles(payloads.map((p) => p.title))
    setReviewOpen(false)
  }

  return (
    <div
      data-testid="matter-property-tax-suggested-docs"
      style={{
        border: '1px solid rgba(94,82,64,0.14)',
        borderRadius: 8,
        padding: 10,
        background: '#fafaf7',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 900, color: '#134252' }}>
        Suggested Property-Tax &amp; Tax-Deed Documents
      </div>
      <p style={{ margin: 0, fontSize: 11, color: '#627c71', lineHeight: 1.45 }}>
        {PROPERTY_TAX_SUGGESTED_DOCS_SAFE_COPY}
      </p>

      {!reviewOpen ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            data-testid="ptx-review-suggested-docs"
            onClick={() => setReviewOpen(true)}
            style={secondaryBtnStyle}
          >
            Review suggested document requests
          </button>
          <span style={{ fontSize: 11, color: '#627c71' }}>
            {rows.length} suggested · {rows.filter((r) => r.alreadyRequested).length} already requested
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map((row) => (
            <PresetRow
              key={row.id}
              row={row}
              checked={Boolean(selected[row.id])}
              title={titleEdits[row.id] ?? row.title}
              onCheckedChange={(checked) =>
                setSelected((prev) => ({ ...prev, [row.id]: checked }))
              }
              onTitleChange={(title) => setTitleEdits((prev) => ({ ...prev, [row.id]: title }))}
            />
          ))}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              data-testid="ptx-create-selected-docs"
              disabled={!canCreate}
              onClick={createSelected}
              style={{
                ...primaryBtnStyle,
                opacity: canCreate ? 1 : 0.55,
                cursor: canCreate ? 'pointer' : 'not-allowed',
              }}
            >
              Create selected requests
            </button>
            <button type="button" onClick={() => setReviewOpen(false)} style={secondaryBtnStyle}>
              Cancel
            </button>
            <span style={{ fontSize: 11, color: '#627c71' }}>{selectedCount} selected</span>
          </div>
          {createError ? (
            <p role="alert" style={{ margin: 0, fontSize: 11, color: '#842029', fontWeight: 700 }}>
              {createError}
            </p>
          ) : null}
        </div>
      )}

      {createdTitles.length > 0 ? (
        <div
          data-testid="ptx-created-docs-success"
          style={{
            border: '1px solid rgba(32,128,150,0.3)',
            background: '#e8f5f0',
            borderRadius: 6,
            padding: 8,
            fontSize: 11,
            color: '#134252',
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 4 }}>
            Created {createdTitles.length} document request{createdTitles.length === 1 ? '' : 's'}
          </div>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {createdTitles.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          {onGoToDocuments ? (
            <button
              type="button"
              onClick={onGoToDocuments}
              style={{ ...secondaryBtnStyle, marginTop: 8 }}
            >
              View in Documents
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function PresetRow({
  row,
  checked,
  title,
  onCheckedChange,
  onTitleChange,
}: {
  row: DemoPropertyTaxDocumentRequestPresetRow
  checked: boolean
  title: string
  onCheckedChange: (checked: boolean) => void
  onTitleChange: (title: string) => void
}) {
  const disabled = row.alreadyRequested
  return (
    <div
      data-testid={`ptx-preset-${row.id}`}
      style={{
        border: '1px solid rgba(94,82,64,0.12)',
        borderRadius: 6,
        padding: 8,
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        opacity: disabled ? 0.75 : 1,
      }}
    >
      <label
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          fontSize: 12,
          color: '#134252',
          fontWeight: 700,
          cursor: disabled ? 'default' : 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={disabled ? false : checked}
          disabled={disabled}
          onChange={(e) => onCheckedChange(e.target.checked)}
        />
        <span style={{ flex: 1, minWidth: 0 }}>
          {row.alreadyRequested ? (
            <span style={{ color: '#627c71' }}>Already requested — </span>
          ) : null}
          {row.title}
        </span>
      </label>
      <div style={{ fontSize: 11, color: '#627c71', paddingLeft: 24, lineHeight: 1.4 }}>
        <div>{getPropertyTaxPresetKindLabels(row.associatedKinds)}</div>
        {row.reason ? <div>{row.reason}</div> : null}
        <div style={{ marginTop: 2 }}>{row.description}</div>
      </div>
      {!disabled ? (
        <div style={{ paddingLeft: 24 }}>
          <label htmlFor={`ptx-title-${row.id}`} style={{ fontSize: 11, color: '#627c71', fontWeight: 800 }}>
            Request title (editable)
          </label>
          <input
            id={`ptx-title-${row.id}`}
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            style={{
              width: '100%',
              marginTop: 4,
              padding: '6px 8px',
              borderRadius: 6,
              border: '1px solid rgba(94,82,64,0.22)',
              fontSize: 12,
              color: '#134252',
            }}
          />
        </div>
      ) : null}
    </div>
  )
}

const secondaryBtnStyle: CSSProperties = {
  background: 'white',
  border: '1px solid rgba(94,82,64,0.25)',
  borderRadius: 6,
  padding: '6px 10px',
  fontSize: 11,
  fontWeight: 800,
  color: '#134252',
  cursor: 'pointer',
}

const primaryBtnStyle: CSSProperties = {
  background: '#208096',
  border: 'none',
  borderRadius: 6,
  padding: '6px 10px',
  fontSize: 11,
  fontWeight: 800,
  color: 'white',
  cursor: 'pointer',
}
