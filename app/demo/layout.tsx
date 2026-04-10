'use client'

import Link from 'next/link'
import { DemoProvider } from '@/lib/demo/store'
import { usePathname } from 'next/navigation'
import { DemoDataProvider } from '@/context/DemoDataContext'

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

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
        <div style={{ display: 'flex', minHeight: '100vh', background: '#fcfcf9' }}>
          <aside
            style={{
              width: '250px',
              background: '#134252',
              color: 'white',
              padding: '20px',
              position: 'fixed',
              height: '100vh',
              overflowY: 'auto',
            }}
          >
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
        </aside>

        <main
          style={{
            marginLeft: '250px',
            flex: 1,
            padding: '40px',
            background: '#fcfcf9',
          }}
        >
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
          </main>
        </div>
      </DemoDataProvider>
    </DemoProvider>
  )
}
