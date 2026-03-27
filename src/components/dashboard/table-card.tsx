'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { QRCodeSVG } from 'qrcode.react'
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
  businessSlug: string
  currency: string
}

export function TableCard({
  table,
  businessSlug,
  currency,
}: TableCardProps) {
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

  const customerMenuUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/menu/${businessSlug}/${table.id}`
    }

    return `/menu/${businessSlug}/${table.id}`
  }, [businessSlug, table.id])

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

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(customerMenuUrl)
      setError(null)
      setSuccess('Το link του QR αντιγράφηκε.')
    } catch {
      setError('Δεν έγινε αντιγραφή του link.')
    }
  }

  function handleDownloadQr() {
    const svg = document.getElementById(`qr-${table.id}`)
    if (!svg) {
      setError('Δεν βρέθηκε το QR για λήψη.')
      return
    }

    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(svg)
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `table-${table.table_number}-qr.svg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setError(null)
    setSuccess('Το QR κατέβηκε.')
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
            {formatCurrency(total, currency)}
          </p>
        </div>
      </div>

      {!isEditing ? (
        <div className="mt-4 rounded-[20px] border border-[#e8ddd2] bg-[#fcfaf7] p-4">
          <div className="flex items-start gap-4">
            <div className="shrink-0 rounded-2xl bg-white p-3 shadow-sm">
              <QRCodeSVG
                id={`qr-${table.id}`}
                value={customerMenuUrl}
                size={110}
                includeMargin
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">
                QR για customer menu
              </p>
              <p className="mt-1 break-all text-xs leading-5 text-[#7b6657]">
                {customerMenuUrl}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={customerMenuUrl}
                  target="_blank"
                  className="inline-flex items-center justify-center rounded-2xl border border-[#d8cdc1] bg-white px-4 py-2 text-sm font-medium text-[#5f5146] hover:bg-[#f8f3ee]"
                >
                  Άνοιγμα menu
                </Link>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center justify-center rounded-2xl border border-[#d8cdc1] bg-white px-4 py-2 text-sm font-medium text-[#5f5146] hover:bg-[#f8f3ee]"
                >
                  Αντιγραφή link
                </button>

                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="inline-flex items-center justify-center rounded-2xl border border-[#d8cdc1] bg-white px-4 py-2 text-sm font-medium text-[#5f5146] hover:bg-[#f8f3ee]"
                >
                  Λήψη QR
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

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