'use client'

import Link from 'next/link'
import { DemoProvider } from '@/lib/demo/store'
import { usePathname } from 'next/navigation'
import { DemoDataProvider } from '@/context/DemoDataContext'
import { MobileTopBar, MobileBottomNav } from '@/components/MobileNav'

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
    /** Dev-only payload inspector; safe to remove when AI handoff is productionized */
    { href: '/demo/dev/ai-payloads', label: 'Dev · AI payload' },
  ]

  return (
    <DemoProvider>
      <DemoDataProvider>
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#fcfcf9' }}>
          {/* Sidebar — hidden on mobile, visible on desktop */}
          <aside
            className="hidden lg:flex lg:flex-col lg:flex-shrink-0 w-64"
            style={{
              background: '#134252',
              color: 'white',
              overflowY: 'auto',
            }}
          >
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
                  const selected =
                    pathname === item.href ||
                    (item.label === 'Archive' && pathname?.startsWith('/demo/archive')) ||
                    (item.href === '/demo/dev/ai-payloads' && pathname?.startsWith('/demo/dev'))
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

          {/* Right side column */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
            {/* Mobile top bar */}
            <MobileTopBar isDemo={true} />

            {/* Scrollable content */}
            <main style={{ flex: 1, overflowY: 'auto' }} className="pt-14 pb-16 lg:pt-0 lg:pb-0">
              <div className="px-4 py-6 lg:px-10 lg:py-10" style={{ background: '#fcfcf9', minHeight: '100%' }}>
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

            {/* Mobile bottom nav — OUTSIDE scrollable main, position fixed to viewport */}
            <MobileBottomNav isDemo={true} />
          </div>
        </div>
      </DemoDataProvider>
    </DemoProvider>
  )
}
