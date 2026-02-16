import type { Metadata } from 'next'
import { AuthProvider } from '@/lib/auth-context'
import Footer from '@/components/Footer'
import './globals.css'

export const metadata: Metadata = {
  title: 'LawIntake - Client Intake for Real Estate Lawyers',
  description: 'GDPR-compliant client intake software built for Florida real estate lawyers.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AuthProvider>
          <div style={{ flex: 1 }}>
            {children}
          </div>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
