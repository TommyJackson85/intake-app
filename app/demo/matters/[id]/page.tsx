import { notFound, redirect } from 'next/navigation'

import {
  findDemoMatterByDetailParam,
  getDemoMatterDetailStaticParams,
  getDemoMatterListDeepLink,
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

  // Valid seeded matters deep-link into the existing matters list modal UX.
  redirect(getDemoMatterListDeepLink(matter.file_id))
}
