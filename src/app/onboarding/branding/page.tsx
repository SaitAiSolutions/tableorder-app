import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentBusiness } from '@/lib/actions/business.actions'
import { BrandingForm } from './branding-form'

export default async function BrandingPage() {
  const { data: business } = await getCurrentBusiness()
  if (!business) redirect('/onboarding')

  return (
    <div className="min-h-screen bg-[#f6f3ee] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[28px] border border-[#ebe5dd] bg-white p-8 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <div className="inline-flex rounded-full bg-[#f3ece4] px-4 py-1.5 text-sm font-medium text-[#7b6657]">
            Branding
          </div>

          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-gray-900">
            Κάν’ το να δείχνει επαγγελματικό
          </h1>

          <p className="mt-4 text-base leading-7 text-[#6f6156]">
            Πρόσθεσε λογότυπο και βασικά στοιχεία εμφάνισης. Μπορείς να τα
            αλλάξεις αργότερα από τις ρυθμίσεις.
          </p>

          <div className="mt-8 space-y-4">
            <div className="rounded-2xl border border-[#e8ddd2] bg-[#fcfaf7] p-4 opacity-80">
              <p className="text-sm font-semibold text-gray-900">Βήμα 1</p>
              <p className="mt-1 text-sm text-[#7b6657]">
                Στοιχεία επιχείρησης ολοκληρώθηκαν.
              </p>
            </div>

            <div className="rounded-2xl border border-[#e8ddd2] bg-[#fcfaf7] p-4">
              <p className="text-sm font-semibold text-gray-900">Βήμα 2</p>
              <p className="mt-1 text-sm text-[#7b6657]">
                Logo και εμφάνιση για το κατάστημά σου.
              </p>
            </div>

            <div className="rounded-2xl border border-[#e8ddd2] bg-[#fcfaf7] p-4 opacity-80">
              <p className="text-sm font-semibold text-gray-900">Βήμα 3</p>
              <p className="mt-1 text-sm text-[#7b6657]">
                Quick setup με τραπέζια, menu και επόμενα βήματα.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-[#ebe5dd] bg-white p-8 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <div className="mb-8">
            <div className="flex items-center gap-2">
              <div className="h-2 w-full rounded-full bg-[#1f2937]" />
              <div className="h-2 w-full rounded-full bg-[#1f2937]" />
              <div className="h-2 w-full rounded-full bg-[#e7ddd3]" />
            </div>
            <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-[#8b715d]">
              Βήμα 2 από 3 — Εμφάνιση
            </p>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
            Εμφάνιση επιχείρησης
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#7b6657]">
            Προαιρετικό βήμα. Αν θέλεις, μπορείς να το κάνεις αργότερα.
          </p>

          <div className="mt-8">
            <BrandingForm businessId={business.id} />
          </div>

          <div className="mt-6">
            <Link
              href="/onboarding/ready"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-[#1f2937] px-5 py-3 text-sm font-semibold text-white hover:bg-[#111827]"
            >
              Συνέχεια στο quick setup
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}