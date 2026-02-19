import { redirect } from 'next/navigation'
import { getCurrentUserServer } from '@/lib/server/current-user'
import { needsTermsAcceptance } from '@/lib/terms-config'

export default async function PostLoginPage() {
  let current = null
  try {
    current = await getCurrentUserServer()
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'PROFILE_NOT_FOUND') {
      console.error('[post-login] PROFILE_NOT_FOUND, redirecting to signin')
      redirect('/auth/signin')
    }
    throw e
  }

  if (!current) redirect('/auth/signin')

  const profile = current.profile as any

  // 1) Terms acceptance (highest priority)
  if (needsTermsAcceptance(profile.terms_version, profile.terms_accepted_at)) {
    redirect('/auth/accept-terms')
  }

  // 2) Role-based home
  const role = (profile.role ?? 'lawyer') as string
  if (role === 'client') {
    redirect('/portal')
  }

  // 3) Firm onboarding for law-firm users
  if (!profile.firm_id) {
    redirect('/dashboard/firm-setup')
  }

  redirect('/dashboard')
}

