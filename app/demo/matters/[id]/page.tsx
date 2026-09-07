import { notFound } from 'next/navigation'

import DemoMatterDetailRedirect from '@/app/demo/matters/[id]/DemoMatterDetailRedirect'
import {
  findDemoMatterByDetailParam,
  getDemoMatterDetailStaticParams,
} from '@/lib/demo/demoMatterDetailRoutes'
import { shouldNotFoundDemoMatterParam } from '@/lib/demo/demoMattersFallback'

/**
 * Pre-render every seeded demo matter detail URL for static export / GitHub Pages.
 * Unknown IDs are not generated (`dynamicParams = false`) so direct loads hit the
 * nearest not-found UI (`app/not-found.tsx` / segment `not-found.tsx`).
 * When the page does run with a blank/unresolved id, `notFound()` renders the
 * segment fallback.
 */
export function generateStaticParams() {
  return getDemoMatterDetailStaticParams()
}

export const dynamicParams = false

type DemoMatterByIdPageProps = {
  params: Promise<{ id: string }> | { id: string }
}

export default async function DemoMatterByIdPage({ params }: DemoMatterByIdPageProps) {
  const resolved = await Promise.resolve(params)
  const id = typeof resolved?.id === 'string' ? resolved.id : ''

  if (shouldNotFoundDemoMatterParam(id, findDemoMatterByDetailParam)) {
    notFound()
  }

  const matter = findDemoMatterByDetailParam(id)
  if (!matter) {
    notFound()
  }

  return <DemoMatterDetailRedirect fileId={matter.file_id} />
}
