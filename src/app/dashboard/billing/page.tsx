import Link from 'next/link'
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  Sparkles,
  Layers3,
} from 'lucide-react'
import {
  createStripeCheckoutSession,
  createStripePortalSession,
  getCurrentBusiness,
} from '@/lib/actions/business.actions'
import { getTablesWithSessions } from '@/lib/actions/tables.actions'
import { formatTrialEndDate, getTrialStatus } from '@/lib/utils/trial'

function getPlanByTableCount(tableCount: number) {
  if (tableCount <= 15) {
    return {
      key: 'starter',
      name: 'Starter',
      price: 15,
      description: 'Για επιχειρήσεις με έως 15 τραπέζια.',
    }
  }

  if (tableCount <= 25) {
    return {
      key: 'growth',
      name: 'Growth',
      price: 25,
      description: 'Για επιχειρήσεις με 16 έως 25 τραπέζια.',
    }
  }

  return {
    key: 'pro',
    name: 'Pro',
    price: 35,
    description: 'Για επιχειρήσεις με πάνω από 25 τραπέζια.',
  }
}

const plans = [
  {
    key: 'starter',
    name: 'Starter',
    price: 15,
    range: 'Έως 15 τραπέζια',
  },
  {
    key: 'growth',
    name: 'Growth',
    price: 25,
    range: '16–25 τραπέζια',
  },
  {
    key: 'pro',
    name: 'Pro',
    price: 35,
    range: '26+ τραπέζια',
  },
]

