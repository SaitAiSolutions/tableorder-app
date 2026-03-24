import { getOrdersByBusiness } from '@/lib/actions/orders.actions'
import { OrdersClient } from './orders-client'

export default async function DashboardOrdersPage() {
  const { data: orders } = await getOrdersByBusiness()

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

      <OrdersClient initialOrders={orders ?? []} />
    </div>
  )
}