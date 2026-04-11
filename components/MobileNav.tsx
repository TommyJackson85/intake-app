'use client'

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

/* ─── Top bar ───────────────────────────────────────────────────── */
export function MobileTopBar({ firmName }: { firmName?: string }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 md:hidden flex items-center justify-between px-4 py-3 bg-teal-800 text-white shadow-md">
      <span className="font-bold text-lg tracking-tight">⚖️ LawIntake</span>
      {firmName && (
        <span className="text-xs text-teal-200 truncate max-w-[150px]">{firmName}</span>
      )}
      <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-sm font-semibold">
        L
      </div>
    </header>
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-200 shadow-lg">
      <div className="flex justify-around items-center py-1">
        {links.map((link) => {
          const isActive =
            link.href === base
              ? pathname === base
              : pathname === link.href || pathname.startsWith(link.href + '/')
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
                isActive ? 'text-teal-700' : 'text-gray-500 hover:text-teal-600'
              }`}
            >
              <span className={`w-5 h-5 ${isActive ? 'text-teal-700' : 'text-gray-400'}`}>
                {link.icon}
              </span>
              <span
                className={`text-[10px] font-medium ${
                  isActive ? 'text-teal-700' : 'text-gray-500'
                }`}
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
