'use client'

import type { CSSProperties } from 'react'
import type { DemoMatter } from '@/lib/demo/types'
import {
  buildPropertyTaxKeyDatesModel,
  formatPropertyTaxDateOnlyDisplay,
  shouldShowPropertyTaxKeyDatesSection,
} from '@/lib/demo/propertyTaxIssue'

type Props = {
  matter: DemoMatter
  /** ISO date-only `YYYY-MM-DD` for Soon/Passed comparison (date-only safe). */
  todayIsoDateOnly: string
  onReviewIntakeDetails?: () => void
}

/**
 * Key Dates subsection for Florida property-tax / tax-deed tracked dates.
 * Supplemental display only — does not mutate purchase `key_dates`.
 */
export default function PropertyTaxKeyDatesSection({
  matter,
  todayIsoDateOnly,
  onReviewIntakeDetails,
}: Props) {
  if (
    !shouldShowPropertyTaxKeyDatesSection({
      propertyAddress: matter.property.address,
      propertyTaxIssue: matter.propertyTaxIssue,
    })
  ) {
    return null
  }

  const model = buildPropertyTaxKeyDatesModel(matter.propertyTaxIssue, todayIsoDateOnly)

  return (
    <section
      id="matter-property-tax-key-dates"
      data-testid="matter-property-tax-key-dates"
      aria-labelledby="matter-property-tax-key-dates-title"
      style={{
        marginTop: 4,
        border: '1px solid rgba(94,82,64,0.14)',
        borderRadius: 8,
        padding: 12,
        background: '#fafaf7',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
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
        <div>
          <h3
            id="matter-property-tax-key-dates-title"
            style={{ margin: 0, fontSize: 14, fontWeight: 900, color: '#134252' }}
          >
            {model.title}
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#627c71' }}>
            {model.recordedDateCount} recorded date{model.recordedDateCount === 1 ? '' : 's'} ·
            internal tracking only
          </p>
        </div>
        {onReviewIntakeDetails ? (
          <button type="button" onClick={onReviewIntakeDetails} style={secondaryBtn}>
            View Property Tax & Tax Deed overview
          </button>
        ) : null}
      </div>

      {model.groups.length === 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: '#627c71', lineHeight: 1.45 }}>
          Issue type has not been confirmed. Record dates when available notices are obtained for firm
          review.
        </p>
      ) : null}

      {model.groups.map((group) => (
        <div
          key={group.kind}
          data-testid={`ptx-key-dates-group-${group.kind}`}
          style={{
            border: '1px solid rgba(94,82,64,0.12)',
            borderRadius: 8,
            padding: 10,
            background: 'white',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 900, color: '#134252' }}>{group.kindLabel}</div>

          {group.emptyCopy ? (
            <p style={{ margin: 0, fontSize: 11, color: '#627c71', lineHeight: 1.45 }}>
              {group.emptyCopy}
            </p>
          ) : null}

          {group.rows.map((row) => {
            const hasDate = Boolean(row.date)
            const leftBorder = !hasDate
              ? '#627c71'
              : row.urgencyPill === 'Passed'
                ? '#cbd5e0'
                : row.urgencyPill === 'Soon'
                  ? '#f0b429'
                  : '#208096'
            const text =
              row.urgencyPill === 'Passed'
                ? '#6b7280'
                : row.urgencyPill === 'Soon'
                  ? '#b45309'
                  : '#134252'
            return (
              <div
                key={row.id}
                data-testid={`ptx-key-date-${row.fieldKey}`}
                style={{
                  border: '1px solid rgba(94,82,64,0.1)',
                  borderRadius: 8,
                  padding: 10,
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  background: '#fcfcf9',
                }}
              >
                <div
                  style={{
                    width: 4,
                    borderRadius: 999,
                    background: leftBorder,
                    flexShrink: 0,
                    alignSelf: 'stretch',
                    minHeight: 36,
                  }}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: text, marginBottom: 4 }}>
                    {row.label}
                  </div>
                  <div style={{ color: text, fontWeight: 900, fontSize: 13 }}>
                    {formatPropertyTaxDateOnlyDisplay(row.date)}
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 6,
                      alignItems: 'center',
                    }}
                  >
                    <span style={pillStyle('#627c71', '#f5f5f5')}>{row.verificationLabel}</span>
                    {row.urgencyPill ? (
                      <span style={pillStyle(leftBorder, `${leftBorder}14`)}>
                        {row.urgencyPill === 'Soon' ? 'Soon (calendar)' : 'Past date'}
                      </span>
                    ) : null}
                    {row.verifyAlongsideUrgency ? (
                      <span style={pillStyle('#8a6d1d', '#fff8e6')}>{row.verifyAlongsideUrgency}</span>
                    ) : null}
                  </div>
                  {row.statedDeadlineBanner ? (
                    <p style={{ margin: '6px 0 0', fontSize: 11, color: '#627c71', lineHeight: 1.4 }}>
                      {row.statedDeadlineBanner}
                    </p>
                  ) : null}
                  <p style={{ margin: '6px 0 0', fontSize: 11, color: '#627c71', lineHeight: 1.4 }}>
                    {row.nextStepHint}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      ))}

      <p style={{ margin: 0, fontSize: 11, color: '#627c71', lineHeight: 1.45 }}>{model.footer}</p>
    </section>
  )
}

function pillStyle(border: string, background: string): CSSProperties {
  return {
    display: 'inline-block',
    fontSize: 11,
    fontWeight: 900,
    padding: '3px 8px',
    borderRadius: 999,
    border: `1px solid ${border}55`,
    background,
    color: border === '#cbd5e0' ? '#6b7280' : border === '#f0b429' ? '#b45309' : border,
    whiteSpace: 'nowrap',
  }
}

const secondaryBtn: CSSProperties = {
  background: 'white',
  border: '1px solid rgba(94,82,64,0.25)',
  borderRadius: 6,
  padding: '6px 10px',
  fontSize: 11,
  fontWeight: 800,
  color: '#134252',
  cursor: 'pointer',
}
