import { redirect } from 'next/navigation'
import { AlertTriangle, CreditCard, Lock } from 'lucide-react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Topbar } from '@/components/dashboard/topbar'
import {
  createStripePortalSession,
  getCurrentBusiness,
} from '@/lib/actions/business.actions'
import { createClient } from '@/lib/supabase/server'
import { isTrialExpired } from '@/lib/utils/trial'

function formatMoney(amount: number, currency = 'EUR') {
  return new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: business } = await getCurrentBusiness()
  if (!business) redirect('/onboarding')

  const trialEndsAt = business.trial_ends_at as string | null | undefined
  const expired = isTrialExpired(trialEndsAt)

  const isSuspended = business.account_status === 'suspended'
  const hasStripeCustomer = !!business.stripe_customer_id
  const outstandingBalance = Number(business.outstanding_balance ?? 0)
  const gracePeriodEndsAt = business.grace_period_ends_at
    ? new Date(business.grace_period_ends_at).toLocaleDateString('el-GR')
    : null

  if (isSuspended) {
    return (
      <div className="min-h-screen bg-[#f6f3ee] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="overflow-hidden rounded-[24px] border border-[#f1d4d4] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)] sm:rounded-[28px]">
            <div className="bg-gradient-to-r from-[#7f1d1d] via-[#991b1b] to-[#b91c1c] px-5 py-7 text-white sm:px-6 sm:py-8 lg:px-8">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/70">
                Account suspended
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                Ο λογαριασμός σας έχει ανασταλεί προσωρινά
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85 lg:text-base">
                Υπάρχουν ανεξόφλητες χρεώσεις στη συνδρομή σας. Για να αποκτήσετε
                ξανά πρόσβαση στο dashboard, θα πρέπει πρώτα να εξοφληθούν τα
                ανοιχτά invoices μέσω Stripe.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[22px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fde6d8] text-[#b45309]">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <p className="text-sm text-[#7b6657]">Οφειλή</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
                {formatMoney(outstandingBalance, business.currency ?? 'EUR')}
              </p>
            </div>

            <div className="rounded-[22px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fde6d8] text-[#b45309]">
                <CreditCard className="h-5 w-5" />
              </div>
              <p className="text-sm text-[#7b6657]">Κατάσταση συνδρομής</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
                {business.subscription_status === 'unpaid'
                  ? 'Unpaid'
                  : business.subscription_status === 'past_due'
                    ? 'Past due'
                    : 'Suspended'}
              </p>
            </div>

            <div className="rounded-[22px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fde6d8] text-[#b45309]">
                <Lock className="h-5 w-5" />
              </div>
              <p className="text-sm text-[#7b6657]">Πρόσβαση εφαρμογής</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
                Κλειδωμένη
              </p>
            </div>
          </div>

          <div className="rounded-[24px] border border-[#ebe5dd] bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)] sm:p-8">
            <h3 className="text-2xl font-semibold tracking-tight text-gray-900">
              Τι πρέπει να κάνετε τώρα
            </h3>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-[#eee5dc] bg-[#faf7f2] px-4 py-3">
                <p className="text-sm font-medium text-gray-900">
                  1. Ανοίξτε το Stripe Customer Portal
                </p>
                <p className="mt-1 text-sm text-[#7b6657]">
                  Από εκεί μπορείτε να δείτε τα invoices, να αλλάξετε κάρτα και
                  να προχωρήσετε σε πληρωμή.
                </p>
              </div>

              <div className="rounded-2xl border border-[#eee5dc] bg-[#faf7f2] px-4 py-3">
                <p className="text-sm font-medium text-gray-900">
                  2. Εξοφλήστε όλες τις ανοιχτές χρεώσεις
                </p>
                <p className="mt-1 text-sm text-[#7b6657]">
                  Η πρόσβαση ενεργοποιείται ξανά μόνο αφού πληρωθούν τα ανοιχτά
                  invoices της συνδρομής.
                </p>
              </div>

              <div className="rounded-2xl border border-[#eee5dc] bg-[#faf7f2] px-4 py-3">
                <p className="text-sm font-medium text-gray-900">
                  3. Επιστρέψτε στο dashboard
                </p>
                <p className="mt-1 text-sm text-[#7b6657]">
                  Μόλις ολοκληρωθεί η πληρωμή, το σύστημα θα ενημερωθεί από το
                  Stripe webhook και ο λογαριασμός θα ξεκλειδώσει.
                </p>
              </div>
            </div>

            {gracePeriodEndsAt ? (
              <p className="mt-5 text-sm font-medium text-[#9a3412]">
                Τελευταία ημερομηνία grace period: {gracePeriodEndsAt}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              {hasStripeCustomer ? (
                <form action={createStripePortalSession}>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-2xl bg-[#1f2937] px-5 py-3 text-sm font-semibold text-white hover:bg-[#111827]"
                  >
                    Πλήρωσε τώρα
                  </button>
                </form>
              ) : (
                <a
                  href="/dashboard/billing"
                  className="inline-flex items-center justify-center rounded-2xl bg-[#1f2937] px-5 py-3 text-sm font-semibold text-white hover:bg-[#111827]"
                >
                  Άνοιγμα billing
                </a>
              )}

              <a
                href="/dashboard/billing"
                className="inline-flex items-center justify-center rounded-2xl border border-[#d8cdc1] bg-white px-5 py-3 text-sm font-semibold text-[#5f5146] hover:bg-[#f8f3ee]"
              >
                Μετάβαση στη σελίδα billing
              </a>

              <a
                href="/"
                className="inline-flex items-center justify-center rounded-2xl border border-[#d8cdc1] bg-white px-5 py-3 text-sm font-semibold text-[#5f5146] hover:bg-[#f8f3ee]"
              >
                Επιστροφή στην αρχική
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (expired) {
    return (
      <div className="min-h-screen bg-[#f6f3ee] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="overflow-hidden rounded-[24px] border border-[#f1d4d4] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)] sm:rounded-[28px]">
            <div className="bg-gradient-to-r from-[#7f1d1d] via-[#991b1b] to-[#b91c1c] px-5 py-7 text-white sm:px-6 sm:py-8 lg:px-8">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/70">
                Trial expired
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                Η δωρεάν δοκιμή σας έληξε
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85 lg:text-base">
                Η 14ήμερη δοκιμή του TableOrder έχει ολοκληρωθεί. Για να
                συνεχίσετε να χρησιμοποιείτε την πλατφόρμα, θα χρειαστεί να
                ενεργοποιήσετε συνδρομή.
              </p>
            </div>
          </div>

          <div className="rounded-[22px] border border-[#ebe5dd] bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)] sm:rounded-[24px] sm:p-8">
            <h3 className="text-2xl font-semibold tracking-tight text-gray-900">
              Η πρόσβαση στο dashboard έχει περιοριστεί
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#7b6657] sm:text-base">
              Το trial έχει λήξει, οπότε το dashboard είναι προσωρινά κλειδωμένο.
              Μεταβείτε στο billing για να ενεργοποιήσετε συνδρομή.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/dashboard/billing"
                className="inline-flex items-center justify-center rounded-2xl bg-[#1f2937] px-5 py-3 text-sm font-semibold text-white hover:bg-[#111827]"
              >
                Πήγαινε στο billing
              </a>

              <a
                href="/"
                className="inline-flex items-center justify-center rounded-2xl border border-[#d8cdc1] bg-white px-5 py-3 text-sm font-semibold text-[#5f5146] hover:bg-[#f8f3ee]"
              >
                Επιστροφή στην αρχική
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#f6f3ee]">
      <Sidebar />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-3 py-4 sm:px-4 sm:py-5 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}