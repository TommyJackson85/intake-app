'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function MattersPage() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !profile?.firm_id) {
      router.replace('/dashboard')
    }
  }, [authLoading, profile?.firm_id, router])

  if (authLoading || !profile?.firm_id) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
  }

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '32px' }}>Matters</h1>
      <p style={{ color: '#627c71' }}>Matters for your firm will appear here.</p>
    </div>
  )
}
