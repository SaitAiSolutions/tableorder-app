import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Topbar } from '@/components/dashboard/topbar'
import { getCurrentBusiness } from '@/lib/actions/business.actions'
import { createClient } from '@/lib/supabase/server'
import { formatTrialEndDate, getTrialStatus } from '@/lib/utils/trial'

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

  const trial = getTrialStatus(
    business.trial_ends_at,
    business.subscription_status,
  )

  if (trial.expired) {
    const formattedEndDate = formatTrialEndDate(business.trial_ends_at)

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
                Η 14ήμερη δοκιμή του TableOrder έχει ολοκληρωθεί
                {formattedEndDate ? ` στις ${formattedEndDate}` : ''}. Για να
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
              Στο επόμενο βήμα θα προσθέσουμε billing page ή Stripe upgrade για
              να μπορεί ο χρήστης να συνεχίζει κανονικά.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-2xl bg-[#1f2937] px-5 py-3 text-sm font-semibold text-white hover:bg-[#111827]"
              >
                Επιστροφή στην αρχική
              </a>

              <a
                href="/dashboard/settings"
                className="inline-flex items-center justify-center rounded-2xl border border-[#d8cdc1] bg-white px-5 py-3 text-sm font-semibold text-[#5f5146] hover:bg-[#f8f3ee]"
              >
                Ρυθμίσεις
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const showTrialBanner =
    !trial.isActiveSubscription &&
    !trial.expired &&
    typeof trial.daysLeft === 'number'

  const formattedEndDate = formatTrialEndDate(business.trial_ends_at)

  return (
    <div className="flex min-h-screen bg-[#f6f3ee]">
      <Sidebar />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar />

        <main className="flex-1 px-3 py-4 sm:px-4 sm:py-5 lg:px-8 lg:py-8">
          {showTrialBanner ? (
            <div className="mb-6 rounded-[22px] border border-[#e7d9c9] bg-gradient-to-r from-[#fff7ed] to-[#fffaf4] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] sm:rounded-[24px] sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#9a6b3d]">
                    Free trial
                  </p>
                  <h3 className="mt-1 text-lg font-semibold tracking-tight text-gray-900 sm:text-xl">
                    Απομένουν {trial.daysLeft} ημέρες από τη δωρεάν δοκιμή σας
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#7b6657]">
                    {formattedEndDate
                      ? `Η δοκιμή λήγει στις ${formattedEndDate}.`
                      : 'Η δοκιμή σας είναι ενεργή.'}{' '}
                    Σύντομα θα προσθέσουμε αναβάθμιση συνδρομής μέσα από το dashboard.
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-3">
                  <a
                    href="/dashboard/settings"
                    className="inline-flex items-center justify-center rounded-2xl border border-[#d8cdc1] bg-white px-5 py-3 text-sm font-semibold text-[#5f5146] hover:bg-[#f8f3ee]"
                  >
                    Ρυθμίσεις
                  </a>
                </div>
              </div>
            </div>
          ) : null}

          {children}
        </main>
      </div>
    </div>
  )
}