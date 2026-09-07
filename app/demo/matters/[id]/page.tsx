import { notFound } from 'next/navigation'

import DemoMatterDetailRedirect from '@/app/demo/matters/[id]/DemoMatterDetailRedirect'
import {
  findDemoMatterByDetailParam,
  getDemoMatterDetailStaticParams,
} from '@/lib/demo/demoMatterDetailRoutes'

/**
 * Pre-render every seeded demo matter detail URL for static export / GitHub Pages.
 * Unknown IDs are not generated (`dynamicParams = false`) so direct loads 404 safely.
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
  const matter = findDemoMatterByDetailParam(id)

  if (!matter) {
    notFound()
  }

  return <DemoMatterDetailRedirect fileId={matter.file_id} />
}
