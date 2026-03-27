'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { createTablesBatch } from '@/lib/actions/tables.actions'

interface OnboardingReadyPageProps {
  businessName: string
  businessSlug: string
}

export default function OnboardingReadyPageClient({
  businessName,
  businessSlug,
}: OnboardingReadyPageProps) {
  const [tableCount, setTableCount] = useState('10')
  const [tableError, setTableError] = useState<string | null>(null)
  const [tableSuccess, setTableSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleCreateTables() {
    startTransition(async () => {
      setTableError(null)
      setTableSuccess(null)

      const parsed = Number(tableCount)

      if (!Number.isInteger(parsed) || parsed < 1) {
        setTableError('Δώσε έγκυρο αριθμό τραπεζιών.')
        return
      }

      const result = await createTablesBatch(parsed)

      if (result.error) {
        setTableError(result.error)
        return
      }

      const created = result.data?.created ?? 0

      if (created === 0) {
        setTableSuccess('Τα τραπέζια υπάρχουν ήδη. Δεν χρειάστηκε νέα δημιουργία.')
        return
      }

      setTableSuccess(`Δημιουργήθηκαν ${created} τραπέζια.`)
    })
  }

  return (
    <div className="min-h-screen bg-[#f6f3ee] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="rounded-[28px] border border-[#ebe5dd] bg-white p-8 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <div className="mb-8">
            <div className="flex items-center gap-2">
              <div className="h-2 w-full rounded-full bg-[#1f2937]" />
              <div className="h-2 w-full rounded-full bg-[#1f2937]" />
              <div className="h-2 w-full rounded-full bg-[#1f2937]" />
            </div>
            <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-[#8b715d]">
              Βήμα 3 από 3 — Quick setup
            </p>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            Η επιχείρησή σου είναι σχεδόν έτοιμη
          </h1>

          <p className="mt-3 max-w-3xl text-base leading-7 text-[#6f6156]">
            Δημιούργησε γρήγορα τα τραπέζια σου και μετά πέρασε στο menu και στο
            dashboard.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[24px] border border-[#ebe5dd] bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#8b715d]">
              Auto-create tables
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900">
              Δημιούργησε αυτόματα τραπέζια
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#7b6657]">
              Γράψε πόσα τραπέζια έχει το κατάστημά σου και το σύστημα θα
              δημιουργήσει αυτόματα τραπέζια με αρίθμηση 1 έως Ν.
            </p>

            <div className="mt-6 max-w-sm">
              <label
                htmlFor="tableCount"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Αριθμός τραπεζιών
              </label>
              <input
                id="tableCount"
                type="number"
                min="1"
                max="200"
                value={tableCount}
                onChange={(e) => setTableCount(e.target.value)}
                className="h-12 w-full rounded-2xl border border-[#e7ddd3] bg-[#fffdfa] px-4 text-sm text-gray-900 focus:border-[#c9b29d] focus:outline-none focus:ring-2 focus:ring-[#efe4d8]"
              />
            </div>

            {tableError ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {tableError}
              </div>
            ) : null}

            {tableSuccess ? (
              <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {tableSuccess}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCreateTables}
                disabled={isPending}
                className="inline-flex items-center justify-center rounded-2xl bg-[#1f2937] px-5 py-3 text-sm font-semibold text-white hover:bg-[#111827] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isPending ? 'Δημιουργία...' : 'Δημιουργία τραπεζιών'}
              </button>

              <Link
                href="/dashboard/tables"
                className="inline-flex items-center justify-center rounded-2xl border border-[#d8cdc1] bg-white px-5 py-3 text-sm font-semibold text-[#5f5146] hover:bg-[#f8f3ee]"
              >
                Χειροκίνητη διαχείριση τραπεζιών
              </Link>
            </div>
          </div>

          <div className="rounded-[24px] border border-[#e8ddd2] bg-[#fcfaf7] p-6 shadow-[0_6px_20px_rgba(15,23,42,0.04)]">
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#8b715d]">
              Business info
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
              {businessName}
            </h3>
            <p className="mt-2 text-sm text-[#7b6657]">
              Menu link slug:{' '}
              <span className="font-medium text-gray-900">/menu/{businessSlug}</span>
            </p>

            <div className="mt-6 space-y-3">
              <Link
                href="/dashboard/menu"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-[#1f2937] px-5 py-3 text-sm font-semibold text-white hover:bg-[#111827]"
              >
                Πήγαινε στο menu
              </Link>

              <Link
                href="/dashboard"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-[#d8cdc1] bg-white px-5 py-3 text-sm font-semibold text-[#5f5146] hover:bg-[#f8f3ee]"
              >
                Άνοιγμα dashboard
              </Link>

              <Link
                href="/dashboard/billing"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-[#d8cdc1] bg-white px-5 py-3 text-sm font-semibold text-[#5f5146] hover:bg-[#f8f3ee]"
              >
                Billing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}