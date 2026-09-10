'use client'

import type { CSSProperties, ReactNode } from 'react'
import type {
  DemoPropertyTaxAssessmentReportedIssueType,
  DemoPropertyTaxBuyerIntendedUse,
  DemoPropertyTaxDateSource,
  DemoPropertyTaxDatedValue,
  DemoPropertyTaxDelinquentClientRole,
  DemoPropertyTaxDelinquentSituation,
  DemoPropertyTaxIssue,
  DemoPropertyTaxIssueKind,
  DemoPropertyTaxTriState,
} from '@/lib/demo/types'
import {
  DEMO_PROPERTY_TAX_DATE_SOURCES,
  DEMO_PROPERTY_TAX_ISSUE_KINDS,
  PROPERTY_TAX_ASSESSMENT_REPORTED_ISSUE_OPTIONS,
  PROPERTY_TAX_BUYER_INTENDED_USE_OPTIONS,
  PROPERTY_TAX_DELINQUENT_CLIENT_ROLE_OPTIONS,
  PROPERTY_TAX_DELINQUENT_SITUATION_OPTIONS,
  PROPERTY_TAX_INTAKE_SECTION_TITLE,
  PROPERTY_TAX_INVOLVEMENT_OPTIONS,
  PROPERTY_TAX_INVOLVEMENT_QUESTION,
  PROPERTY_TAX_ISSUE_BOUNDARY_DISCLAIMER,
  createEmptyPropertyTaxIssue,
  getPropertyTaxDateFieldsForKind,
  getPropertyTaxDateSourceLabel,
  getPropertyTaxDocumentChecklist,
  getPropertyTaxIssueKindLabel,
  getPropertyTaxStatedDeadlineBanner,
  isPropertyTaxBranchActive,
  normalizePropertyTaxIssue,
  nullableBoolFromTriState,
  patchPropertyTaxAssessmentBranch,
  patchPropertyTaxDatedField,
  patchPropertyTaxDelinquentBranch,
  patchPropertyTaxOwnershipBranch,
  patchPropertyTaxSharedFields,
  setPropertyTaxInvolvement,
  shouldShowPropertyTaxIntakeSection,
  togglePropertyTaxAvailableDocument,
  togglePropertyTaxDelinquentSituation,
  togglePropertyTaxIssueKind,
  triStateFromNullableBool,
} from '@/lib/demo/propertyTaxIssue'

type Props = {
  value: DemoPropertyTaxIssue | undefined
  onChange: (next: DemoPropertyTaxIssue) => void
  propertyAddress: string
  matterCounty?: string
  idPrefix: string
  readOnly?: boolean
}

const labelStyle: CSSProperties = {
  fontSize: 12,
  color: '#627c71',
  fontWeight: 800,
  display: 'block',
  marginBottom: 6,
}

const fieldStyle: CSSProperties = {
  width: '100%',
  marginTop: 4,
  padding: '10px 12px',
  borderRadius: 6,
  border: '1px solid rgba(94,82,64,0.22)',
  color: '#134252',
  background: 'white',
}

const optionRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  fontSize: 13,
  color: '#134252',
  fontWeight: 600,
  cursor: 'pointer',
}

function readDatedField(branch: object, key: string): DemoPropertyTaxDatedValue {
  const raw = (branch as Record<string, unknown>)[key]
  if (raw && typeof raw === 'object' && 'source' in raw) {
    return raw as DemoPropertyTaxDatedValue
  }
  return { date: null, source: 'unknown' }
}

