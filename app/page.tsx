import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import LawIntakeLandingPage from '@/components/marketing/LawIntakeLandingPage'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'LawIntake — Client intake for real estate law',
  description: 'LawIntake is a modern client intake and matter-management workspace for real estate law firms.',
  themeColor: '#0b3f4a',
  openGraph: {
    title: 'LawIntake — Better client intake for real estate law',
    description:
      'Move from first contact to an organized matter with structured intake, AML workflows, and a secure client portal.',
    type: 'website',
    url: 'https://tommyjackson85.github.io/intake-app/',
  },
  alternates: {
    canonical: 'https://tommyjackson85.github.io/intake-app/',
  },
}

export default function Home() {
  return (
    <div className={inter.className}>
      <LawIntakeLandingPage />
    </div>
  )
}
