'use client'

import { useAuth } from '@/lib/auth-context'
import { useEffect, useState } from 'react'
import { createBrowserSubabaseClient } from '@/lib/browserClient'

interface Stats {
  totalClients: number
  totalMatters: number
  pendingAML: number
}

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    totalMatters: 0,
    pendingAML: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserSubabaseClient()

  useEffect(() => {
    const loadStats = async () => {
      if (!profile?.firm_id) return

      try {
        const [clientsRes, mattersRes, amlRes] = await Promise.all([
          supabase
            .from('clients')
            .select('id', { count: 'exact', head: true })
            .eq('firm_id', profile.firm_id),
          supabase
            .from('matters')
            .select('id', { count: 'exact', head: true })
            .eq('firm_id', profile.firm_id),
          supabase
            .from('aml_checks')
            .select('id', { count: 'exact', head: true })
            .eq('firm_id', profile.firm_id)
            .eq('check_status', 'pending'),
        ])

        setStats({
          totalClients: clientsRes.count || 0,
          totalMatters: mattersRes.count || 0,
          pendingAML: amlRes.count || 0,
        })
      } catch (error) {
        console.error('Failed to load stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [profile?.firm_id, supabase])

  return (
    <div>
      <h1 style={{ marginBottom: '40px', fontSize: '32px' }}>Dashboard</h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '40px',
      }}>
        {[
          { label: 'Total Clients', value: loading ? '—' : stats.totalClients },
          { label: 'Active Matters', value: loading ? '—' : stats.totalMatters },
          { label: 'Pending AML Checks', value: loading ? '—' : stats.pendingAML },
        ].map((stat, idx) => (
          <div
            key={idx}
            style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid rgba(94, 82, 64, 0.2)',
            }}
          >
            <div style={{ fontSize: '12px', color: '#627c71', marginBottom: '10px' }}>
              {stat.label}
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#208096' }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid rgba(94, 82, 64, 0.2)',
      }}>
        <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
          <a
            href="/dashboard/matters/new"
            style={{
              background: '#208096',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            + New Matter
          </a>
          <a
            href="/dashboard/aml"
            style={{
              background: 'rgba(94, 82, 64, 0.12)',
              color: '#134252',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Review AML
          </a>
        </div>
      </div>
    </div>
  )
}