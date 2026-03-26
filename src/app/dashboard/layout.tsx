import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Topbar } from '@/components/dashboard/topbar'
import { getCurrentBusiness } from '@/lib/actions/business.actions'
import { createClient } from '@/lib/supabase/server'
import { isTrialExpired } from '@/lib/utils/trial'

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

  const trialEndsAt = (business as any).trial_ends_at as string | null | undefined
  const expired = isTrialExpired(trialEndsAt)

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
                Η 14ήμερη δοκιμή του TableOrder έχει ολοκληρωθεί. Για να συνεχίσετε
                να χρησιμοποιείτε την πλατφόρμα, θα χρειαστεί να ενεργοποιήσετε
                συνδρομή.
              </p>
            </div>
          </div>

          <div className="rounded-[22px] border border-[#ebe5dd] bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)] sm:rounded-[24px] sm:p-8">
            <h3 className="text-2xl font-semibold tracking-tight text-gray-900">
              Η πρόσβαση στο dashboard έχει περιοριστεί
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#7b6657] sm:text-base">
              Το trial έχει λήξει, οπότε το dashboard είναι προσωρινά κλειδωμένο.
              Στο επόμενο βήμα θα προσθέσουμε billing page ή Stripe upgrade για να
              μπορεί ο χρήστης να συνεχίζει κανονικά.
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