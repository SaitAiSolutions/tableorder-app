import { getCurrentBusiness } from '@/lib/actions/business.actions'
import {
  getRecentCashClosuresWithOrders,
} from '@/lib/actions/revenue.actions'
import { formatCurrency } from '@/lib/utils/format-currency'

function formatGreekDateTime(value: string) {
  return new Date(value).toLocaleString('el-GR', {
    timeZone: 'Europe/Athens',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatGreekDate(value: string) {
  return new Date(value).toLocaleDateString('el-GR', {
    timeZone: 'Europe/Athens',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export default async function DashboardRevenuePage() {
  const { data: business } = await getCurrentBusiness()
  const { data: closures } = await getRecentCashClosuresWithOrders()

  if (!business) return null

  const safeClosures = closures ?? []

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8b715d]">
          Revenue history
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
          Εισπράξεις
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#7b6657]">
          Εδώ αποθηκεύεται ιστορικό κλεισίματος ημέρας για τις τελευταίες 5 ημέρες.
        </p>
      </div>

      <div className="rounded-[24px] border border-[#e8ddd2] bg-[#fcfaf7] px-5 py-4 text-sm text-[#6f6156] shadow-[0_6px_20px_rgba(15,23,42,0.03)]">
        Το ιστορικό εισπράξεων διατηρείται για 5 ημέρες. Πατήστε πάνω σε μία ημέρα
        για να δείτε αναλυτικά τις παραγγελίες που περιλαμβάνει.
      </div>

      {safeClosures.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-[#d8cdc1] bg-white px-6 py-10 text-center text-sm text-[#7b6657]">
          Δεν υπάρχουν ακόμα καταχωρημένα κλεισίματα ημέρας.
        </div>
      ) : (
        <div className="space-y-4">
          {safeClosures.map((closure) => (
            <details
              key={closure.id}
              className="group rounded-[24px] border border-[#ebe5dd] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
            >
              <summary className="cursor-pointer list-none px-5 py-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm text-[#7b6657]">Ημερομηνία ημέρας</p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
                      {formatGreekDate(closure.closure_date)}
                    </p>
                    <p className="mt-2 text-xs text-[#8b715d] group-open:hidden">
                      Πατήστε για ανάλυση παραγγελιών
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-[#faf7f2] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-[#8b715d]">
                        Σύνολο
                      </p>
                      <p className="mt-1 text-lg font-semibold text-gray-900">
                        {formatCurrency(
                          Number(closure.total_amount ?? 0),
                          business.currency ?? 'EUR',
                        )}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#faf7f2] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-[#8b715d]">
                        Παραγγελίες
                      </p>
                      <p className="mt-1 text-lg font-semibold text-gray-900">
                        {closure.orders_count}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#faf7f2] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-[#8b715d]">
                        Κλείσιμο
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {formatGreekDateTime(closure.closed_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </summary>

              <div className="border-t border-[#eee5dc] px-5 pb-5 pt-4">
                {closure.included_orders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#d8cdc1] bg-[#fffdfa] px-4 py-6 text-sm text-[#7b6657]">
                    Δεν βρέθηκαν παραγγελίες σε αυτό το κλείσιμο ημέρας.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {closure.included_orders.map((order) => (
                      <div
                        key={order.id}
                        className="rounded-2xl border border-[#eee5dc] bg-[#faf7f2] px-4 py-4"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              Τραπέζι {order.table_label}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#7b6657]">
                              <span>ID: {order.id.slice(0, 5)}</span>
                              <span>•</span>
                              <span>{formatGreekDateTime(order.created_at)}</span>
                            </div>
                          </div>

                          <div className="rounded-2xl bg-white px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.14em] text-[#8b715d]">
                              Ποσό
                            </p>
                            <p className="mt-1 text-base font-semibold text-gray-900">
                              {formatCurrency(
                                Number(order.total_amount ?? 0),
                                business.currency ?? 'EUR',
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}