function DatedValueControl({
  id,
  label,
  value,
  onChange,
  readOnly,
  showDeadlineBanner,
}: {
  id: string
  label: string
  value: DemoPropertyTaxDatedValue
  onChange: (next: DemoPropertyTaxDatedValue) => void
  readOnly?: boolean
  showDeadlineBanner?: boolean
}) {
  const banner = showDeadlineBanner ? getPropertyTaxStatedDeadlineBanner(value) : null
  return (
    <div>
      <label htmlFor={id} style={labelStyle}>
        {label}
      </label>
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)' }}>
        <input
          id={id}
          type="date"
          value={value.date ?? ''}
          disabled={readOnly}
          onChange={(e) =>
            onChange({
              date: e.target.value || null,
              source: value.source,
            })
          }
          style={{ ...fieldStyle, marginTop: 0, background: readOnly ? '#f4f4f0' : 'white' }}
        />
        <select
          id={`${id}-source`}
          aria-label={`${label} verification`}
          value={value.source}
          disabled={readOnly}
          onChange={(e) =>
            onChange({
              date: value.date,
              source: e.target.value as DemoPropertyTaxDateSource,
            })
          }
          style={{ ...fieldStyle, marginTop: 0, background: readOnly ? '#f4f4f0' : 'white' }}
        >
          {DEMO_PROPERTY_TAX_DATE_SOURCES.map((source) => (
            <option key={source} value={source}>
              {getPropertyTaxDateSourceLabel(source)}
            </option>
          ))}
        </select>
      </div>
      {banner ? (
        <p style={{ margin: '6px 0 0', fontSize: 12, color: '#627c71', lineHeight: 1.4 }}>{banner}</p>
      ) : null}
    </div>
  )
}

