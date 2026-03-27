import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import { getCurrentBusiness } from '@/lib/actions/business.actions'
import { getTablesWithSessions } from '@/lib/actions/tables.actions'

export default async function DashboardTablesPrintPage() {
  const { data: business } = await getCurrentBusiness()
  if (!business) return null

  const { data: tables } = await getTablesWithSessions()
  const safeTables = tables ?? []

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:px-6 lg:px-8 print:px-0 print:py-0">
      <div className="mx-auto max-w-7xl space-y-6 print:max-w-none">
        <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8b715d]">
              QR print
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
              Εκτύπωση QR τραπεζιών
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#7b6657]">
              Εκτυπώστε ή αποθηκεύστε όλα τα QR των τραπεζιών για άμεση χρήση στο κατάστημα.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center justify-center rounded-2xl bg-[#1f2937] px-5 py-3 text-sm font-semibold text-white hover:bg-[#111827]"
            >
              Εκτύπωση
            </button>

            <Link
              href="/dashboard/tables"
              className="inline-flex items-center justify-center rounded-2xl border border-[#d8cdc1] bg-white px-5 py-3 text-sm font-semibold text-[#5f5146] hover:bg-[#f8f3ee]"
            >
              Επιστροφή στα τραπέζια
            </Link>
          </div>
        </div>

        <div className="hidden print:block">
          <h1 className="text-2xl font-semibold text-gray-900">
            {business.name} — QR τραπεζιών
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Εκτύπωση QR για customer ordering
          </p>
        </div>

        {safeTables.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[#d8cdc1] bg-white p-12 text-center text-sm text-[#7b6657] shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            Δεν υπάρχουν τραπέζια για εκτύπωση.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 print:grid-cols-3">
            {safeTables.map((table) => {
              const menuUrl = `${baseUrl}/menu/${business.slug}/${table.id}`

              return (
                <div
                  key={table.id}
                  className="break-inside-avoid rounded-[24px] border border-[#ebe5dd] bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)] print:shadow-none"
                >
                  <div className="text-center">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8b715d]">
                      TableOrder
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
                      Τραπέζι {table.table_number}
                    </h2>

                    <p className="mt-1 text-sm text-[#7b6657]">
                      {table.name ?? 'Σκανάρετε για παραγγελία'}
                    </p>
                  </div>

                  <div className="mt-5 flex justify-center">
                    <div className="rounded-[24px] border border-[#e8ddd2] bg-white p-4">
                      <QRCodeSVG value={menuUrl} size={180} includeMargin />
                    </div>
                  </div>

                  <div className="mt-5 text-center">
                    <p className="text-sm font-medium text-gray-900">
                      Σκανάρετε για να δείτε το menu
                    </p>
                    <p className="mt-2 break-all text-[11px] leading-5 text-[#7b6657]">
                      {menuUrl}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}