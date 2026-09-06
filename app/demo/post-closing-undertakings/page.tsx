'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useDemoStore } from '@/lib/demo/store'
import { POST_CLOSING_RECORDED_ITEM_LABEL } from '@/lib/demo/postClosingUndertakings'
import { getPostClosingUndertakingsWorklist } from '@/lib/demo/postClosingUndertakingsWorklist'

function formatWorklistDate(value: string | null) {
  if (!value) return '—'
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const time = new Date(value).getTime()
  if (!Number.isFinite(time)) return value
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

export default function PostClosingUndertakingsWorklistPage() {
  const { matters, postClosingUndertakingsByMatterId } = useDemoStore()

  const worklist = useMemo(
    () =>
      getPostClosingUndertakingsWorklist({
        matters,
        postClosingUndertakingsByMatterId,
      }),
    [matters, postClosingUndertakingsByMatterId]
  )

  return (
    <div>
      <h1 style={{ marginBottom: 6, fontSize: 32, color: '#134252' }}>
        Post-Closing Undertakings Worklist
      </h1>
      <p style={{ marginTop: 0, marginBottom: 16, color: '#627c71', maxWidth: '46rem', lineHeight: 1.45 }}>
        {worklist.disclaimer}
      </p>

      <div
        style={{
          marginBottom: 16,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid rgba(94,82,64,0.2)',
          background: '#fff',
          color: '#134252',
          fontWeight: 800,
          fontSize: 13,
        }}
      >
        <span style={{ color: worklist.pendingCount > 0 ? '#b45309' : '#627c71' }}>
          {worklist.countLabel}
        </span>
      </div>

      <div
        style={{
          background: 'white',
          borderRadius: 8,
          border: '1px solid rgba(94,82,64,0.2)',
          overflowX: 'auto',
          marginBottom: 28,
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fcfcf9', borderBottom: '1px solid rgba(94,82,64,0.2)' }}>
              <th style={{ padding: 14, textAlign: 'left', fontWeight: 800 }}>Matter</th>
              <th style={{ padding: 14, textAlign: 'left', fontWeight: 800 }}>
                {POST_CLOSING_RECORDED_ITEM_LABEL}
              </th>
              <th style={{ padding: 14, textAlign: 'left', fontWeight: 800 }}>Status</th>
              <th style={{ padding: 14, textAlign: 'left', fontWeight: 800 }}>Responsible party</th>
              <th style={{ padding: 14, textAlign: 'left', fontWeight: 800 }}>Target date</th>
              <th style={{ padding: 14, textAlign: 'left', fontWeight: 800 }}>Follow-up note</th>
              <th style={{ padding: 14, textAlign: 'left', fontWeight: 800 }}>Review</th>
              <th style={{ padding: 14, textAlign: 'left', fontWeight: 800 }}>Open</th>
            </tr>
          </thead>
          <tbody>
            {worklist.items.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 14, color: '#627c71' }}>
                  No recorded post-closing items currently have outstanding follow-up status.
                </td>
              </tr>
            ) : (
              worklist.items.map((item) => (
                <tr
                  key={`${item.matterId}:${item.undertakingId}`}
                  style={{ borderBottom: '1px solid rgba(94,82,64,0.12)' }}
                >
                  <td style={{ padding: 14, color: '#627c71', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 800, color: '#134252' }}>{item.matterFileId}</div>
                    <div style={{ marginTop: 4, fontSize: 13 }}>{item.matterLabel}</div>
                    <div style={{ marginTop: 4, fontSize: 12 }}>{item.matterStatus}</div>
                  </td>
                  <td style={{ padding: 14, color: '#134252', fontWeight: 700, verticalAlign: 'top' }}>
                    <div>{item.title}</div>
                    {item.details ? (
                      <div style={{ marginTop: 6, fontWeight: 500, color: '#627c71', fontSize: 12 }}>
                        {item.details}
                      </div>
                    ) : null}
                  </td>
                  <td style={{ padding: 14, verticalAlign: 'top' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 800,
                        background: item.statusPresentation.bg,
                        color: item.statusPresentation.color,
                        border: `1px solid ${item.statusPresentation.border}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.statusLabel}
                    </span>
                  </td>
                  <td style={{ padding: 14, color: '#627c71', verticalAlign: 'top', fontSize: 13 }}>
                    {item.responsiblePartyLabel}
                  </td>
                  <td style={{ padding: 14, color: '#627c71', verticalAlign: 'top', fontSize: 13 }}>
                    {formatWorklistDate(item.targetDate)}
                  </td>
                  <td style={{ padding: 14, color: '#627c71', verticalAlign: 'top', fontSize: 13 }}>
                    {item.followUpNote || '—'}
                  </td>
                  <td style={{ padding: 14, color: '#627c71', verticalAlign: 'top', fontSize: 13 }}>
                    <div>{item.reviewStatusLabel}</div>
                    <div style={{ marginTop: 4, fontSize: 12 }}>{item.reviewApplicabilityLabel}</div>
                  </td>
                  <td style={{ padding: 14, verticalAlign: 'top' }}>
                    <Link
                      href={`/demo/matters?matter=${encodeURIComponent(item.matterFileId)}`}
                      style={{
                        display: 'inline-block',
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid rgba(94,82,64,0.3)',
                        background: '#fff',
                        color: '#134252',
                        fontWeight: 800,
                        fontSize: 13,
                        textDecoration: 'none',
                      }}
                    >
                      Open matter
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
