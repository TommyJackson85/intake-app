'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function Home() {
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('test_items')
        .select('*')
      if (!error && data) setItems(data)
    }
    load()
  }, [])

  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold mb-4">Test Items</h1>
      <pre className="text-xs bg-gray-100 p-2 rounded">
        {JSON.stringify(items, null, 2)}
      </pre>
    </main>
  )
}