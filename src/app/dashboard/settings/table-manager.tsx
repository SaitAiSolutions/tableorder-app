'use client'

import { useState, useTransition } from 'react'
import type { TableWithActiveSession } from '@/types/database.types'
import { createTable } from '@/lib/actions/tables.actions'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { ErrorMessage } from '@/components/ui/error-message'

interface TableManagerProps {
  tables: TableWithActiveSession[]
}

export function TableManager({ tables }: TableManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      setError(null)
      setSuccess(null)

      const result = await createTable(formData)

      if (result.error) {
        setError(result.error)
        return
      }

      setSuccess('Το τραπέζι δημιουργήθηκε.')
    })
  }

  return (
    <div className="rounded-[24px] border border-[#ebe5dd] bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8b715d]">
          Table setup
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
          Διαχείριση τραπεζιών
        </h3>
        <p className="mt-2 text-sm leading-6 text-[#7b6657]">
          Προσθέστε τραπέζια για το QR ordering και δείτε γρήγορα την κατάστασή τους.
        </p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <ErrorMessage message={error} />
        {success ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        ) : null}

        <Field label="Αριθμός τραπεζιού" htmlFor="table_number" required>
          <Input
            id="table_number"
            name="table_number"
            placeholder="π.χ. 1"
            required
            className="rounded-2xl border-[#e7ddd3] bg-[#fffdfa] py-3"
          />
        </Field>

        <Field label="Όνομα / σημείωση" htmlFor="name">
          <Input
            id="name"
            name="name"
            placeholder="π.χ. Βεράντα"
            className="rounded-2xl border-[#e7ddd3] bg-[#fffdfa] py-3"
          />
        </Field>

        <Button type="submit" loading={isPending} className="rounded-2xl">
          Προσθήκη τραπεζιού
        </Button>
      </form>

      <div className="mt-6">
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-gray-900">Υπάρχοντα τραπέζια</h4>
          <p className="mt-1 text-sm text-[#7b6657]">
            Συνολικά τραπέζια: {tables.length}
          </p>
        </div>

        {tables.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d8cdc1] bg-[#fffdfa] px-4 py-8 text-center text-sm text-[#7b6657]">
            Δεν υπάρχουν τραπέζια ακόμα.
          </div>
        ) : (
          <div className="space-y-3">
            {tables.map((table) => (
              <div
                key={table.id}
                className="flex items-center justify-between rounded-2xl border border-[#eee5dc] bg-[#faf7f2] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Τραπέζι {table.table_number}
                  </p>
                  <p className="mt-1 text-xs text-[#7b6657]">
                    {table.name ?? 'Χωρίς σημείωση'}
                  </p>
                </div>

                <span
                  className={
                    table.active_session
                      ? 'rounded-full bg-[#fce7d6] px-3 py-1 text-xs font-medium text-[#9a5b24]'
                      : 'rounded-full bg-[#e7f6ea] px-3 py-1 text-xs font-medium text-[#26734d]'
                  }
                >
                  {table.active_session ? 'Κατειλημμένο' : 'Ελεύθερο'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}