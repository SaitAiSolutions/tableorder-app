import Link from 'next/link'
import { ArrowRight, ClipboardList, Table2, Wallet } from 'lucide-react'
import { getCurrentBusiness } from '@/lib/actions/business.actions'
import { getOrdersByBusiness } from '@/lib/actions/orders.actions'
import { getTablesWithSessions } from '@/lib/actions/tables.actions'
import { formatCurrency } from '@/lib/utils/format-currency'
import { getRemainingTrialDays, isTrialExpired } from '@/lib/utils/trial'

export default async function DashboardHomePage() {
  const { data: business } = await getCurrentBusiness()

  if (!business) return null

  const trialEndsAt = (business as any).trial_ends_at as string | null | undefined
  const expired = isTrialExpired(trialEndsAt)
  const remainingDays = getRemainingTrialDays(trialEndsAt)

  if (expired) {
    return (
      <div className="space-y-6 sm:space-y-8">
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
            Μπορείτε να μεταβείτε στις ρυθμίσεις ή στη σελίδα χρέωσης όταν τη
            προσθέσουμε, ώστε να ενεργοποιήσετε ξανά τον λογαριασμό σας.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center justify-center rounded-2xl bg-[#1f2937] px-5 py-3 text-sm font-semibold text-white hover:bg-[#111827]"
            >
              Πήγαινε στις ρυθμίσεις
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { data: orders } = await getOrdersByBusiness()
  const { data: tables } = await getTablesWithSessions()

  const safeOrders = orders ?? []
  const safeTables = tables ?? []

  const activeOrders = safeOrders.filter(
    (o) => o.status !== 'completed' && o.status !== 'cancelled',
  ).length

  const occupiedTables = safeTables.filter((t) => !!t.active_session).length

  const todayRevenue = safeOrders
    .filter((o) => {
      const d = new Date(o.created_at)
      const now = new Date()
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      )
    })
    .reduce((sum, o) => sum + Number(o.total_amount ?? 0), 0)

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="rounded-[22px] border border-[#e8ddd2] bg-[#fcfaf7] px-5 py-4 text-sm text-[#6f6156] shadow-[0_6px_20px_rgba(15,23,42,0.03)] sm:rounded-[24px]">
        {remainingDays !== null ? (
          <>
            Απομένουν{' '}
            <span className="font-semibold text-gray-900">{remainingDays}</span>{' '}
            ημέρες από τη δωρεάν δοκιμή σας.
          </>
        ) : (
          <>Η δωρεάν δοκιμή σας είναι ενεργή.</>
        )}
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[#ebe5dd] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)] sm:rounded-[28px]">
        <div className="bg-gradient-to-r from-[#1f2937] via-[#2b3442] to-[#7c5c46] px-5 py-7 text-white sm:px-6 sm:py-8 lg:px-8">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/70">
            Overview
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            {business?.name ?? 'Dashboard'}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80 lg:text-base">
            Επισκόπηση επιχείρησης, παραγγελιών και πληρότητας τραπεζιών σε ένα σημείο.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-[22px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] sm:rounded-[24px]">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5efe7] text-[#7c5c46]">
            <ClipboardList className="h-5 w-5" />
          </div>
          <p className="text-sm text-[#7b6657]">Ενεργές παραγγελίες</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
            {activeOrders}
          </p>
        </div>

        <div className="rounded-[22px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] sm:rounded-[24px]">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5efe7] text-[#7c5c46]">
            <Table2 className="h-5 w-5" />
          </div>
          <p className="text-sm text-[#7b6657]">Κατειλημμένα τραπέζια</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
            {occupiedTables}
          </p>
        </div>

        <div className="rounded-[22px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] sm:rounded-[24px] md:col-span-2 xl:col-span-1">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5efe7] text-[#7c5c46]">
            <Wallet className="h-5 w-5" />
          </div>
          <p className="text-sm text-[#7b6657]">Σύνολο σήμερα</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
            {formatCurrency(todayRevenue, business?.currency ?? 'EUR')}
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Link
          href="/dashboard/orders"
          className="group rounded-[22px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(15,23,42,0.07)] sm:rounded-[24px] sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
                Παραγγελίες
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#7b6657]">
                Δείτε, αποδεχτείτε και διαχειριστείτε τις ενεργές παραγγελίες σε πραγματικό χρόνο.
              </p>
            </div>
            <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-[#8b715d] transition group-hover:translate-x-1" />
          </div>
        </Link>

        <Link
          href="/dashboard/tables"
          className="group rounded-[22px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(15,23,42,0.07)] sm:rounded-[24px] sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
                Τραπέζια
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#7b6657]">
                Παρακολουθήστε πληρότητα, ενεργές συνεδρίες και τη συνολική εικόνα του χώρου.
              </p>
            </div>
            <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-[#8b715d] transition group-hover:translate-x-1" />
          </div>
        </Link>
      </div>
    </div>
  )
}