function TriStateRadios({
  name,
  legend,
  value,
  onChange,
  readOnly,
}: {
  name: string
  legend: string
  value: DemoPropertyTaxTriState
  onChange: (next: DemoPropertyTaxTriState) => void
  readOnly?: boolean
}) {
  return (
    <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
      <legend style={{ ...labelStyle, padding: 0 }}>{legend}</legend>
      <div role="radiogroup" aria-label={legend} style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {PROPERTY_TAX_INVOLVEMENT_OPTIONS.map((o) => (
          <label key={o.value} style={{ ...optionRowStyle, cursor: readOnly ? 'default' : 'pointer' }}>
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              disabled={readOnly}
              onChange={() => onChange(o.value)}
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export default function PropertyTaxIntakeSection({
  value,
  onChange,
  propertyAddress,
  matterCounty = '',
  idPrefix,
  readOnly = false,
}: Props) {
  if (!shouldShowPropertyTaxIntakeSection(propertyAddress)) return null

  const issue = normalizePropertyTaxIssue(value ?? createEmptyPropertyTaxIssue())
  const showChildren = isPropertyTaxBranchActive(issue)
  const assessment = issue.byKind.assessment_vab
  const ownership = issue.byKind.ownership_change_tax_risk
  const delinquent = issue.byKind.delinquent_tax_deed_surplus

  const emit = (next: DemoPropertyTaxIssue) => onChange(normalizePropertyTaxIssue(next))

  return (
    <section
      data-testid={`${idPrefix}-property-tax-section`}
      aria-labelledby={`${idPrefix}-property-tax-title`}
      style={{
        marginTop: 4,
        padding: '12px 12px 14px',
        borderRadius: 8,
        border: '1px solid rgba(94,82,64,0.18)',
        background: '#fafaf7',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div>
        <h3
          id={`${idPrefix}-property-tax-title`}
          style={{ margin: 0, fontSize: 14, fontWeight: 900, color: '#134252' }}
        >
          {PROPERTY_TAX_INTAKE_SECTION_TITLE}
        </h3>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: '#627c71', lineHeight: 1.45 }}>
          {PROPERTY_TAX_ISSUE_BOUNDARY_DISCLAIMER}
        </p>
      </div>

      <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
        <legend style={{ ...labelStyle, padding: 0 }}>{PROPERTY_TAX_INVOLVEMENT_QUESTION}</legend>
        <div
          role="radiogroup"
          aria-label={PROPERTY_TAX_INVOLVEMENT_QUESTION}
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          {PROPERTY_TAX_INVOLVEMENT_OPTIONS.map((o) => (
            <label key={o.value} style={{ ...optionRowStyle, cursor: readOnly ? 'default' : 'pointer' }}>
              <input
                type="radio"
                name={`${idPrefix}-ptx-involvement`}
                value={o.value}
                checked={issue.involvement === o.value}
                disabled={readOnly}
                onChange={() => emit(setPropertyTaxInvolvement(issue, o.value))}
              />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      {showChildren ? (
        <>
          <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
            <legend style={{ ...labelStyle, padding: 0 }}>
              Issue kinds (optional — select all that may apply)
            </legend>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DEMO_PROPERTY_TAX_ISSUE_KINDS.map((kind) => (
                <label key={kind} style={{ ...optionRowStyle, cursor: readOnly ? 'default' : 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={issue.kinds.includes(kind)}
                    disabled={readOnly}
                    onChange={(e) => emit(togglePropertyTaxIssueKind(issue, kind, e.target.checked))}
                  />
                  {getPropertyTaxIssueKindLabel(kind)}
                </label>
              ))}
            </div>
            {issue.involvement === 'unknown' ? (
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#627c71', lineHeight: 1.4 }}>
                Unknown is fine — you do not need to pick a precise issue kind yet.
              </p>
            ) : null}
          </fieldset>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label htmlFor={`${idPrefix}-ptx-county`} style={labelStyle}>
                Florida county (optional)
              </label>
              <input
                id={`${idPrefix}-ptx-county`}
                type="text"
                value={issue.floridaCounty}
                placeholder={matterCounty.trim() ? `Matter county: ${matterCounty}` : undefined}
                disabled={readOnly}
                onChange={(e) => emit(patchPropertyTaxSharedFields(issue, { floridaCounty: e.target.value }))}
                style={{ ...fieldStyle, background: readOnly ? '#f4f4f0' : 'white' }}
              />
            </div>
            {propertyAddress.trim() ? (
              <p style={{ margin: 0, fontSize: 12, color: '#627c71', lineHeight: 1.4 }}>
                Property address (from intake): <span style={{ color: '#134252', fontWeight: 700 }}>{propertyAddress}</span>
              </p>
            ) : null}
            <div>
              <label htmlFor={`${idPrefix}-ptx-parcel`} style={labelStyle}>
                Parcel or folio ID (optional)
              </label>
              <input
                id={`${idPrefix}-ptx-parcel`}
                type="text"
                value={issue.parcelOrFolio}
                disabled={readOnly}
                onChange={(e) => emit(patchPropertyTaxSharedFields(issue, { parcelOrFolio: e.target.value }))}
                style={{ ...fieldStyle, background: readOnly ? '#f4f4f0' : 'white' }}
              />
            </div>
            <div>
              <label htmlFor={`${idPrefix}-ptx-desc`} style={labelStyle}>
                Brief description of the issue (optional)
              </label>
              <textarea
                id={`${idPrefix}-ptx-desc`}
                value={issue.clientIssueDescription}
                disabled={readOnly}
                rows={3}
                onChange={(e) =>
                  emit(patchPropertyTaxSharedFields(issue, { clientIssueDescription: e.target.value }))
                }
                style={{
                  ...fieldStyle,
                  resize: 'vertical',
                  lineHeight: 1.45,
                  background: readOnly ? '#f4f4f0' : 'white',
                }}
              />
            </div>
            <div>
              <label htmlFor={`${idPrefix}-ptx-opposing`} style={labelStyle}>
                Known opposing party, agency, or county office (optional)
              </label>
              <input
                id={`${idPrefix}-ptx-opposing`}
                type="text"
                value={issue.opposingPartyOrAgency}
                disabled={readOnly}
                onChange={(e) =>
                  emit(patchPropertyTaxSharedFields(issue, { opposingPartyOrAgency: e.target.value }))
                }
                style={{ ...fieldStyle, background: readOnly ? '#f4f4f0' : 'white' }}
              />
            </div>
          </div>

          {issue.kinds.includes('assessment_vab') && assessment ? (
            <TrackBlock title={getPropertyTaxIssueKindLabel('assessment_vab')}>
              <TriStateRadios
                name={`${idPrefix}-ptx-trim-received`}
                legend="Has a TRIM notice been received?"
                value={triStateFromNullableBool(assessment.noticeReceived)}
                readOnly={readOnly}
                onChange={(next) =>
                  emit(
                    patchPropertyTaxAssessmentBranch(issue, {
                      noticeReceived: nullableBoolFromTriState(next),
                    }),
                  )
                }
              />
              <div>
                <label htmlFor={`${idPrefix}-ptx-reported-issue`} style={labelStyle}>
                  Reported issue type
                </label>
                <select
                  id={`${idPrefix}-ptx-reported-issue`}
                  value={assessment.reportedIssueType}
                  disabled={readOnly}
                  onChange={(e) =>
                    emit(
                      patchPropertyTaxAssessmentBranch(issue, {
                        reportedIssueType: e.target.value as DemoPropertyTaxAssessmentReportedIssueType,
                      }),
                    )
                  }
                  style={{ ...fieldStyle, background: readOnly ? '#f4f4f0' : 'white' }}
                >
                  {PROPERTY_TAX_ASSESSMENT_REPORTED_ISSUE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <TriStateRadios
                name={`${idPrefix}-ptx-vab-filed`}
                legend="Has a VAB petition been filed?"
                value={triStateFromNullableBool(assessment.vabPetitionFiled)}
                readOnly={readOnly}
                onChange={(next) =>
                  emit(
                    patchPropertyTaxAssessmentBranch(issue, {
                      vabPetitionFiled: nullableBoolFromTriState(next),
                    }),
                  )
                }
              />
              {getPropertyTaxDateFieldsForKind('assessment_vab').map((field) => (
                <DatedValueControl
                  key={field.key}
                  id={`${idPrefix}-ptx-a-${field.key}`}
                  label={field.label}
                  value={readDatedField(assessment, field.key)}
                  readOnly={readOnly}
                  onChange={(next) =>
                    emit(patchPropertyTaxDatedField(issue, 'assessment_vab', field.key, next))
                  }
                />
              ))}
              <DocumentChecklist
                idPrefix={`${idPrefix}-ptx-a-docs`}
                kind="assessment_vab"
                selectedIds={assessment.availableDocumentIds}
                readOnly={readOnly}
                onToggle={(documentId, selected) =>
                  emit(togglePropertyTaxAvailableDocument(issue, 'assessment_vab', documentId, selected))
                }
              />
            </TrackBlock>
          ) : null}

          {issue.kinds.includes('ownership_change_tax_risk') && ownership ? (
            <TrackBlock title={getPropertyTaxIssueKindLabel('ownership_change_tax_risk')}>
              <div>
                <label htmlFor={`${idPrefix}-ptx-buyer-use`} style={labelStyle}>
                  Buyer intended use
                </label>
                <select
                  id={`${idPrefix}-ptx-buyer-use`}
                  value={ownership.buyerIntendedUse}
                  disabled={readOnly}
                  onChange={(e) =>
                    emit(
                      patchPropertyTaxOwnershipBranch(issue, {
                        buyerIntendedUse: e.target.value as DemoPropertyTaxBuyerIntendedUse,
                      }),
                    )
                  }
                  style={{ ...fieldStyle, background: readOnly ? '#f4f4f0' : 'white' }}
                >
                  {PROPERTY_TAX_BUYER_INTENDED_USE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <TriStateRadios
                name={`${idPrefix}-ptx-seller-homestead`}
                legend="Seller homestead status"
                value={ownership.sellerHomesteadStatus}
                readOnly={readOnly}
                onChange={(next) =>
                  emit(patchPropertyTaxOwnershipBranch(issue, { sellerHomesteadStatus: next }))
                }
              />
              <TriStateRadios
                name={`${idPrefix}-ptx-tax-bill-available`}
                legend="Is a current tax bill or TRIM notice available?"
                value={triStateFromNullableBool(ownership.taxBillOrTrimAvailable)}
                readOnly={readOnly}
                onChange={(next) =>
                  emit(
                    patchPropertyTaxOwnershipBranch(issue, {
                      taxBillOrTrimAvailable: nullableBoolFromTriState(next),
                    }),
                  )
                }
              />
              {getPropertyTaxDateFieldsForKind('ownership_change_tax_risk').map((field) => (
                <DatedValueControl
                  key={field.key}
                  id={`${idPrefix}-ptx-o-${field.key}`}
                  label={field.label}
                  value={readDatedField(ownership, field.key)}
                  readOnly={readOnly}
                  onChange={(next) =>
                    emit(patchPropertyTaxDatedField(issue, 'ownership_change_tax_risk', field.key, next))
                  }
                />
              ))}
              <TriStateRadios
                name={`${idPrefix}-ptx-rely-seller-bill`}
                legend="Does the client report concern about relying on the seller’s current tax bill?"
                value={triStateFromNullableBool(ownership.relyingOnSellerCurrentBill)}
                readOnly={readOnly}
                onChange={(next) =>
                  emit(
                    patchPropertyTaxOwnershipBranch(issue, {
                      relyingOnSellerCurrentBill: nullableBoolFromTriState(next),
                    }),
                  )
                }
              />
            </TrackBlock>
          ) : null}

          {issue.kinds.includes('delinquent_tax_deed_surplus') && delinquent ? (
            <TrackBlock title={getPropertyTaxIssueKindLabel('delinquent_tax_deed_surplus')}>
              <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
                <legend style={{ ...labelStyle, padding: 0 }}>Reported situation (select all that apply)</legend>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {PROPERTY_TAX_DELINQUENT_SITUATION_OPTIONS.map((o) => (
                    <label
                      key={o.value}
                      style={{ ...optionRowStyle, cursor: readOnly ? 'default' : 'pointer' }}
                    >
                      <input
                        type="checkbox"
                        checked={delinquent.situations.includes(o.value)}
                        disabled={readOnly}
                        onChange={(e) =>
                          emit(
                            togglePropertyTaxDelinquentSituation(
                              issue,
                              o.value as DemoPropertyTaxDelinquentSituation,
                              e.target.checked,
                            ),
                          )
                        }
                      />
                      {o.label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div>
                <label htmlFor={`${idPrefix}-ptx-client-role`} style={labelStyle}>
                  Client role
                </label>
                <select
                  id={`${idPrefix}-ptx-client-role`}
                  value={delinquent.clientRole}
                  disabled={readOnly}
                  onChange={(e) =>
                    emit(
                      patchPropertyTaxDelinquentBranch(issue, {
                        clientRole: e.target.value as DemoPropertyTaxDelinquentClientRole,
                      }),
                    )
                  }
                  style={{ ...fieldStyle, background: readOnly ? '#f4f4f0' : 'white' }}
                >
                  {PROPERTY_TAX_DELINQUENT_CLIENT_ROLE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              {getPropertyTaxDateFieldsForKind('delinquent_tax_deed_surplus').map((field) => (
                <DatedValueControl
                  key={field.key}
                  id={`${idPrefix}-ptx-d-${field.key}`}
                  label={field.label}
                  value={readDatedField(delinquent, field.key)}
                  readOnly={readOnly}
                  showDeadlineBanner={field.key === 'surplusNoticeDeadlineDate'}
                  onChange={(next) =>
                    emit(patchPropertyTaxDatedField(issue, 'delinquent_tax_deed_surplus', field.key, next))
                  }
                />
              ))}
              <DocumentChecklist
                idPrefix={`${idPrefix}-ptx-d-docs`}
                kind="delinquent_tax_deed_surplus"
                selectedIds={delinquent.availableDocumentIds}
                readOnly={readOnly}
                onToggle={(documentId, selected) =>
                  emit(
                    togglePropertyTaxAvailableDocument(
                      issue,
                      'delinquent_tax_deed_surplus',
                      documentId,
                      selected,
                    ),
                  )
                }
              />
            </TrackBlock>
          ) : null}
        </>
      ) : null}
    </section>
  )
}

function TrackBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      style={{
        padding: '12px',
        borderRadius: 8,
        border: '1px solid rgba(94,82,64,0.14)',
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 900, color: '#134252' }}>{title}</div>
      {children}
    </div>
  )
}

function DocumentChecklist({
  idPrefix,
  kind,
  selectedIds,
  onToggle,
  readOnly,
}: {
  idPrefix: string
  kind: DemoPropertyTaxIssueKind
  selectedIds: string[]
  onToggle: (documentId: string, selected: boolean) => void
  readOnly?: boolean
}) {
  const items = getPropertyTaxDocumentChecklist([kind])
  return (
    <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
      <legend style={{ ...labelStyle, padding: 0 }}>Available documents (capture only)</legend>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item) => (
          <label key={item.id} style={{ ...optionRowStyle, cursor: readOnly ? 'default' : 'pointer' }}>
            <input
              id={`${idPrefix}-${item.id}`}
              type="checkbox"
              checked={selectedIds.includes(item.id)}
              disabled={readOnly}
              onChange={(e) => onToggle(item.id, e.target.checked)}
            />
            {item.title}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
