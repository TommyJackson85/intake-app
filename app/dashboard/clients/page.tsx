'use client'

import { useAuth } from '@/lib/auth-context'
import { useEffect, useState } from 'react'
import { createBrowserSubabaseClient } from '@/lib/browserClient'

interface Client {
  id: string
  full_name: string
  email: string
  phone: string | null
  kyc_status: string
  created_at: string
}

export default function ClientsPage() {
  const { profile } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserSubabaseClient()

  useEffect(() => {
    const loadClients = async () => {
      if (!profile?.firm_id) return

      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('firm_id', profile.firm_id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setClients(data || [])
      } catch (error) {
        console.error('Failed to load clients:', error)
      } finally {
        setLoading(false)
      }
    }

    loadClients()
  }, [profile?.firm_id, supabase])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px' }}>Clients</h1>
        <a
          href="/dashboard/clients/new"
          style={{
            background: '#208096',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          + Add Client
        </a>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
      ) : clients.length === 0 ? (
        <div
          style={{
            background: 'white',
            padding: '40px',
            borderRadius: '8px',
            textAlign: 'center',
            border: '1px solid rgba(94, 82, 64, 0.2)',
          }}
        >
          <p style={{ color: '#627c71', marginBottom: '20px' }}>No clients yet.</p>
          <a
            href="/dashboard/clients/new"
            style={{
              display: 'inline-block',
              background: '#208096',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Create Your First Client
          </a>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '8px', border: '1px solid rgba(94, 82, 64, 0.2)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fcfcf9', borderBottom: '1px solid rgba(94, 82, 64, 0.2)' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Email</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>KYC Status</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Date Added</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} style={{ borderBottom: '1px solid rgba(94, 82, 64, 0.2)' }}>
                  <td style={{ padding: '16px' }}>
                    <a href={`/dashboard/clients/${client.id}`} style={{ color: '#208096', fontWeight: 600, textDecoration: 'none' }}>
                      {client.full_name}
                    </a>
                  </td>
                  <td style={{ padding: '16px' }}>{client.email}</td>
                  <td style={{ padding: '16px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: client.kyc_status === 'approved' ? '#e8f5f0' : client.kyc_status === 'flagged' ? '#fee' : '#f5f5f5',
                        color: client.kyc_status === 'approved' ? '#208096' : client.kyc_status === 'flagged' ? '#c0152f' : '#627c71',
                      }}
                    >
                      {client.kyc_status}
                    </span>
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#627c71' }}>
                    {new Date(client.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}