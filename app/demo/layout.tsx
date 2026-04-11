'use client'

import Link from 'next/link'
import { DemoProvider } from '@/lib/demo/store'
import { usePathname } from 'next/navigation'
import { DemoDataProvider } from '@/context/DemoDataContext'
import { useState, useEffect } from 'react'

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  const navItems = [
    { href: '/demo', label: 'Dashboard' },
    { href: '/demo/matters', label: 'Matters' },
    { href: '/demo/intakes', label: 'Intake/Leads' },
    { href: '/demo/calendar', label: 'Calendar' },
    { href: '/demo/documents', label: 'Documents' },
    { href: '/demo/clients', label: 'Clients' },
    { href: '/demo/archive/matters', label: 'Archive' },
  ]

  return (
    <DemoProvider>
      <DemoDataProvider>
        <div className="flex h-screen overflow-hidden" style={{ background: '#fcfcf9' }}>
          {/* Mobile backdrop */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside
            className={`
              fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
              md:relative md:translate-x-0 md:flex md:flex-col md:flex-shrink-0
            `}
            style={{
              background: '#134252',
              color: 'white',
              overflowY: 'auto',
            }}
          >
            {/* Mobile close button */}
            <button
              className="md:hidden absolute top-4 right-4"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
              style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px' }}
            >
              ✕
            </button>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ marginBottom: '40px', fontSize: '20px', fontWeight: 600 }}>
                <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>
                  ⚖️ LawIntake
                </Link>
                <span
                  style={{
                    display: 'inline-block',
                    marginLeft: '8px',
                    fontSize: '11px',
                    background: '#f0b429',
                    color: '#134252',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 600,
                  }}
                >
                  Demo
                </span>
              </div>

              <nav style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {navItems.map((item) => {
                  const selected = pathname === item.href || (item.label === 'Archive' && pathname?.startsWith('/demo/archive'))
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      style={{
                        color: selected ? '#f0b429' : 'white',
                        textDecoration: 'none',
                        opacity: 1,
                        cursor: 'pointer',
                      }}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </nav>

              <div style={{ marginTop: '30px', fontSize: '12px', color: '#90cfd9' }}>
                Matters &amp; FinCEN cert state persist in this browser (localStorage). Clear site data to reset.
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                <Link href="/auth/signup" style={{ color: '#f0b429', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
                  Create your account
                </Link>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto">
            {/* Mobile header with hamburger */}
            <div className="md:hidden sticky top-0 z-30 flex items-center px-4 py-3" style={{ background: '#134252' }}>
              <button
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', lineHeight: 1 }}
              >
                ☰
              </button>
              <span style={{ color: 'white', fontWeight: 600, fontSize: '18px', marginLeft: '12px' }}>⚖️ LawIntake</span>
            </div>

            <div className="px-4 py-6 md:px-10 md:py-10" style={{ background: '#fcfcf9', minHeight: '100%' }}>
              <div
                role="alert"
                style={{
                  marginBottom: '20px',
                  padding: '14px 16px',
                  border: '1px solid #f0b429',
                  borderRadius: '8px',
                  background: '#fff8e6',
                  color: '#134252',
                }}
              >
                <strong>You are in demo mode.</strong> Data is fake. Matters and FinCEN certification state persist in
                your browser (localStorage) until you clear site data. No real client data is sent to a server.
              </div>
              {children}
            </div>
          </main>
        </div>
      </DemoDataProvider>
    </DemoProvider>
  )
}
