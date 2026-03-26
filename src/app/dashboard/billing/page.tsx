import Link from 'next/link'
import { CheckCircle2, CreditCard, ShieldCheck, Sparkles } from 'lucide-react'
import { getCurrentBusiness } from '@/lib/actions/business.actions'
import { formatTrialEndDate, getTrialStatus } from '@/lib/utils/trial'

export default async function DashboardBillingPage() {
  const { data: business } = await getCurrentBusiness()

  if (!business) return null

  const trial = getTrialStatus(
    business.trial_ends_at,
    business.subscription_status,
  )

  const formattedTrialEndDate = formatTrialEndDate(business.trial_ends_at)

  const planLabel =
    business.subscription_status === 'active'
      ? 'Ενεργή συνδρομή'
      : business.subscription_status === 'trialing'
        ? 'Δωρεάν δοκιμή'
        : 'Μη ενεργή συνδρομή'

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8b715d]">
          Billing
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
          Χρέωση & Συνδρομή
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#7b6657]">
          Δείτε την κατάσταση του trial σας και προχωρήστε σε αναβάθμιση όταν
          είστε έτοιμοι.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-[24px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5efe7] text-[#7c5c46]">
            <Sparkles className="h-5 w-5" />
          </div>
          <p className="text-sm text-[#7b6657]">Κατάσταση</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
            {planLabel}
          </p>
        </div>

        <div className="rounded-[24px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5efe7] text-[#7c5c46]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="text-sm text-[#7b6657]">Trial λήξη</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
            {formattedTrialEndDate ?? '—'}
          </p>
        </div>

        <div className="rounded-[24px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5efe7] text-[#7c5c46]">
            <CreditCard className="h-5 w-5" />
          </div>
          <p className="text-sm text-[#7b6657]">Ημέρες που απομένουν</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
            {trial.isActiveSubscription
              ? '∞'
              : typeof trial.daysLeft === 'number'
                ? trial.daysLeft
                : '—'}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[#ebe5dd] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)] sm:rounded-[28px]">
        <div className="bg-gradient-to-r from-[#1f2937] via-[#2b3442] to-[#7c5c46] px-5 py-7 text-white sm:px-6 sm:py-8 lg:px-8">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/70">
            Plan
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            TableOrder Pro
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
            Ένα απλό πακέτο για καφετέριες και μικρά καταστήματα εστίασης που
            θέλουν QR menu, live παραγγελίες και dashboard διαχείρισης.
          </p>
        </div>

        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
          <div>
            <h4 className="text-xl font-semibold tracking-tight text-gray-900">
              Τι περιλαμβάνει
            </h4>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                'QR menu ανά τραπέζι',
                'Live λήψη παραγγελιών',
                'Dashboard διαχείρισης',
                'Κατηγορίες & προϊόντα',
                'Επιλογές προϊόντων',
                'Διαχείριση τραπεζιών',
                'Διαθεσιμότητα προϊόντων',
                '14ήμερο trial πριν τη χρέωση',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-[#eee5dc] bg-[#faf7f2] px-4 py-3"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2f855a]" />
                  <p className="text-sm text-[#5f5146]">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-[#e8ddd2] bg-[#fcfaf7] p-5 shadow-[0_6px_20px_rgba(15,23,42,0.04)]">
            <p className="text-sm text-[#7b6657]">Τιμή πακέτου</p>
            <div className="mt-2 flex items-end gap-2">
              <p className="text-4xl font-semibold tracking-tight text-gray-900">
                29€
              </p>
              <p className="pb-1 text-sm text-[#7b6657]">/ μήνα</p>
            </div>

            <p className="mt-4 text-sm leading-6 text-[#7b6657]">
              Μπορείτε να ξεκινήσετε με το trial και αργότερα να ενεργοποιήσετε
              τη συνδρομή σας μέσω Stripe checkout.
            </p>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-[#1f2937] px-5 py-3 text-sm font-semibold text-white hover:bg-[#111827]"
              >
                Αναβάθμιση σε πληρωμένο πακέτο
              </button>

              <Link
                href="/dashboard"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-[#d8cdc1] bg-white px-5 py-3 text-sm font-semibold text-[#5f5146] hover:bg-[#f8f3ee]"
              >
                Επιστροφή στο dashboard
              </Link>
            </div>

            <p className="mt-4 text-xs leading-5 text-[#8b715d]">
              Το κουμπί αναβάθμισης είναι προσωρινά placeholder. Στο επόμενο
              βήμα θα το συνδέσουμε με Stripe checkout.
            </p>
          </div>
        </div>
      </div>

      {trial.expired ? (
        <div className="rounded-[24px] border border-[#f1d4d4] bg-[#fff7f7] p-5 text-sm text-[#7f1d1d] shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          Το trial έχει λήξει. Το επόμενο βήμα είναι να συνδέσουμε το κουμπί
          αναβάθμισης με Stripe ώστε να ενεργοποιείται άμεσα η συνδρομή.
        </div>
      ) : null}
    </div>
  )
}