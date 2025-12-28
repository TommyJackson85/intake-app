'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { session, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !session) {
      router.push('/auth/login')
    }
  }, [session, loading, router])

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
  }

  if (!session) {
    return null
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: '250px',
        background: '#134252',
        color: 'white',
        padding: '20px',
        position: 'fixed',
        height: '100vh',
        overflowY: 'auto',
      }}>
        <div style={{ marginBottom: '40px', fontSize: '20px', fontWeight: 600 }}>⚖️ LawIntake</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <a href="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>Dashboard</a>
          <a href="/dashboard/clients" style={{ color: 'white', textDecoration: 'none' }}>Clients</a>
          <a href="/dashboard/matters" style={{ color: 'white', textDecoration: 'none' }}>Matters</a>
          <a href="/dashboard/aml" style={{ color: 'white', textDecoration: 'none' }}>AML Checks</a>
          <a href="/dashboard/settings" style={{ color: 'white', textDecoration: 'none' }}>Settings</a>
        </nav>
        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <a href="/auth/logout" style={{ color: '#90cfd9', textDecoration: 'none', fontSize: '14px' }}>Sign Out</a>
        </div>
      </aside>

      {/* Main content */}
      <main style={{
        marginLeft: '250px',
        flex: 1,
        padding: '40px',
        background: '#fcfcf9',
      }}>
        {children}
      </main>
    </div>
  )
}