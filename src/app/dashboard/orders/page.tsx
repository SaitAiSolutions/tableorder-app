import { ClipboardList, CheckCircle2, Clock3, XCircle } from 'lucide-react'
import { getOrdersByBusiness } from '@/lib/actions/orders.actions'
import { OrdersClient } from './orders-client'

export default async function DashboardOrdersPage() {
  const { data: orders, error } = await getOrdersByBusiness()

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-3xl font-semibold tracking-tight text-gray-900">
          Παραγγελίες
        </h2>
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Σφάλμα φόρτωσης παραγγελιών: {error}
        </div>
      </div>
    )
  }

  const safeOrders = orders ?? []

  const activeOrders = safeOrders.filter(
    (order) => order.status !== 'completed' && order.status !== 'cancelled',
  ).length

  const completedOrders = safeOrders.filter(
    (order) => order.status === 'completed',
  ).length

  const cancelledOrders = safeOrders.filter(
    (order) => order.status === 'cancelled',
  ).length

  const newOrders = safeOrders.filter((order) => order.status === 'new').length

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8b715d]">
          Live operations
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
          Παραγγελίες
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#7b6657]">
          Live ροή παραγγελιών της επιχείρησης και άμεση διαχείριση κατάστασης.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[22px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5efe7] text-[#7c5c46]">
            <ClipboardList className="h-5 w-5" />
          </div>
          <p className="text-sm text-[#7b6657]">Ενεργές παραγγελίες</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
            {activeOrders}
          </p>
        </div>

        <div className="rounded-[22px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5efe7] text-[#7c5c46]">
            <Clock3 className="h-5 w-5" />
          </div>
          <p className="text-sm text-[#7b6657]">Νέες παραγγελίες</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
            {newOrders}
          </p>
        </div>

        <div className="rounded-[22px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5efe7] text-[#7c5c46]">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <p className="text-sm text-[#7b6657]">Ολοκληρωμένες</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
            {completedOrders}
          </p>
        </div>

        <div className="rounded-[22px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5efe7] text-[#7c5c46]">
            <XCircle className="h-5 w-5" />
          </div>
          <p className="text-sm text-[#7b6657]">Ακυρωμένες</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
            {cancelledOrders}
          </p>
        </div>
      </div>

      <OrdersClient initialOrders={safeOrders} />
    </div>
  )
}