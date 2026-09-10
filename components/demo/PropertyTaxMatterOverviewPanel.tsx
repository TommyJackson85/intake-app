'use client'

import type { DemoMatter } from '@/lib/demo/types'
import {
  buildPropertyTaxMatterOverviewModel,
  shouldShowPropertyTaxMatterOverviewPanel,
} from '@/lib/demo/propertyTaxIssue'

type Props = {
  matter: DemoMatter
}

/**
 * Compact Matter Overview panel for Florida property-tax / tax-deed intake facts.
 * Organizes review tasks only — not legal advice, deadline calculation, or filing.
 */
export default function PropertyTaxMatterOverviewPanel({ matter }: Props) {
  if (
    !shouldShowPropertyTaxMatterOverviewPanel({
      propertyAddress: matter.property.address,
      propertyTaxIssue: matter.propertyTaxIssue,
    })
  ) {
    return null
  }

  const model = buildPropertyTaxMatterOverviewModel(matter.propertyTaxIssue)

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

      <p style={{ margin: 0, fontSize: 11, color: '#627c71', lineHeight: 1.45 }}>{model.disclaimer}</p>
    </section>
  )
}
