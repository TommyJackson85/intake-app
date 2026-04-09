'use client'

import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ClientIntakePreview } from '@/components/ClientIntakePreview'

type PreviewData = {
  firm: { id: string; name: string; state: string } | null
  lead: {
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
}

export default function IntakeClientPreviewPage() {
  const params = useParams()
  const id = params?.id as string | undefined
  const { firm, loading: authLoading } = useAuth()
  const [data, setData] = useState<PreviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/dashboard/intakes/${id}/client-preview-data`)
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error || 'Failed to load')
        setData(body as PreviewData)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (authLoading || !firm) {
    return <div style={{ padding: '20px' }}>Loading...</div>
  }

  return (
    <div style={{ maxWidth: '900px' }}>
      <div
        role="alert"
        style={{
          marginBottom: '20px',
          padding: '12px 16px',
          background: '#e8f5f0',
          border: '1px solid #208096',
          borderRadius: '6px',
          fontSize: '14px',
          color: '#134252',
        }}
      >
        <strong>Preview of client view</strong> – You are still logged in as {firm.name}. This is read-only. No signing, uploading, or editing as the client.
      </div>

      <div style={{ marginBottom: '16px' }}>
        <Link
          href={`/dashboard/intakes`}
          style={{ color: '#208096', textDecoration: 'none', fontWeight: 600 }}
        >
          ← Back to intakes
        </Link>
      </div>

      {error && (
        <div style={{ background: '#fee', color: '#c0152f', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {loading && <div style={{ padding: '20px', color: '#627c71' }}>Loading…</div>}
      {!loading && data && (
        <ClientIntakePreview firm={data.firm} lead={data.lead} />
      )}
    </div>
  )
}
