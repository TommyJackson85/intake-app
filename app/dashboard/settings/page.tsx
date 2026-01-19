'use client'

export function FirmExportButton() {
  const handleExport = async () => {
    const res = await fetch('/api/gdpr/export', {
      method: 'GET',
      headers: {
        // If you add CSRF protection, include the token here.
      },
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

// DEFAULT EXPORT - Required by Next.js
export default function SettingsPage() {
  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your firm settings and data</p>
      </div>

      <div className="settings-section">
        <div className="settings-card">
          <h2>Data Export (GDPR)</h2>
          <p>Download all your firm's data in JSON format for compliance or backup.</p>
          <FirmExportButton />
        </div>
      </div>
    </div>
  )
}