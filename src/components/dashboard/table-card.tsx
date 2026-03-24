import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils/format-currency'
import type { TableWithActiveSession } from '@/types/database.types'

interface TableCardProps {
  table: TableWithActiveSession
}

export function TableCard({ table }: TableCardProps) {
  const occupied = !!table.active_session
  const activeOrders = table.active_session?.orders?.filter(
    (o) => o.status !== 'completed' && o.status !== 'cancelled',
  ).length ?? 0

  const total = table.active_session?.session_total ?? 0

  return (
    <div className="rounded-[24px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-gray-900">
            Τραπέζι {table.table_number}
          </h3>
          <p className="mt-1 text-sm text-[#7b6657]">
            {table.name ?? 'Χωρίς σημείωση'}
          </p>
        </div>

        <Badge
          className={
            occupied
              ? 'bg-[#fce7d6] text-[#9a5b24]'
              : 'bg-[#e7f6ea] text-[#26734d]'
          }
        >
          {occupied ? 'Κατειλημμένο' : 'Ελεύθερο'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[#faf7f2] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.14em] text-[#8b715d]">
            Ενεργές παραγγελίες
          </p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {activeOrders}
          </p>
        </div>

        <div className="rounded-2xl bg-[#faf7f2] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.14em] text-[#8b715d]">
            Τρέχον σύνολο
          </p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {formatCurrency(total)}
          </p>
        </div>
      </div>
    </div>
  )
}