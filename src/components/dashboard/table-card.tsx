'use client'

import { useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ErrorMessage } from '@/components/ui/error-message'
import {
  clearTable,
  deleteTable,
  updateTable,
} from '@/lib/actions/tables.actions'
import { formatCurrency } from '@/lib/utils/format-currency'
import type { TableWithActiveSession } from '@/types/database.types'

interface TableCardProps {
  table: TableWithActiveSession
}

export function TableCard({ table }: TableCardProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [tableNumber, setTableNumber] = useState(table.table_number ?? '')
  const [tableName, setTableName] = useState(table.name ?? '')

  const occupied = !!table.active_session
  const activeOrders =
    table.active_session?.orders?.filter(
      (o) => o.status !== 'completed' && o.status !== 'cancelled',
    ).length ?? 0

  const total = table.active_session?.session_total ?? 0

  function handleClear() {
    const confirmed = window.confirm(
      `Θέλετε σίγουρα να εκκαθαρίσετε το τραπέζι ${table.table_number};`,
    )
    if (!confirmed) return

    startTransition(async () => {
      setError(null)
      setSuccess(null)

      const result = await clearTable(table.id)

      if (result.error) {
        setError(result.error)
        return
      }

      setSuccess('Το τραπέζι εκκαθαρίστηκε.')
    })
  }

  function handleSave() {
    startTransition(async () => {
      setError(null)
      setSuccess(null)

      const trimmedNumber = tableNumber.trim()
      const trimmedName = tableName.trim()

      if (!trimmedNumber) {
        setError('Απαιτείται αριθμός τραπεζιού.')
        return
      }

      const result = await updateTable(table.id, {
        table_number: trimmedNumber,
        name: trimmedName || null,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      setIsEditing(false)
      setSuccess('Το τραπέζι ενημερώθηκε.')
    })
  }

  function handleDelete() {
    if (occupied) {
      setError('Δεν μπορείτε να διαγράψετε κατειλημμένο τραπέζι.')
      return
    }

    const confirmed = window.confirm(
      `Θέλετε σίγουρα να διαγράψετε το τραπέζι ${table.table_number};`,
    )
    if (!confirmed) return

    startTransition(async () => {
      setError(null)
      setSuccess(null)

      const result = await deleteTable(table.id)

      if (result.error) {
        setError(result.error)
        return
      }

      setSuccess('Το τραπέζι διαγράφηκε.')
    })
  }

  function handleCancelEdit() {
    setIsEditing(false)
    setTableNumber(table.table_number ?? '')
    setTableName(table.name ?? '')
    setError(null)
    setSuccess(null)
  }

  return (
    <div className="rounded-[24px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-[0.12em] text-[#8b715d]">
                  Αριθμός τραπεζιού
                </label>
                <Input
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="rounded-xl border-[#e7ddd3] bg-white py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-[0.12em] text-[#8b715d]">
                  Όνομα / σημείωση
                </label>
                <Input
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  className="rounded-xl border-[#e7ddd3] bg-white py-2"
                />
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-xl font-semibold tracking-tight text-gray-900">
                Τραπέζι {table.table_number}
              </h3>
              <p className="mt-1 text-sm text-[#7b6657]">
                {table.name ?? 'Χωρίς σημείωση'}
              </p>
            </>
          )}
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

      <ErrorMessage message={error} />

      {success ? (
        <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      ) : null}

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

      <div className="mt-4 flex flex-wrap gap-2">
        {isEditing ? (
          <>
            <Button
              type="button"
              loading={isPending}
              className="rounded-2xl"
              onClick={handleSave}
            >
              Αποθήκευση
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="rounded-2xl"
              onClick={handleCancelEdit}
              disabled={isPending}
            >
              Άκυρο
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="ghost"
              className="rounded-2xl"
              onClick={() => {
                setIsEditing(true)
                setError(null)
                setSuccess(null)
              }}
              disabled={isPending}
            >
              Edit
            </Button>

            {occupied ? (
              <Button
                type="button"
                loading={isPending}
                className="rounded-2xl"
                onClick={handleClear}
              >
                Εκκαθάριση τραπεζιού
              </Button>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#d8cdc1] bg-[#fffdfa] px-4 py-3 text-sm text-[#7b6657]">
                Το τραπέζι είναι διαθέσιμο για νέα παραγγελία.
              </div>
            )}

            <Button
              type="button"
              variant="ghost"
              className="rounded-2xl text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleDelete}
              disabled={isPending || occupied}
            >
              Διαγραφή
            </Button>
          </>
        )}
      </div>
    </div>
  )
}