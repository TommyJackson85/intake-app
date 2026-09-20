'use client'

import type { CSSProperties } from 'react'
import type { DemoTransactionContext } from '@/lib/demo/types'
import {
  TRANSACTION_CONTEXT_BOUNDARY_DISCLAIMER,
  TRANSACTION_CONTEXT_CLIENT_ROLE_OPTIONS,
  TRANSACTION_CONTEXT_MATTER_KIND_OPTIONS,
  TRANSACTION_CONTEXT_PRIMARY_CONCERN_OPTIONS,
  TRANSACTION_CONTEXT_PROPERTY_KIND_OPTIONS,
  TRANSACTION_CONTEXT_SECTION_TITLE,
  TRANSACTION_CONTEXT_STAGE_OPTIONS,
  createEmptyTransactionContext,
  normalizeTransactionContext,
  patchTransactionContext,
} from '@/lib/demo/transactionContext'

type Props = {
  value: DemoTransactionContext | null | undefined
  onChange: (next: DemoTransactionContext) => void
  idPrefix?: string
  readOnly?: boolean
}

const labelStyle: CSSProperties = { fontSize: 12, color: '#627c71', fontWeight: 700 }
const fieldStyle: CSSProperties = {
  padding: '10px 12px',
  borderRadius: 6,
  border: '1px solid rgba(94,82,64,0.22)',
  fontSize: 13,
}

/**
 * Optional Transaction Context triage fields for new-matter / intake forms.
 * Operational classification only — not legal advice.
 */
export default function TransactionContextIntakeSection({
  value,
  onChange,
  idPrefix = 'tx-context',
  readOnly = false,
}: Props) {
  const ctx = createEmptyTransactionContext(normalizeTransactionContext(value) ?? undefined)
  const emit = (patch: Partial<DemoTransactionContext>) =>
    onChange(patchTransactionContext(ctx, patch))

  return (
    <section
      data-testid={`${idPrefix}-transaction-context-section`}
      aria-labelledby={`${idPrefix}-transaction-context-title`}
      style={{
        gridColumn: '1 / -1',
        marginTop: 4,
        padding: '12px 12px 14px',
        borderRadius: 8,
        border: '1px solid rgba(94,82,64,0.18)',
        background: '#fafaf7',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div>
        <h3
          id={`${idPrefix}-transaction-context-title`}
          style={{ margin: 0, fontSize: 14, fontWeight: 900, color: '#134252' }}
        >
          {TRANSACTION_CONTEXT_SECTION_TITLE}
        </h3>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: '#627c71', lineHeight: 1.45 }}>
          {TRANSACTION_CONTEXT_BOUNDARY_DISCLAIMER}
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor={`${idPrefix}-matter-kind`} style={labelStyle}>
            Matter kind
          </label>
          <select
            id={`${idPrefix}-matter-kind`}
            data-testid={`${idPrefix}-matter-kind`}
            value={ctx.matterKind}
            disabled={readOnly}
            onChange={(e) =>
              emit({
                matterKind: e.target.value as DemoTransactionContext['matterKind'],
              })
            }
            style={{ ...fieldStyle, background: readOnly ? '#f4f4f0' : 'white' }}
          >
            <option value="">Select…</option>
            {TRANSACTION_CONTEXT_MATTER_KIND_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor={`${idPrefix}-client-role`} style={labelStyle}>
            Client role
          </label>
          <select
            id={`${idPrefix}-client-role`}
            data-testid={`${idPrefix}-client-role`}
            value={ctx.clientRole}
            disabled={readOnly}
            onChange={(e) =>
              emit({
                clientRole: e.target.value as DemoTransactionContext['clientRole'],
              })
            }
            style={{ ...fieldStyle, background: readOnly ? '#f4f4f0' : 'white' }}
          >
            <option value="">Select…</option>
            {TRANSACTION_CONTEXT_CLIENT_ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor={`${idPrefix}-property-kind`} style={labelStyle}>
            Property kind
          </label>
          <select
            id={`${idPrefix}-property-kind`}
            data-testid={`${idPrefix}-property-kind`}
            value={ctx.propertyKind}
            disabled={readOnly}
            onChange={(e) =>
              emit({
                propertyKind: e.target.value as DemoTransactionContext['propertyKind'],
              })
            }
            style={{ ...fieldStyle, background: readOnly ? '#f4f4f0' : 'white' }}
          >
            <option value="">Select…</option>
            {TRANSACTION_CONTEXT_PROPERTY_KIND_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor={`${idPrefix}-stage`} style={labelStyle}>
            Transaction stage
          </label>
          <select
            id={`${idPrefix}-stage`}
            data-testid={`${idPrefix}-stage`}
            value={ctx.transactionStage}
            disabled={readOnly}
            onChange={(e) =>
              emit({
                transactionStage: e.target.value as DemoTransactionContext['transactionStage'],
              })
            }
            style={{ ...fieldStyle, background: readOnly ? '#f4f4f0' : 'white' }}
          >
            <option value="">Select…</option>
            {TRANSACTION_CONTEXT_STAGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor={`${idPrefix}-concern`} style={labelStyle}>
            Primary concern
          </label>
          <select
            id={`${idPrefix}-concern`}
            data-testid={`${idPrefix}-concern`}
            value={ctx.primaryConcern}
            disabled={readOnly}
            onChange={(e) =>
              emit({
                primaryConcern: e.target.value as DemoTransactionContext['primaryConcern'],
              })
            }
            style={{ ...fieldStyle, background: readOnly ? '#f4f4f0' : 'white' }}
          >
            <option value="">Select…</option>
            {TRANSACTION_CONTEXT_PRIMARY_CONCERN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label htmlFor={`${idPrefix}-notes`} style={labelStyle}>
          Context notes (optional)
        </label>
        <textarea
          id={`${idPrefix}-notes`}
          data-testid={`${idPrefix}-notes`}
          value={ctx.notes}
          disabled={readOnly}
          rows={2}
          placeholder="Short factual notes for staff routing — no legal conclusions"
          onChange={(e) => emit({ notes: e.target.value })}
          style={{
            ...fieldStyle,
            resize: 'vertical',
            background: readOnly ? '#f4f4f0' : 'white',
            fontFamily: 'inherit',
          }}
        />
      </div>
    </section>
  )
}
