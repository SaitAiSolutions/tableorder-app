import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentBusiness } from '@/lib/actions/business.actions'
import {
  createTablesBatch,
  getTablesWithSessions,
} from '@/lib/actions/tables.actions'
import { TableCard } from '@/components/dashboard/table-card'

type SearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>
  | undefined

function readQueryValue(
  value: string | string[] | undefined,
): string | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

export default async function DashboardTablesPage({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  const resolvedSearchParams =
    searchParams && typeof (searchParams as Promise<unknown>).then === 'function'
      ? await (searchParams as Promise<Record<string, string | string[] | undefined>>)
      : ((searchParams as Record<string, string | string[] | undefined> | undefined) ?? {})

  const createdMessage = readQueryValue(resolvedSearchParams.tables_created)
  const errorMessage = readQueryValue(resolvedSearchParams.tables_error)

  async function handleCreateTables(formData: FormData) {
    'use server'

    const rawCount = String(formData.get('table_count') ?? '').trim()
    const count = Number(rawCount)

    const result = await createTablesBatch(count)

    if (result.error) {
      redirect(
        `/dashboard/tables?tables_error=${encodeURIComponent(result.error)}`,
      )
    }

    const created = result.data?.created ?? 0

    if (created === 0) {
      redirect(
        `/dashboard/tables?tables_created=${encodeURIComponent(
          'Τα τραπέζια υπάρχουν ήδη. Δεν χρειάστηκε νέα δημιουργία.',
        )}`,
      )
    }

    redirect(
      `/dashboard/tables?tables_created=${encodeURIComponent(
        `Δημιουργήθηκαν ${created} τραπέζια.`,
      )}`,
    )
  }

  const { data: business } = await getCurrentBusiness()
  if (!business) return null

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    'http://localhost:3000'

  const { data: tables } = await getTablesWithSessions()
  const safeTables = tables ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
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

        {safeTables.length > 0 ? (
          <Link
            href="/dashboard/tables/print"
            className="inline-flex items-center justify-center rounded-2xl border border-[#d8cdc1] bg-white px-5 py-3 text-sm font-semibold text-[#5f5146] hover:bg-[#f8f3ee]"
          >
            Εκτύπωση όλων των QR
          </Link>
        ) : null}
      </div>

      <div className="rounded-[24px] border border-[#ebe5dd] bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8b715d]">
              Auto-create tables
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
              Δημιούργησε αυτόματα τραπέζια
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7b6657]">
              Γράψε πόσα τραπέζια έχει το κατάστημά σου και το σύστημα θα
              δημιουργήσει αρίθμηση από 1 έως Ν. Όσα υπάρχουν ήδη δεν θα
              δημιουργηθούν ξανά.
            </p>
          </div>

          <form action={handleCreateTables} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-[180px]">
              <label
                htmlFor="table_count"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Αριθμός τραπεζιών
              </label>
              <input
                id="table_count"
                name="table_count"
                type="number"
                min="1"
                max="200"
                defaultValue="10"
                className="h-12 w-full rounded-2xl border border-[#e7ddd3] bg-[#fffdfa] px-4 text-sm text-gray-900 focus:border-[#c9b29d] focus:outline-none focus:ring-2 focus:ring-[#efe4d8]"
              />
            </div>

            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#1f2937] px-5 text-sm font-semibold text-white hover:bg-[#111827]"
            >
              Δημιουργία τραπεζιών
            </button>
          </form>
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {createdMessage ? (
          <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {createdMessage}
          </div>
        ) : null}
      </div>

      {safeTables.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-[#d8cdc1] bg-white p-12 text-center text-sm text-[#7b6657] shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          Δεν έχουν δημιουργηθεί τραπέζια ακόμα.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {safeTables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              businessSlug={business.slug}
              currency={business.currency}
              appUrl={appUrl}
            />
          ))}
        </div>
      )}
    </div>
  )
}