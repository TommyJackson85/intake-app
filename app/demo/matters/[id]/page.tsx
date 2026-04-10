import Link from 'next/link'
import { redirect } from 'next/navigation'

import { demoSeedData } from '@/lib/demo/demoData'

export default function DemoMatterByIdPage({ params }: { params: { id: string } }) {
  const fileId = params.id

  const match = demoSeedData.matters.find((m) => m.file_id === fileId)

  if (match) {
    redirect(`/demo/matters?matter=${encodeURIComponent(fileId)}`)
  }

  return (
    <div style={{ background: 'white', border: '1px solid rgba(94,82,64,0.2)', borderRadius: '8px', padding: '20px' }}>
      <h2 style={{ marginTop: 0 }}>Matter not found in demo</h2>
      <p style={{ marginTop: 0, color: '#627c71' }}>That file reference doesn&apos;t exist in this demo dataset.</p>
      <Link href="/demo/matters" style={{ color: '#208096', textDecoration: 'none', fontWeight: 800 }}>
        Back to matters
      </Link>
    </div>
  )
}

