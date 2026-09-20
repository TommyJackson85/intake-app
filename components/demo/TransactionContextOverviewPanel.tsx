'use client'

import type { DemoCondoDiligence, DemoMatter, DemoTransactionContext } from '@/lib/demo/types'
import {
  TRANSACTION_CONTEXT_BOUNDARY_DISCLAIMER,
  TRANSACTION_CONTEXT_SECTION_TITLE,
  buildMatterReadinessSummary,
  getTransactionContextDisplayRows,
  matterReadinessStatusPresentation,
  shouldShowTransactionContextOverview,
} from '@/lib/demo/transactionContext'

type Props = {
  matter: Pick<DemoMatter, 'property' | 'transactionContext'>
  condoDiligence?: DemoCondoDiligence | null
}

/**
 * Compact Overview card: Transaction Context facts + internal readiness summary.
 * Display-only; legacy matters without context render nothing for the context block
 * but still show readiness when useful (legacy → incomplete).
 */
export default function TransactionContextOverviewPanel({ matter, condoDiligence }: Props) {
  const context = matter.transactionContext as DemoTransactionContext | undefined
  const showContext = shouldShowTransactionContextOverview(context)
  const readiness = buildMatterReadinessSummary({
    transactionContext: context,
    propertyType: matter.property.property_type,
    condoRequiredDocuments: condoDiligence?.requiredDocuments ?? null,
    condoMatterStatus: condoDiligence?.status ?? null,
  })
  const readinessPresentation = matterReadinessStatusPresentation(readiness.status)
  const rows = getTransactionContextDisplayRows(context)

  // Always show readiness on Overview so legacy matters get a neutral incomplete cue
  // without inventing context fields.
  return (
    <div
      data-testid="matter-transaction-context-overview"
      style={{
        border: '1px solid rgba(94,82,64,0.12)',
        borderRadius: 8,
        padding: 12,
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {showContext ? (
        <div>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#134252', marginBottom: 6 }}>
            {TRANSACTION_CONTEXT_SECTION_TITLE}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 10,
            }}
          >
            {rows.map((row) => (
              <div key={row.key} data-testid={`tx-context-row-${row.key}`}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#627c71', marginBottom: 2 }}>
                  {row.label}
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#134252', lineHeight: 1.35 }}>
                  {row.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div data-testid="matter-readiness-summary">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            flexWrap: 'wrap',
            marginBottom: 6,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 900, color: '#134252' }}>Matter readiness</div>
          <span
            data-testid="matter-readiness-status"
            style={{
              display: 'inline-block',
              padding: '4px 8px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 800,
              background: readinessPresentation.bg,
              color: readinessPresentation.color,
              border: `1px solid ${readinessPresentation.border}`,
              whiteSpace: 'nowrap',
            }}
          >
            {readinessPresentation.label}
          </span>
        </div>
        <p
          data-testid="matter-readiness-message"
          style={{ margin: 0, fontSize: 12, color: '#627c71', lineHeight: 1.45 }}
        >
          {readiness.message}
        </p>
        {readiness.items.length > 0 ? (
          <ul
            data-testid="matter-readiness-items"
            style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 11, color: '#627c71', lineHeight: 1.45 }}
          >
            {readiness.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <p style={{ margin: 0, fontSize: 11, color: '#627c71', lineHeight: 1.45 }}>
        {TRANSACTION_CONTEXT_BOUNDARY_DISCLAIMER}
      </p>
    </div>
  )
}
