'use client'

import { usePathname } from 'next/navigation'
import Footer from '@/components/Footer'

/** Hide the app chrome footer on the marketing homepage (which has its own footer). */
export default function ConditionalFooter() {
  const pathname = usePathname()
  if (pathname === '/') return null
  return <Footer />
}
