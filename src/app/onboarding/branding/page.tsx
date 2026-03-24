import { redirect } from 'next/navigation'
import { getCurrentBusiness } from '@/lib/actions/business.actions'
import { BrandingForm } from './branding-form'

export default async function BrandingPage() {
  const { data: business } = await getCurrentBusiness()
  if (!business) redirect('/onboarding')

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <div className="h-2 w-full rounded-full bg-gray-900" />
            <div className="h-2 w-full rounded-full bg-gray-900" />
          </div>
          <p className="mt-2 text-xs text-gray-500">Βήμα 2 από 2 — Εμφάνιση</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">Εμφάνιση επιχείρησης</h1>
          <p className="mt-1 text-sm text-gray-500">
            Προαιρετικά. Μπορείτε να τα αλλάξετε αργότερα από τις Ρυθμίσεις.
          </p>
          <BrandingForm businessId={business.id} />
        </div>
      </div>
    </div>
  )
}