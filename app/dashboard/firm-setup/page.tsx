'use client'

import { Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'

function FirmSetupContent() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard/register-firm')
  }, [router])
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <p>Redirecting to register firm...</p>
    </div>
  )
}

export default function FirmSetupPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>}>
      <FirmSetupContent />
    </Suspense>
  )
}

