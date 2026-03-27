import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentBusiness } from '@/lib/actions/business.actions'

export default async function OnboardingReadyPage() {
  const { data: business } = await getCurrentBusiness()
  if (!business) redirect('/onboarding')

  return (
    <div className="min-h-screen bg-[#f6f3ee] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="rounded-[28px] border border-[#ebe5dd] bg-white p-8 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <div className="mb-8">
            <div className="flex items-center gap-2">
              <div className="h-2 w-full rounded-full bg-[#1f2937]" />
              <div className="h-2 w-full rounded-full bg-[#1f2937]" />
              <div className="h-2 w-full rounded-full bg-[#1f2937]" />
            </div>
            <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-[#8b715d]">
              Βήμα 3 από 3 — Quick setup
            </p>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            Η επιχείρησή σου είναι έτοιμη
          </h1>

          <p className="mt-3 max-w-3xl text-base leading-7 text-[#6f6156]">
            Η βάση έχει στηθεί. Τώρα το μόνο που μένει είναι να περάσεις τραπέζια,
            menu και να ξεκινήσεις να δέχεσαι παραγγελίες.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-[24px] border border-[#ebe5dd] bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#8b715d]">
              1ο βήμα
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900">
              Πρόσθεσε τραπέζια
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#7b6657]">
              Δημιούργησε τα τραπέζια του καταστήματος ώστε να μπορείς μετά να
              χρησιμοποιήσεις QR links για κάθε τραπέζι.
            </p>

            <div className="mt-6">
              <Link
                href="/dashboard/tables"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-[#1f2937] px-5 py-3 text-sm font-semibold text-white hover:bg-[#111827]"
              >
                Πήγαινε στα τραπέζια
              </Link>
            </div>
          </div>

          <div className="rounded-[24px] border border-[#ebe5dd] bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#8b715d]">
              2ο βήμα
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900">
              Φτιάξε το menu
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#7b6657]">
              Πρόσθεσε κατηγορίες, προϊόντα, επιλογές και διαθεσιμότητα για να
              είναι έτοιμο το customer ordering flow.
            </p>

            <div className="mt-6">
              <Link
                href="/dashboard/menu"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-[#1f2937] px-5 py-3 text-sm font-semibold text-white hover:bg-[#111827]"
              >
                Πήγαινε στο menu
              </Link>
            </div>
          </div>

          <div className="rounded-[24px] border border-[#ebe5dd] bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#8b715d]">
              3ο βήμα
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900">
              Ξεκίνα από το dashboard
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#7b6657]">
              Μπες στο dashboard για να δεις συνολική εικόνα επιχείρησης,
              παραγγελιών, billing και επόμενων ενεργειών.
            </p>

            <div className="mt-6">
              <Link
                href="/dashboard"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-[#1f2937] px-5 py-3 text-sm font-semibold text-white hover:bg-[#111827]"
              >
                Άνοιγμα dashboard
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-[#e8ddd2] bg-[#fcfaf7] p-6 shadow-[0_6px_20px_rgba(15,23,42,0.04)]">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#8b715d]">
            Business info
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
            {business.name}
          </h3>
          <p className="mt-2 text-sm text-[#7b6657]">
            Menu link slug: <span className="font-medium text-gray-900">/menu/{business.slug}</span>
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center justify-center rounded-2xl border border-[#d8cdc1] bg-white px-5 py-3 text-sm font-semibold text-[#5f5146] hover:bg-[#f8f3ee]"
            >
              Ρυθμίσεις επιχείρησης
            </Link>

            <Link
              href="/dashboard/billing"
              className="inline-flex items-center justify-center rounded-2xl border border-[#d8cdc1] bg-white px-5 py-3 text-sm font-semibold text-[#5f5146] hover:bg-[#f8f3ee]"
            >
              Billing
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}