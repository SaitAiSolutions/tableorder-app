import { getTablesWithSessions } from '@/lib/actions/tables.actions'
import { TableCard } from '@/components/dashboard/table-card'

export default async function DashboardTablesPage() {
  const { data: tables } = await getTablesWithSessions()
  const safeTables = tables ?? []

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8b715d]">
          Floor overview
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
          Τραπέζια
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#7b6657]">
          Παρακολούθηση κατάστασης και ενεργών συνεδριών ανά τραπέζι.
        </p>
      </div>

      {safeTables.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-[#d8cdc1] bg-white p-12 text-center text-sm text-[#7b6657] shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          Δεν έχουν δημιουργηθεί τραπέζια ακόμα.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {safeTables.map((table) => (
            <TableCard key={table.id} table={table} />
          ))}
        </div>
      )}
    </div>
  )
}