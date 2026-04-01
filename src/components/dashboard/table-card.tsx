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
import type {
  ServiceRequestType,
  TableWithActiveSession,
} from '@/types/database.types'

interface TableCardProps {
  table: TableWithActiveSession
  businessSlug: string
  currency: string
  appUrl: string
}

const SERVICE_REQUEST_PREFIX = '__SERVICE_REQUEST__:'

function getServiceRequestType(notes?: string | null): ServiceRequestType | null {
  if (!notes?.startsWith(SERVICE_REQUEST_PREFIX)) return null

  const value = notes.replace(SERVICE_REQUEST_PREFIX, '').trim()

  if (value === 'waiter' || value === 'bill') return value
  return null
}

function getTableDisplayTitle(tableNumber?: string | null, tableName?: string | null) {
  const number = String(tableNumber ?? '').trim()
  const name = String(tableName ?? '').trim()

  if (number && name) return `Τραπέζι ${number} · ${name}`
  if (number) return `Τραπέζι ${number}`
  if (name) return name
  return 'Τραπέζι'
}

export function TableCard({
  table,
  businessSlug,
  currency,
  appUrl,
}: TableCardProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const [tableNumber, setTableNumber] = useState(table.table_number ?? '')
  const [tableName, setTableName] = useState(table.name ?? '')

  const occupied = !!table.active_session

  const regularOrders =
    table.active_session?.orders?.filter(
      (o) =>
        !getServiceRequestType(o.notes) &&
        o.status !== 'completed' &&
        o.status !== 'cancelled',
    ) ?? []

  const serviceRequests =
    table.active_session?.orders?.filter(
      (o) =>
        !!getServiceRequestType(o.notes) &&
        o.status !== 'completed' &&
        o.status !== 'cancelled',
    ) ?? []

  const activeOrders = regularOrders.length
  const activeServiceRequests = serviceRequests.length
  const total = table.active_session?.session_total ?? 0

  const displayTitle = useMemo(
    () => getTableDisplayTitle(table.table_number, table.name),
    [table.table_number, table.name],
  )

  const customerMenuUrl = useMemo(() => {
    const normalizedAppUrl = appUrl.replace(/\/$/, '')
    return `${normalizedAppUrl}/menu/${businessSlug}/${table.id}`
  }, [appUrl, businessSlug, table.id])

  function handleClear() {
    const confirmed = window.confirm(
      `Θέλετε σίγουρα να εκκαθαρίσετε το ${displayTitle};`,
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
      `Θέλετε σίγουρα να διαγράψετε το ${displayTitle};`,
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
      setSuccess('Το link αντιγράφηκε.')
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
    <>
      <div className="rounded-[22px] border border-[#ebe5dd] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
        <div className="mb-4 flex items-start justify-between gap-3">
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
                <h3 className="truncate text-lg font-semibold tracking-tight text-gray-900">
                  {displayTitle}
                </h3>
                <p className="mt-1 text-sm text-[#7b6657]">
                  {occupied
                    ? 'Ενεργή συνεδρία'
                    : 'Διαθέσιμο για νέα παραγγελία'}
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
          <div className="mb-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        ) : null}

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-[#faf7f2] px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#8b715d]">
              Παραγγελίες
            </p>
            <p className="mt-1 text-xl font-semibold text-gray-900">
              {activeOrders}
            </p>
          </div>

          <div className="rounded-2xl bg-[#faf7f2] px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#8b715d]">
              Service
            </p>
            <p className="mt-1 text-xl font-semibold text-gray-900">
              {activeServiceRequests}
            </p>
          </div>

          <div className="rounded-2xl bg-[#faf7f2] px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#8b715d]">
              Σύνολο
            </p>
            <p className="mt-1 text-xl font-semibold text-gray-900">
              {formatCurrency(total, currency)}
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
                Επεξεργασία
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="rounded-2xl"
                onClick={() => setShowQr(true)}
              >
                QR / Link
              </Button>

              {occupied ? (
                <Button
                  type="button"
                  loading={isPending}
                  className="rounded-2xl"
                  onClick={handleClear}
                >
                  Εκκαθάριση
                </Button>
              ) : null}

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

      {showQr ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-md rounded-[28px] border border-[#ebe5dd] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8b715d]">
                  QR / Customer menu
                </p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-gray-900">
                  {displayTitle}
                </h3>
              </div>

              <Button
                type="button"
                variant="ghost"
                className="rounded-2xl"
                onClick={() => setShowQr(false)}
              >
                Κλείσιμο
              </Button>
            </div>

            <div className="rounded-2xl border border-[#e8ddd2] bg-[#fcfaf7] p-4">
              <div className="flex justify-center">
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <QRCodeSVG
                    id={`qr-${table.id}`}
                    value={customerMenuUrl}
                    size={180}
                    includeMargin
                  />
                </div>
              </div>

              <p className="mt-4 break-all text-center text-xs leading-5 text-[#7b6657]">
                {customerMenuUrl}
              </p>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Link
                  href={customerMenuUrl}
                  target="_blank"
                  className="inline-flex items-center justify-center rounded-2xl border border-[#d8cdc1] bg-white px-4 py-2 text-sm font-medium text-[#5f5146] hover:bg-[#f8f3ee]"
                >
                  Άνοιγμα menu
                </Link>

                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-2xl"
                  onClick={handleCopyLink}
                >
                  Αντιγραφή link
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-2xl"
                  onClick={handleDownloadQr}
                >
                  Λήψη QR
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}