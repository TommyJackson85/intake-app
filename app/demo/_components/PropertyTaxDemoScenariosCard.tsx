'use client'

import Link from 'next/link'
import {
  PROPERTY_TAX_DEMO_FICTIONAL_LABEL,
  PROPERTY_TAX_DEMO_SCENARIOS,
  PROPERTY_TAX_DEMO_SCENARIOS_DISCLAIMER,
  PROPERTY_TAX_DEMO_SCENARIOS_SECTION_TITLE,
} from '@/lib/demo/propertyTaxDemoScenarios'

/**
 * Compact demo-landing entry points for Florida property-tax / tax-deed scenarios.
 * Fictional workflow samples only — not legal or tax advice.
 */
export default function PropertyTaxDemoScenariosCard() {
  return (
    <section
      data-testid="property-tax-demo-scenarios"
      aria-label={PROPERTY_TAX_DEMO_SCENARIOS_SECTION_TITLE}
      style={{
        background: 'white',
        border: '1px solid rgba(94,82,64,0.2)',
        borderRadius: 8,
        padding: 16,
        marginBottom: 18,
      }}
    >
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'baseline' }}>
          <h2 style={{ margin: 0, fontSize: 18, color: '#134252' }}>
            {PROPERTY_TAX_DEMO_SCENARIOS_SECTION_TITLE}
          </h2>
          <span
            data-testid="property-tax-demo-fictional-label"
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#627c71',
              background: '#f4f7f6',
              border: '1px solid rgba(94,82,64,0.18)',
              borderRadius: 4,
              padding: '2px 7px',
            }}
          >
            {PROPERTY_TAX_DEMO_FICTIONAL_LABEL}
          </span>
        </div>
        <p style={{ margin: '6px 0 0', color: '#627c71', fontSize: 13, lineHeight: 1.45, maxWidth: '46rem' }}>
          Three fictional Florida samples for intake classification, document suggestions, date verification, and
          attorney-review routing.
        </p>
      </div>

      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {PROPERTY_TAX_DEMO_SCENARIOS.map((scenario) => (
          <li
            key={scenario.id}
            data-testid={`property-tax-demo-scenario-${scenario.id}`}
            style={{
              borderTop: '1px solid rgba(94,82,64,0.12)',
              paddingTop: 12,
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 4 }}>
              <div style={{ fontWeight: 800, color: '#134252', fontSize: 14 }}>{scenario.title}</div>
              <span
                data-testid={`property-tax-demo-scenario-tag-${scenario.id}`}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#208096',
                  background: 'rgba(32,128,150,0.1)',
                  border: '1px solid rgba(32,128,150,0.25)',
                  borderRadius: 4,
                  padding: '2px 7px',
                }}
              >
                {scenario.tag}
              </span>
            </div>
            <p style={{ margin: '0 0 8px', color: '#3d5c66', fontSize: 13, lineHeight: 1.45, maxWidth: '46rem' }}>
              {scenario.purpose}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <Link
                href={scenario.intakeHref}
                data-testid={`property-tax-demo-intake-${scenario.id}`}
                style={{ fontSize: 12, fontWeight: 800, color: '#208096', textDecoration: 'none' }}
              >
                Open sample client intake
              </Link>
              <Link
                href={scenario.matterHref}
                data-testid={`property-tax-demo-matter-${scenario.id}`}
                style={{ fontSize: 12, fontWeight: 800, color: '#208096', textDecoration: 'none' }}
              >
                View sample matter
              </Link>
            </div>
          </li>
        ))}
      </ul>

      <p
        data-testid="property-tax-demo-scenarios-disclaimer"
        style={{ margin: '14px 0 0', color: '#627c71', fontSize: 12, lineHeight: 1.45, maxWidth: '46rem' }}
      >
        {PROPERTY_TAX_DEMO_SCENARIOS_DISCLAIMER}
      </p>
    </section>
  )
}
