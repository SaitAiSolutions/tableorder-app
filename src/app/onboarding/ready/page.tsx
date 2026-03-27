import { redirect } from 'next/navigation'
import { getCurrentBusiness } from '@/lib/actions/business.actions'
import OnboardingReadyPageClient from './ready-client'

export default async function OnboardingReadyPage() {
  const { data: business } = await getCurrentBusiness()
  if (!business) redirect('/onboarding')

  return (
    <OnboardingReadyPageClient
      businessName={business.name}
      businessSlug={business.slug}
    />
  )
}