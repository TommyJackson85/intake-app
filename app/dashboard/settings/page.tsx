'use client'

import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

export function FirmExportButton() {
  const handleExport = async () => {
    const res = await fetch('/api/gdpr/export', {
      method: 'GET',
      headers: {},
    })

    if (!res.ok) {
      const body = await res.json().catch(() => null)
      alert(body?.error || 'Export failed')
      return
    }

    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = res.headers
      .get('Content-Disposition')
      ?.split('filename=')[1]
      ?.replace(/"/g, '') || `gdpr-export-${Date.now()}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="btn btn-outline"
    >
      Download full firm export (JSON)
    </button>
  )
}

export default function SettingsPage() {
  const { profile, firm } = useAuth()
  const hasFirm = Boolean(profile?.firm_id)
  const isDemoFirm = Boolean((firm as { is_demo_firm?: boolean } | null)?.is_demo_firm)

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your firm settings and data</p>
        {isDemoFirm && (
          <div style={{ marginTop: '12px', padding: '12px 16px', background: '#fff8e6', border: '1px solid #f0b429', borderRadius: '6px', fontSize: '14px', color: '#134252' }}>
            <strong>Settings are limited in demo mode.</strong> Register your own firm to unlock full configuration, billing, and user management.
          </div>
        )}
      </div>

      <div className="settings-section">
        <div className="settings-card">
          <h2>Data Export (GDPR)</h2>
          <p>Download all your firm&apos;s data in JSON format for compliance or backup.</p>
          {hasFirm ? (
            <FirmExportButton />
          ) : (
            <p style={{ color: '#627c71', marginTop: '8px' }}>
              <Link href="/dashboard/register-firm" style={{ color: '#208096' }}>Register your law firm</Link> to unlock firm data export.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}