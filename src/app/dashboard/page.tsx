import Link from 'next/link'
import { ArrowRight, ClipboardList, Table2, Wallet } from 'lucide-react'
import { getCurrentBusiness } from '@/lib/actions/business.actions'
import {
  getCategoriesForDashboard,
  getProductsForDashboard,
} from '@/lib/actions/menu.actions'
import { getOrdersByBusiness } from '@/lib/actions/orders.actions'
import { getTablesWithSessions } from '@/lib/actions/tables.actions'
import { formatCurrency } from '@/lib/utils/format-currency'
import { getTrialStatus } from '@/lib/utils/trial'

export default async function DashboardHomePage() {
  const { data: business } = await getCurrentBusiness()

  if (!business) return null

  const trial = getTrialStatus(
    business.trial_ends_at,
    business.subscription_status,
  )

  if (trial.expired) {
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
            Μεταβείτε στη σελίδα χρέωσης για να ενεργοποιήσετε ξανά τον λογαριασμό σας.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center justify-center rounded-2xl bg-[#1f2937] px-5 py-3 text-sm font-semibold text-white hover:bg-[#111827]"
            >
              Πήγαινε στο billing
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const [{ data: orders }, { data: tables }, { data: categories }, { data: products }] =
    await Promise.all([
      getOrdersByBusiness(),
      getTablesWithSessions(),
      getCategoriesForDashboard(),
      getProductsForDashboard(),
    ])

  const safeOrders = orders ?? []
  const safeTables = tables ?? []
  const safeCategories = categories ?? []
  const safeProducts = products ?? []

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

  const totalTables = safeTables.length
  const totalProducts = safeProducts.length
  const totalCategories = safeCategories.length

  const hasTables = totalTables > 0
  const hasMenu = totalProducts > 0 || totalCategories > 0
  const hasSubscription = business.subscription_status === 'active'

  const completedSteps = [hasTables, hasMenu, hasSubscription].filter(Boolean).length
  const progressPercentage = Math.round((completedSteps / 3) * 100)

  const nextAction = !hasTables
    ? {
        title: 'Πρόσθεσε τα πρώτα τραπέζια',
        description:
          'Ξεκίνα δημιουργώντας τα τραπέζια του καταστήματος για να μπορείς να παράγεις QR links.',
        href: '/dashboard/tables',
        cta: 'Πήγαινε στα τραπέζια',
      }
    : !hasMenu
      ? {
          title: 'Στήσε το πρώτο menu',
          description:
            'Δημιούργησε κατηγορίες και προϊόντα ώστε να μπορεί ο πελάτης να παραγγείλει από το κινητό.',
          href: '/dashboard/menu',
          cta: 'Πήγαινε στο menu',
        }
      : !hasSubscription
        ? {
            title: 'Ολοκλήρωσε το billing',
            description:
              'Ενεργοποίησε τη συνδρομή σου για να συνεχίσεις απρόσκοπτα μετά το trial.',
            href: '/dashboard/billing',
            cta: 'Πήγαινε στο billing',
          }
        : {
            title: 'Το κατάστημα είναι έτοιμο',
            description:
              'Συνέχισε με παραγγελίες, τραπέζια και καθημερινή διαχείριση από το dashboard.',
            href: '/dashboard/orders',
            cta: 'Δες παραγγελίες',
          }

  return (
    <div className="space-y-6 sm:space-y-8">
      {!trial.isActiveSubscription && typeof trial.daysLeft === 'number' ? (
        <div className="rounded-[22px] border border-[#e8ddd2] bg-[#fcfaf7] px-5 py-4 text-sm text-[#6f6156] shadow-[0_6px_20px_rgba(15,23,42,0.03)] sm:rounded-[24px]">
          Απομένουν{' '}
          <span className="font-semibold text-gray-900">{trial.daysLeft}</span>{' '}
          ημέρες από τη δωρεάν δοκιμή σας.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[24px] border border-[#ebe5dd] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)] sm:rounded-[28px]">
        <div className="bg-gradient-to-r from-[#1f2937] via-[#2b3442] to-[#7c5c46] px-5 py-7 text-white sm:px-6 sm:py-8 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/70">
                Overview
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                {business.name ?? 'Dashboard'}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80 lg:text-base">
                Επισκόπηση επιχείρησης, παραγγελιών, menu και πληρότητας τραπεζιών
                σε ένα σημείο.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={nextAction.href}
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#1f2937] hover:bg-[#f5efe7]"
                >
                  {nextAction.cta}
                </Link>

                <Link
                  href="/dashboard/billing"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/15"
                >
                  Billing
                </Link>
              </div>
            </div>

            <div className="rounded-[24px] bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-white/75">
                Setup progress
              </p>

              <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-white"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              <p className="mt-3 text-sm text-white/85">
                Ολοκληρώθηκαν {completedSteps} από 3 βασικά βήματα.
              </p>

              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-white/10 px-4 py-3">
                  <p className="text-sm font-medium text-white">
                    Τραπέζια: {hasTables ? 'Ολοκληρώθηκε' : 'Εκκρεμεί'}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 px-4 py-3">
                  <p className="text-sm font-medium text-white">
                    Menu: {hasMenu ? 'Ολοκληρώθηκε' : 'Εκκρεμεί'}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 px-4 py-3">
                  <p className="text-sm font-medium text-white">
                    Συνδρομή: {hasSubscription ? 'Ολοκληρώθηκε' : 'Εκκρεμεί'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

        <div className="rounded-[22px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] sm:rounded-[24px]">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5efe7] text-[#7c5c46]">
            <Wallet className="h-5 w-5" />
          </div>
          <p className="text-sm text-[#7b6657]">Σύνολο σήμερα</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
            {formatCurrency(todayRevenue, business.currency ?? 'EUR')}
          </p>
        </div>

        <div className="rounded-[22px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] sm:rounded-[24px]">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5efe7] text-[#7c5c46]">
            <ClipboardList className="h-5 w-5" />
          </div>
          <p className="text-sm text-[#7b6657]">Προϊόντα στο menu</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
            {totalProducts}
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[22px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] sm:rounded-[24px] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8b715d]">
                Next step
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
                {nextAction.title}
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#7b6657]">
                {nextAction.description}
              </p>
            </div>

            <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-[#8b715d]" />
          </div>

          <div className="mt-6">
            <Link
              href={nextAction.href}
              className="inline-flex items-center justify-center rounded-2xl bg-[#1f2937] px-5 py-3 text-sm font-semibold text-white hover:bg-[#111827]"
            >
              {nextAction.cta}
            </Link>
          </div>
        </div>

        <div className="rounded-[22px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] sm:rounded-[24px] sm:p-6">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8b715d]">
            Quick actions
          </p>

          <div className="mt-4 grid gap-3">
            <Link
              href="/dashboard/tables"
              className="group rounded-2xl border border-[#e8ddd2] bg-[#fcfaf7] px-4 py-4 transition hover:bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Διαχείριση τραπεζιών
                  </p>
                  <p className="mt-1 text-sm text-[#7b6657]">
                    Πρόσθεσε τραπέζια, QR και floor setup.
                  </p>
                </div>
                <Table2 className="h-5 w-5 shrink-0 text-[#8b715d] transition group-hover:translate-x-1" />
              </div>
            </Link>

            <Link
              href="/dashboard/menu"
              className="group rounded-2xl border border-[#e8ddd2] bg-[#fcfaf7] px-4 py-4 transition hover:bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Επεξεργασία menu
                  </p>
                  <p className="mt-1 text-sm text-[#7b6657]">
                    Κατηγορίες, προϊόντα και επιλογές.
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-[#8b715d] transition group-hover:translate-x-1" />
              </div>
            </Link>

            <Link
              href="/dashboard/orders"
              className="group rounded-2xl border border-[#e8ddd2] bg-[#fcfaf7] px-4 py-4 transition hover:bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Παραγγελίες
                  </p>
                  <p className="mt-1 text-sm text-[#7b6657]">
                    Παρακολούθηση ενεργών και ολοκληρωμένων παραγγελιών.
                  </p>
                </div>
                <ClipboardList className="h-5 w-5 shrink-0 text-[#8b715d] transition group-hover:translate-x-1" />
              </div>
            </Link>

            <Link
              href="/dashboard/billing"
              className="group rounded-2xl border border-[#e8ddd2] bg-[#fcfaf7] px-4 py-4 transition hover:bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Billing & συνδρομή
                  </p>
                  <p className="mt-1 text-sm text-[#7b6657]">
                    Δες trial, συνδρομή και τιμολόγηση.
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-[#8b715d] transition group-hover:translate-x-1" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}