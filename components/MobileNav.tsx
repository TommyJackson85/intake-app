'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

/* ─── Inline SVG icons (Heroicons-style, outline) ──────────────── */
function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="20" height="20" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="20" height="20" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  )
}

function InboxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="20" height="20" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="20" height="20" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="20" height="20" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="20" height="20" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}

/* ─── Top bar with burger menu ─────────────────────────────────── */
export function MobileTopBar({ firmName, isDemo = false }: { firmName?: string; isDemo?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const base = isDemo ? '/demo' : '/dashboard'

  const secondaryLinks = isDemo
    ? [{ href: `${base}/archive/matters`, label: 'Archive' }]
    : [
        { href: `${base}/aml`, label: 'AML Compliance' },
        { href: `${base}/billing`, label: 'Billing' },
        { href: `${base}/settings`, label: 'Settings' },
      ]

  return (
    <>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          backgroundColor: '#0f766e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          color: 'white',
        }}
        className="md:hidden shadow-md"
      >
        {/* Burger button — left */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
          aria-label="Open menu"
        >
          <span style={{ display: 'block', width: '20px', height: '2px', backgroundColor: 'white', borderRadius: '2px' }} />
          <span style={{ display: 'block', width: '20px', height: '2px', backgroundColor: 'white', borderRadius: '2px' }} />
          <span style={{ display: 'block', width: '20px', height: '2px', backgroundColor: 'white', borderRadius: '2px' }} />
        </button>

        {/* Logo — centre */}
        <span style={{ fontWeight: 700, fontSize: '18px', letterSpacing: '-0.5px' }}>LawIntake</span>

        {/* Profile avatar — right */}
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          L
        </div>
      </header>

      {/* Dropdown menu */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setMenuOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 48, backgroundColor: 'rgba(0,0,0,0.3)' }}
            className="md:hidden"
          />
          {/* Menu panel — slides down from top bar */}
          <div
            style={{
              position: 'fixed',
              top: '56px',
              left: 0,
              right: 0,
              zIndex: 49,
              backgroundColor: '#0f766e',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
            className="md:hidden"
          >
            {secondaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'block',
                  padding: '14px 20px',
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '15px',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  textDecoration: 'none',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  )
}

/* ─── Bottom nav ────────────────────────────────────────────────── */
export function MobileBottomNav({ isDemo = false }: { isDemo?: boolean }) {
  const pathname = usePathname()
  const base = isDemo ? '/demo' : '/dashboard'

  const links = [
    { href: base, label: 'Home', icon: <HomeIcon /> },
    { href: `${base}/matters`, label: 'Matters', icon: <FolderIcon /> },
    { href: `${base}/intakes`, label: 'Intakes', icon: <InboxIcon /> },
    { href: `${base}/calendar`, label: 'Calendar', icon: <CalendarIcon /> },
    { href: `${base}/documents`, label: 'Docs', icon: <DocumentIcon /> },
    { href: `${base}/clients`, label: 'Clients', icon: <UsersIcon /> },
  ]

  return (
    <nav
      className="md:hidden"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: '#0f766e',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.2)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '4px 0' }}>
        {links.map((link) => {
          const isActive =
            link.href === base
              ? pathname === base
              : pathname === link.href || pathname.startsWith(link.href + '/')
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                padding: '4px 8px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: isActive ? 'white' : '#99f6e4',
                backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                transition: 'color 0.15s, background-color 0.15s',
              }}
            >
              <span style={{ width: '20px', height: '20px', color: isActive ? 'white' : '#99f6e4' }}>
                {link.icon}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 500,
                  color: isActive ? 'white' : '#99f6e4',
                }}
              >
                {link.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
