// e.g. app/dashboard/settings/page.tsx (server or client component)
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
