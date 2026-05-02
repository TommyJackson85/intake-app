'use client'

/**
 * Temporary developer/demo reference UI: visual map of `systemContract` with a supporting
 * implementation layer from `demoImplementationByDomain` (paths only — no second narrative source).
 * Safe to remove once canonical contract is surfaced elsewhere or no longer needed on-dashboard.
 */

import { demoImplementationByDomain } from '@/lib/adapters/demo-from-contract'
import type { DemoDomainImplementationRef } from '@/lib/adapters/demo-from-contract'
import { systemContract } from '@/lib/domain/system-contract'
import type { SystemContractDomain, SystemContractDomainKey } from '@/lib/domain/system-contract'

/** Build a few compact lines from adapter metadata; all strings originate on the ref object. */
function compactDemoImplementationSummary(ref: DemoDomainImplementationRef): { label: string; text: string }[] {
  const lines: { label: string; text: string }[] = []
  if (ref.typesPath) lines.push({ label: 'Types', text: ref.typesPath })
  if (ref.storePath) lines.push({ label: 'Store', text: ref.storePath })
  const hp = ref.helperPaths
  if (hp && hp.length > 0) {
    const more = hp.length > 1 ? ` (+${hp.length - 1} more)` : ''
    lines.push({ label: 'Helpers', text: `${hp[0]}${more}` })
  }
  if (ref.notes) lines.push({ label: 'Note', text: ref.notes })
  return lines
}

export default function SystemContractMapCard() {
  const domainEntries = Object.entries(systemContract.domains) as [SystemContractDomainKey, SystemContractDomain][]

  return (
    <section
      aria-label="System contract map (demo reference only)"
      style={{
        marginTop: '28px',
        padding: '18px 20px',
        borderRadius: '8px',
        border: '1px dashed rgba(19, 66, 82, 0.35)',
        background: '#f4f9fa',
        color: '#134252',
        fontSize: '13px',
        lineHeight: 1.45,
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px', marginBottom: '12px' }}>
        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>System Contract Map</h2>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: '#208096',
          }}
        >
          Demo reference only
        </span>
      </div>

      <p style={{ margin: '0 0 12px', color: '#3d5c66' }}>
        <strong>{systemContract.meta.purpose}</strong> — v{systemContract.meta.version}
      </p>

      <p style={{ margin: '0 0 14px', color: '#627c71', fontSize: '12px' }}>
        Demo local data is intended to follow this contract as it evolves. The live app will map to the same domains with
        stricter auth, firm scoping, and persistence. Future AI workflows should align to these domains and to each
        domain&apos;s readable/writable boundaries rather than writing freely across the system.
      </p>

      <h3 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 800 }}>Domains</h3>
      <ul style={{ margin: '0 0 16px', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {domainEntries.map(([key, d]) => {
          const impl = demoImplementationByDomain[key]
          const implLines = compactDemoImplementationSummary(impl)
          return (
            <li key={key} style={{ listStyleType: 'disc' }}>
              <div style={{ fontWeight: 700 }}>
                <code style={{ fontSize: '12px', background: 'rgba(32, 128, 150, 0.12)', padding: '1px 6px', borderRadius: '4px' }}>{key}</code>
                <span style={{ marginLeft: '8px' }}>{d.canonicalName}</span>
              </div>
              <div style={{ marginTop: '4px', color: '#3d5c66' }}>{d.description}</div>
              {d.relationships.length > 0 && (
                <div style={{ marginTop: '4px', fontSize: '12px', color: '#627c71' }}>
                  <strong>Relations:</strong> {d.relationships.join(' · ')}
                </div>
              )}
              <div style={{ marginTop: '6px', fontSize: '12px', color: '#5a7a85' }}>
                <strong>AI:</strong> read {d.ai.readable.length} bullet(s)
                {d.ai.writable.length > 0 ? ` · write ${d.ai.writable.length} bullet(s)` : ' · write default: none listed'}
                {d.ai.notes ? ` — ${d.ai.notes}` : ''}
              </div>
              {implLines.length > 0 && (
                <details style={{ marginTop: '8px', fontSize: '11px', color: '#6b7280' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#5a7a85', userSelect: 'none' }}>
                    Where in the demo repo
                  </summary>
                  <ul style={{ margin: '6px 0 0', paddingLeft: '16px', listStyleType: 'circle' }}>
                    {implLines.map((row) => (
                      <li key={`${key}-${row.label}`} style={{ marginBottom: '4px' }}>
                        <strong style={{ color: '#627c71' }}>{row.label}:</strong>{' '}
                        <span style={{ wordBreak: 'break-word' }}>{row.text}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </li>
          )
        })}
      </ul>

      <h3 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 800 }}>AI cross-cutting</h3>
      <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#627c71' }}>Workflow stages (from contract)</p>
      <ol style={{ margin: '0 0 12px', paddingLeft: '18px', fontSize: '12px', color: '#3d5c66' }}>
        {systemContract.aiCrossCutting.workflowStages.map((s) => (
          <li key={s.id} style={{ marginBottom: '6px' }}>
            <code>{s.id}</code> — {s.description}
          </li>
        ))}
      </ol>
      <ul style={{ margin: '0 0 16px', paddingLeft: '18px', fontSize: '12px', color: '#5a7a85' }}>
        {systemContract.aiCrossCutting.globalPrinciples.map((p, i) => (
          <li key={i} style={{ marginBottom: '4px' }}>
            {p}
          </li>
        ))}
      </ul>

      <h3 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 800 }}>Known divergences</h3>
      <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {systemContract.knownDivergences.map((x) => (
          <li key={x.id} style={{ fontSize: '12px', color: '#3d5c66' }}>
            <strong>
              <code>{x.id}</code>
            </strong>
            — {x.summary}
            <div style={{ marginTop: '4px', color: '#627c71' }}>Mitigation: {x.mitigation}</div>
          </li>
        ))}
      </ul>

      <details style={{ marginTop: '14px', fontSize: '12px', color: '#627c71' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Contract evolution notes ({systemContract.meta.evolutionNotes.length})</summary>
        <ul style={{ margin: '8px 0 0', paddingLeft: '18px' }}>
          {systemContract.meta.evolutionNotes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </details>

      <p style={{ margin: '12px 0 0', fontSize: '11px', color: '#94a3af', lineHeight: 1.4 }}>
        Live / AI placeholder adapters (metadata only, not expanded here):{' '}
        <code style={{ fontSize: '10px' }}>lib/adapters/live-from-contract.ts</code>,{' '}
        <code style={{ fontSize: '10px' }}>lib/adapters/ai-from-contract.ts</code>.
      </p>
    </section>
  )
}
