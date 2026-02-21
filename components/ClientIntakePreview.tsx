'use client'

/**
 * Read-only preview of the client intake form. Used for "Preview client portal" on intakes.
 */

type LeadData = {
  id: string
  status: string | null
  client_full_name: string | null
  client_email: string | null
  client_phone: string | null
  matter_type: string | null
  property_address: string | null
  intake_data: Record<string, unknown>
  created_at: string | null
  submitted_at: string | null
}

type FirmData = { id: string; name: string; state: string } | null

export function ClientIntakePreview({
  firm,
  lead,
}: {
  firm: FirmData
  lead: LeadData
}) {
  const d = lead.intake_data || {}
  const firmName = firm?.name || 'Client intake'
  const alreadySubmitted = lead.status === 'submitted'

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontWeight: 900, fontSize: '22px', color: '#134252' }}>{firmName}</div>
        <div style={{ color: '#627c71', fontSize: '13px' }}>
          Secure intake form · Preview (read-only)
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '10px', border: '1px solid rgba(94, 82, 64, 0.2)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 16px' }}>
          {alreadySubmitted ? (
            <div>
              <h1 style={{ marginTop: 0, marginBottom: '10px', fontSize: '26px' }}>Thanks — we've received your intake</h1>
              <p style={{ marginTop: 0, color: '#627c71', lineHeight: '1.6' }}>
                (Preview of submitted state. Your law firm has been notified.)
              </p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ marginTop: 0, marginBottom: '8px', fontSize: '18px' }}>Contact details</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#627c71', marginBottom: '4px' }}>Full name</div>
                    <div style={{ padding: '12px', borderRadius: '6px', background: '#f8f8f8', color: '#134252' }}>{lead.client_full_name || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#627c71', marginBottom: '4px' }}>Email</div>
                    <div style={{ padding: '12px', borderRadius: '6px', background: '#f8f8f8', color: '#134252' }}>{lead.client_email || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#627c71', marginBottom: '4px' }}>Phone</div>
                    <div style={{ padding: '12px', borderRadius: '6px', background: '#f8f8f8', color: '#134252' }}>{lead.client_phone || '—'}</div>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ marginTop: 0, marginBottom: '8px', fontSize: '18px' }}>Property details</h2>
                <div style={{ fontSize: '12px', color: '#627c71', marginBottom: '4px' }}>Property address</div>
                <div style={{ padding: '12px', borderRadius: '6px', background: '#f8f8f8', color: '#134252' }}>{lead.property_address || '—'}</div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ marginTop: 0, marginBottom: '8px', fontSize: '18px' }}>Matter</h2>
                <div style={{ fontSize: '12px', color: '#627c71', marginBottom: '4px' }}>Matter type</div>
                <div style={{ padding: '12px', borderRadius: '6px', background: '#f8f8f8', color: '#134252' }}>{lead.matter_type || '—'}</div>
                {(d.matterDescription as string) && (
                  <>
                    <div style={{ fontSize: '12px', color: '#627c71', marginBottom: '4px', marginTop: '12px' }}>Description</div>
                    <div style={{ padding: '12px', borderRadius: '6px', background: '#f8f8f8', color: '#134252' }}>{(d.matterDescription as string) || '—'}</div>
                  </>
                )}
                {(d.targetClosingDate as string) && (
                  <>
                    <div style={{ fontSize: '12px', color: '#627c71', marginBottom: '4px', marginTop: '12px' }}>Target closing date</div>
                    <div style={{ padding: '12px', borderRadius: '6px', background: '#f8f8f8', color: '#134252' }}>{(d.targetClosingDate as string) || '—'}</div>
                  </>
                )}
              </div>

              <div>
                <h2 style={{ marginTop: 0, marginBottom: '8px', fontSize: '18px' }}>KYC basics</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {(d.citizenshipCountry as string) && (
                    <div>
                      <div style={{ fontSize: '12px', color: '#627c71', marginBottom: '4px' }}>Citizenship country</div>
                      <div style={{ padding: '12px', borderRadius: '6px', background: '#f8f8f8', color: '#134252' }}>{(d.citizenshipCountry as string) || '—'}</div>
                    </div>
                  )}
                  {(d.isUsPerson as string) && (
                    <div>
                      <div style={{ fontSize: '12px', color: '#627c71', marginBottom: '4px' }}>US citizen or resident</div>
                      <div style={{ padding: '12px', borderRadius: '6px', background: '#f8f8f8', color: '#134252' }}>{(d.isUsPerson as string) || '—'}</div>
                    </div>
                  )}
                </div>
                {(d.sourceOfFunds as string) && (
                  <>
                    <div style={{ fontSize: '12px', color: '#627c71', marginBottom: '4px', marginTop: '12px' }}>Source of funds</div>
                    <div style={{ padding: '12px', borderRadius: '6px', background: '#f8f8f8', color: '#134252' }}>{(d.sourceOfFunds as string) || '—'}</div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
