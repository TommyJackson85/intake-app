'use client'

import { usePathname } from 'next/navigation'
import Footer from '@/components/Footer'

/**
 * Hide the root footer on surfaces that own their own scroll container + footer:
 * - marketing homepage (own footer)
 * - /demo and /dashboard shells (footer rendered inside the scrollable main)
 *
 * Otherwise the root footer sits outside those 100vh shells and appears stuck to the viewport.
 */
export default function ConditionalFooter() {
  const pathname = usePathname()
  if (!pathname) return null
  if (pathname === '/') return null
  if (pathname === '/demo' || pathname.startsWith('/demo/')) return null
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) return null
  return <Footer />
}
