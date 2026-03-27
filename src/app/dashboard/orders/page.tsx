import { getOrdersByBusiness } from '@/lib/actions/orders.actions'

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
          Debug view για έλεγχο των δεδομένων παραγγελιών.
        </p>
      </div>

      <div className="rounded-2xl border border-[#ebe5dd] bg-white p-4 text-sm text-gray-700">
        Βρέθηκαν {safeOrders.length} παραγγελίες.
      </div>

      {safeOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#d8cdc1] bg-white p-8 text-sm text-[#7b6657]">
          Δεν υπάρχουν παραγγελίες.
        </div>
      ) : (
        <div className="space-y-4">
          {safeOrders.map((order) => (
            <div
              key={String(order.id)}
              className="rounded-2xl border border-[#ebe5dd] bg-white p-4"
            >
              <p><strong>ID:</strong> {String(order.id)}</p>
              <p><strong>Status:</strong> {String(order.status)}</p>
              <p><strong>Created:</strong> {String(order.created_at)}</p>
              <p><strong>Total:</strong> {String(order.total_amount)}</p>
              <p>
                <strong>Items count:</strong> {order.order_items?.length ?? 0}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}