function formatMoney(amount: number, currency = 'EUR') {
  return new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

function getSubscriptionPlanLabel(plan?: string | null, billingExempt?: boolean) {
  if (billingExempt) return 'Lifetime / Free access'
  if (plan === 'starter') return 'Starter'
  if (plan === 'growth') return 'Growth'
  if (plan === 'pro') return 'Pro'
  if (plan === 'trial') return 'Trial'
  return '—'
}

function getAccountStatusLabel(
  accountStatus?: string | null,
  subscriptionStatus?: string | null,
  billingExempt?: boolean,
) {
  if (billingExempt) return 'Χωρίς μηνιαία χρέωση'
  if (accountStatus === 'suspended') return 'Ανεσταλμένος λογαριασμός'
  if (subscriptionStatus === 'active') return 'Ενεργή συνδρομή'
  if (subscriptionStatus === 'trialing') return 'Δωρεάν δοκιμή'
  if (subscriptionStatus === 'past_due') return 'Σε καθυστέρηση πληρωμής'
  if (subscriptionStatus === 'unpaid') return 'Ανεξόφλητη συνδρομή'
  return 'Μη ενεργή συνδρομή'
}

function getSubscriptionDetails(
  accountStatus?: string | null,
  subscriptionStatus?: string | null,
  billingExempt?: boolean,
) {
  if (billingExempt) {
    return 'Η επιχείρηση αυτή έχει ενεργοποιημένη πρόσβαση χωρίς μηνιαία χρέωση από super admin.'
  }

  if (accountStatus === 'suspended') {
    return 'Η πρόσβαση έχει περιοριστεί μέχρι να εξοφληθούν οι εκκρεμότητες.'
  }

  if (subscriptionStatus === 'active') {
    return 'Η συνδρομή σας είναι ενεργή και η εφαρμογή λειτουργεί κανονικά.'
  }

  if (subscriptionStatus === 'trialing') {
    return 'Χρησιμοποιείτε τη δωρεάν δοκιμή πριν την ενεργοποίηση συνδρομής.'
  }

  if (subscriptionStatus === 'past_due') {
    return 'Υπάρχει καθυστέρηση πληρωμής. Η πρόσβαση παραμένει προσωρινά ενεργή.'
  }

  if (subscriptionStatus === 'unpaid') {
    return 'Υπάρχουν απλήρωτες χρεώσεις που χρειάζονται τακτοποίηση.'
  }

  return 'Δεν υπάρχει ενεργή πληρωμένη συνδρομή αυτή τη στιγμή.'
}

export default async function DashboardBillingPage() {
  const { data: business } = await getCurrentBusiness()
  const { data: tables } = await getTablesWithSessions()

  if (!business) return null

  const businessAny = business as any
  const safeTables = tables ?? []
  const tableCount = safeTables.length
  const billingExempt = Boolean(businessAny.billing_exempt)

  const trial = getTrialStatus(
    business.trial_ends_at,
    business.subscription_status,
  )

  const formattedTrialEndDate = formatTrialEndDate(business.trial_ends_at)
  const recommendedPlan = getPlanByTableCount(tableCount)
  const currentPlanLabel = getSubscriptionPlanLabel(
    business.subscription_plan,
    billingExempt,
  )
  const hasStripeCustomer = !!businessAny.stripe_customer_id
  const hasActiveSubscription = business.subscription_status === 'active'

  const outstandingBalance = Number(businessAny.outstanding_balance ?? 0)
  const hasOutstandingBalance = outstandingBalance > 0 && !billingExempt

  const isSuspended = business.account_status === 'suspended' && !billingExempt
  const isPastDue =
    (business.subscription_status === 'past_due' ||
      business.account_status === 'grace_period') &&
    !billingExempt

  const gracePeriodEndsAt = businessAny.grace_period_ends_at
    ? new Date(businessAny.grace_period_ends_at).toLocaleDateString('el-GR')
    : null

  const accountStatusLabel = getAccountStatusLabel(
    business.account_status,
    business.subscription_status,
    billingExempt,
  )

  const subscriptionDetails = getSubscriptionDetails(
    business.account_status,
    business.subscription_status,
    billingExempt,
  )

  const recommendedDiffersFromCurrent =
    !billingExempt &&
    business.subscription_plan &&
    business.subscription_plan !== 'trial' &&
    business.subscription_plan !== recommendedPlan.key

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
          Δείτε την κατάσταση του trial σας, το τρέχον πακέτο, το προτεινόμενο
          πακέτο και την πολιτική χρέωσης της εφαρμογής.
        </p>
      </div>

      {billingExempt ? (
        <div className="rounded-[24px] border border-[#cfe7d5] bg-[#f4fbf6] p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#dff2e5] text-[#26734d]">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#26734d]">
                Free / Lifetime access
              </p>
              <h3 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
                Η επιχείρηση λειτουργεί χωρίς μηνιαία χρέωση
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#5f6f63]">
                Το billing έχει εξαιρεθεί από super admin. Δεν απαιτείται ενεργή
                μηνιαία Stripe συνδρομή για να συνεχίσει να λειτουργεί η εφαρμογή.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {hasOutstandingBalance ? (
        <div className="rounded-[24px] border border-[#f3d2bf] bg-[#fff8f3] p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fde6d8] text-[#b45309]">
              <AlertTriangle className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#b45309]">
                Υπάρχει οφειλή
              </p>
              <h3 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
                Οφειλή {formatMoney(outstandingBalance, business.currency ?? 'EUR')}
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#7b6657]">
                Υπάρχουν ανοιχτά invoices στο Stripe. Για να συνεχιστεί κανονικά η
                πρόσβαση, θα πρέπει να εξοφληθούν μέσα από το Customer Portal.
              </p>

              {isPastDue && gracePeriodEndsAt ? (
                <p className="mt-2 text-sm font-medium text-[#9a3412]">
                  Προθεσμία πληρωμής έως: {gracePeriodEndsAt}
                </p>
              ) : null}

              {isSuspended ? (
                <p className="mt-2 text-sm font-medium text-red-700">
                  Ο λογαριασμός είναι προσωρινά ανεσταλμένος μέχρι να εξοφληθούν οι
                  οφειλές.
                </p>
              ) : null}

              <div className="mt-4">
                <form action={createStripePortalSession}>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-2xl bg-[#1f2937] px-5 py-3 text-sm font-semibold text-white hover:bg-[#111827]"
                  >
                    Άνοιγμα Customer Portal για πληρωμή
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-[24px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5efe7] text-[#7c5c46]">
            <Sparkles className="h-5 w-5" />
          </div>
          <p className="text-sm text-[#7b6657]">Κατάσταση</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
            {accountStatusLabel}
          </p>
          <p className="mt-2 text-xs leading-5 text-[#8b715d]">
            {subscriptionDetails}
          </p>
        </div>

        <div className="rounded-[24px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5efe7] text-[#7c5c46]">
            <Layers3 className="h-5 w-5" />
          </div>
          <p className="text-sm text-[#7b6657]">Τρέχον πακέτο</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
            {currentPlanLabel}
          </p>
          <p className="mt-2 text-xs leading-5 text-[#8b715d]">
            {billingExempt
              ? 'Η επιχείρηση αυτή έχει εξαιρεθεί από τη μηνιαία χρέωση.'
              : 'Αυτό είναι το πακέτο που είναι αποθηκευμένο τώρα στον λογαριασμό.'}
          </p>
        </div>

        <div className="rounded-[24px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5efe7] text-[#7c5c46]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="text-sm text-[#7b6657]">Trial λήξη</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
            {billingExempt ? 'Δεν απαιτείται' : formattedTrialEndDate ?? '—'}
          </p>
        </div>

        <div className="rounded-[24px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5efe7] text-[#7c5c46]">
            <CreditCard className="h-5 w-5" />
          </div>
          <p className="text-sm text-[#7b6657]">
            {billingExempt ? 'Πρόσβαση' : 'Υπόλοιπο trial'}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
            {billingExempt
              ? 'Free access'
              : trial.isActiveSubscription
                ? 'Ενεργή συνδρομή'
                : typeof trial.daysLeft === 'number'
                  ? `${trial.daysLeft} ημέρες`
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
            ({tableCount}), αυτό είναι το προτεινόμενο πακέτο για την επιχείρησή
            σας.
          </p>

          {recommendedDiffersFromCurrent ? (
            <div className="mt-4 inline-flex rounded-2xl bg-white/10 px-4 py-2 text-sm text-white">
              Τρέχον πακέτο: {currentPlanLabel} · Προτεινόμενο: {recommendedPlan.name}
            </div>
          ) : null}
        </div>

        <div className="p-5 sm:p-6 lg:p-8">
          <h4 className="text-xl font-semibold tracking-tight text-gray-900">
            Διαθέσιμα πακέτα
          </h4>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => {
              const isRecommended = plan.name === recommendedPlan.name
              const isCurrent =
                !billingExempt &&
                business.subscription_plan &&
                business.subscription_plan !== 'trial' &&
                business.subscription_plan === plan.key

              return (
                <div
                  key={plan.name}
                  className={
                    isRecommended
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

                    <div className="flex flex-col items-end gap-2">
                      {isRecommended ? (
                        <span className="rounded-full bg-[#1f2937] px-3 py-1 text-xs font-medium text-white">
                          Προτεινόμενο
                        </span>
                      ) : null}

                      {isCurrent ? (
                        <span className="rounded-full bg-[#e7f6ea] px-3 py-1 text-xs font-medium text-[#26734d]">
                          Τρέχον
                        </span>
                      ) : null}
                    </div>
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

          {hasOutstandingBalance ? (
            <div className="mt-4 rounded-2xl border border-[#f3d2bf] bg-white px-4 py-3">
              <p className="text-sm font-medium text-[#9a3412]">
                Εκκρεμεί οφειλή {formatMoney(outstandingBalance, business.currency ?? 'EUR')}
              </p>
              <p className="mt-1 text-xs leading-5 text-[#8b715d]">
                Η επανενεργοποίηση γίνεται αφού εξοφληθούν όλα τα ανοιχτά invoices.
              </p>
            </div>
          ) : null}

          {billingExempt ? (
            <div className="mt-4 rounded-2xl border border-[#cfe7d5] bg-white px-4 py-3">
              <p className="text-sm font-medium text-[#26734d]">
                Billing exempt / Lifetime access
              </p>
              <p className="mt-1 text-xs leading-5 text-[#5f6f63]">
                Αυτή η επιχείρηση εξαιρείται από τις μηνιαίες χρεώσεις.
              </p>
            </div>
          ) : null}

          <div className="mt-4 rounded-2xl border border-[#e8ddd2] bg-white px-4 py-3">
            <p className="text-sm text-[#7b6657]">Τρέχον αποθηκευμένο πακέτο</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {currentPlanLabel}
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {billingExempt ? null : hasActiveSubscription ? (
              <form action={createStripePortalSession}>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-[#1f2937] px-5 py-3 text-sm font-semibold text-white hover:bg-[#111827]"
                >
                  Διαχείριση συνδρομής & κάρτας
                </button>
              </form>
            ) : (
              <form action={createStripeCheckoutSession}>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-[#1f2937] px-5 py-3 text-sm font-semibold text-white hover:bg-[#111827]"
                >
                  Αναβάθμιση σε πληρωμένο πακέτο
                </button>
              </form>
            )}

            {!billingExempt && hasStripeCustomer ? (
              <form action={createStripePortalSession}>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-[#d8cdc1] bg-white px-5 py-3 text-sm font-semibold text-[#5f5146] hover:bg-[#f8f3ee]"
                >
                  Άνοιγμα Customer Portal
                </button>
              </form>
            ) : null}

            <Link
              href="/dashboard"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-[#d8cdc1] bg-white px-5 py-3 text-sm font-semibold text-[#5f5146] hover:bg-[#f8f3ee]"
            >
              Επιστροφή στο dashboard
            </Link>
          </div>

          <p className="mt-4 text-xs leading-5 text-[#8b715d]">
            {billingExempt
              ? 'Η επιχείρηση αυτή λειτουργεί χωρίς ενεργή Stripe χρέωση λόγω admin εξαίρεσης.'
              : 'Με το Stripe Customer Portal ο πελάτης μπορεί να ενημερώνει κάρτα, να βλέπει invoices και να εξοφλεί τυχόν οφειλές.'}
          </p>
        </div>
      </div>
    </div>
  )
}