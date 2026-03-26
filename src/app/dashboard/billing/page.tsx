import Link from 'next/link'
import { CheckCircle2, CreditCard, ShieldCheck, Sparkles } from 'lucide-react'
import { getCurrentBusiness } from '@/lib/actions/business.actions'
import { getTablesWithSessions } from '@/lib/actions/tables.actions'
import { formatTrialEndDate, getTrialStatus } from '@/lib/utils/trial'

function getPlanByTableCount(tableCount: number) {
  if (tableCount <= 15) {
    return {
      name: 'Starter',
      price: 15,
      description: 'Για επιχειρήσεις με έως 15 τραπέζια.',
    }
  }

  if (tableCount <= 25) {
    return {
      name: 'Growth',
      price: 25,
      description: 'Για επιχειρήσεις με 16 έως 25 τραπέζια.',
    }
  }

  return {
    name: 'Pro',
    price: 35,
    description: 'Για επιχειρήσεις με πάνω από 25 τραπέζια.',
  }
}

const plans = [
  {
    name: 'Starter',
    price: 15,
    range: 'Έως 15 τραπέζια',
  },
  {
    name: 'Growth',
    price: 25,
    range: '16–25 τραπέζια',
  },
  {
    name: 'Pro',
    price: 35,
    range: '26+ τραπέζια',
  },
]

export default async function DashboardBillingPage() {
  const { data: business } = await getCurrentBusiness()
  const { data: tables } = await getTablesWithSessions()

  if (!business) return null

  const safeTables = tables ?? []
  const tableCount = safeTables.length

  const trial = getTrialStatus(
    business.trial_ends_at,
    business.subscription_status,
  )

  const formattedTrialEndDate = formatTrialEndDate(business.trial_ends_at)

  const recommendedPlan = getPlanByTableCount(tableCount)

  const planLabel =
    business.subscription_status === 'active'
      ? 'Ενεργή συνδρομή'
      : business.subscription_status === 'trialing'
        ? 'Δωρεάν δοκιμή'
        : business.subscription_status === 'suspended'
          ? 'Ανεσταλμένος λογαριασμός'
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
          Δείτε την κατάσταση του trial σας, το προτεινόμενο πακέτο και την
          πολιτική χρέωσης της εφαρμογής.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
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

        <div className="rounded-[24px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5efe7] text-[#7c5c46]">
            <CreditCard className="h-5 w-5" />
          </div>
          <p className="text-sm text-[#7b6657]">Συνολικά τραπέζια</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
            {tableCount}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[#ebe5dd] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)] sm:rounded-[28px]">
        <div className="bg-gradient-to-r from-[#1f2937] via-[#2b3442] to-[#7c5c46] px-5 py-7 text-white sm:px-6 sm:py-8 lg:px-8">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/70">
            Recommended plan
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {recommendedPlan.name} — {recommendedPlan.price}€/μήνα
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
            {recommendedPlan.description} Με βάση τα σημερινά σας τραπέζια
            ({tableCount}), αυτό είναι το πακέτο που ταιριάζει στην επιχείρησή
            σας.
          </p>
        </div>

        <div className="p-5 sm:p-6 lg:p-8">
          <h4 className="text-xl font-semibold tracking-tight text-gray-900">
            Διαθέσιμα πακέτα
          </h4>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => {
              const active = plan.name === recommendedPlan.name

              return (
                <div
                  key={plan.name}
                  className={
                    active
                      ? 'rounded-[24px] border border-[#1f2937] bg-[#fcfaf7] p-5 shadow-[0_10px_24px_rgba(15,23,42,0.06)]'
                      : 'rounded-[24px] border border-[#e8ddd2] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]'
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h5 className="text-xl font-semibold text-gray-900">
                        {plan.name}
                      </h5>
                      <p className="mt-1 text-sm text-[#7b6657]">{plan.range}</p>
                    </div>

                    {active ? (
                      <span className="rounded-full bg-[#1f2937] px-3 py-1 text-xs font-medium text-white">
                        Προτεινόμενο
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-5 flex items-end gap-2">
                    <p className="text-4xl font-semibold tracking-tight text-gray-900">
                      {plan.price}€
                    </p>
                    <p className="pb-1 text-sm text-[#7b6657]">/ μήνα</p>
                  </div>

                  <div className="mt-5 space-y-3">
                    {[
                      'QR menu ανά τραπέζι',
                      'Live παραγγελίες',
                      'Dashboard διαχείρισης',
                      'Μενού, προϊόντα και επιλογές',
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2f855a]" />
                        <p className="text-sm text-[#5f5146]">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[24px] border border-[#ebe5dd] bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <h4 className="text-xl font-semibold tracking-tight text-gray-900">
            Πολιτική χρέωσης
          </h4>

          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-[#eee5dc] bg-[#faf7f2] px-4 py-3">
              <p className="text-sm font-medium text-gray-900">
                Αυτόματη μηνιαία χρέωση
              </p>
              <p className="mt-1 text-sm text-[#7b6657]">
                Η συνδρομή θα χρεώνεται αυτόματα κάθε μήνα μέσω Stripe.
              </p>
            </div>

            <div className="rounded-2xl border border-[#eee5dc] bg-[#faf7f2] px-4 py-3">
              <p className="text-sm font-medium text-gray-900">
                3 ημέρες προθεσμία αν αποτύχει η πληρωμή
              </p>
              <p className="mt-1 text-sm text-[#7b6657]">
                Αν δεν ολοκληρωθεί η χρέωση, ο πελάτης ενημερώνεται και έχει 3
                ημέρες να τακτοποιήσει την πληρωμή.
              </p>
            </div>

            <div className="rounded-2xl border border-[#eee5dc] bg-[#faf7f2] px-4 py-3">
              <p className="text-sm font-medium text-gray-900">
                Αναστολή λογαριασμού μετά την προθεσμία
              </p>
              <p className="mt-1 text-sm text-[#7b6657]">
                Αν δεν πληρώσει μέσα στις 3 ημέρες, ο λογαριασμός γίνεται
                suspended και η εφαρμογή σταματά να λειτουργεί.
              </p>
            </div>

            <div className="rounded-2xl border border-[#eee5dc] bg-[#faf7f2] px-4 py-3">
              <p className="text-sm font-medium text-gray-900">
                Επανενεργοποίηση μόνο με εξόφληση
              </p>
              <p className="mt-1 text-sm text-[#7b6657]">
                Αν ο πελάτης επιστρέψει αργότερα, θα πρέπει πρώτα να πληρώσει
                τους μήνες που έμειναν απλήρωτοι για να ενεργοποιηθεί ξανά ο
                λογαριασμός.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-[#e8ddd2] bg-[#fcfaf7] p-6 shadow-[0_6px_20px_rgba(15,23,42,0.04)]">
          <p className="text-sm text-[#7b6657]">Προτεινόμενη χρέωση τώρα</p>
          <div className="mt-2 flex items-end gap-2">
            <p className="text-4xl font-semibold tracking-tight text-gray-900">
              {recommendedPlan.price}€
            </p>
            <p className="pb-1 text-sm text-[#7b6657]">/ μήνα</p>
          </div>

          <p className="mt-4 text-sm leading-6 text-[#7b6657]">
            Αυτή είναι η σωστή βαθμίδα για την επιχείρησή σας με βάση τον αριθμό
            τραπεζιών που έχετε δημιουργήσει αυτή τη στιγμή.
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
            Στο επόμενο βήμα θα συνδέσουμε το κουμπί με Stripe checkout και
            αυτόματη χρέωση.
          </p>
        </div>
      </div>
    </div>
  )
}