'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { BellRing, ReceiptText } from 'lucide-react'
import { cancelOrder, updateOrderStatus } from '@/lib/actions/orders.actions'
import { clearTable } from '@/lib/actions/tables.actions'
import { useRealtimeOrders } from '@/hooks/use-realtime-orders'
import { formatCurrency } from '@/lib/utils/format-currency'
import type { OrderWithItems, ServiceRequestType } from '@/types/database.types'

interface OrdersClientProps {
  initialOrders: OrderWithItems[]
}

type OrderWithOptionalTable = OrderWithItems & {
  table?: {
    id?: string
    table_number?: string
    name?: string | null
  } | null
}

type FilterKey =
  | 'all'
  | 'active'
  | 'new'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'

const SERVICE_REQUEST_PREFIX = '__SERVICE_REQUEST__:'

function getServiceRequestType(notes?: string | null): ServiceRequestType | null {
  if (!notes?.startsWith(SERVICE_REQUEST_PREFIX)) return null

  const value = notes.replace(SERVICE_REQUEST_PREFIX, '').trim()

  if (value === 'waiter' || value === 'bill') return value
  return null
}

function getStatusLabel(status: OrderWithItems['status']) {
  if (status === 'new') return 'Νέα'
  if (status === 'accepted') return 'Αποδεκτή'
  if (status === 'preparing') return 'Σε προετοιμασία'
  if (status === 'ready') return 'Έτοιμη'
  if (status === 'completed') return 'Ολοκληρωμένη'
  if (status === 'cancelled') return 'Ακυρωμένη'
  return status
}

function getStatusBadgeClass(status: OrderWithItems['status']) {
  if (status === 'new') return 'bg-blue-100 text-blue-800'
  if (status === 'accepted') return 'bg-yellow-100 text-yellow-800'
  if (status === 'preparing') return 'bg-orange-100 text-orange-800'
  if (status === 'ready') return 'bg-green-100 text-green-800'
  if (status === 'completed') return 'bg-gray-100 text-gray-700'
  if (status === 'cancelled') return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-700'
}

function getNextStatus(status: OrderWithItems['status']) {
  if (status === 'new') return 'accepted'
  if (status === 'accepted') return 'preparing'
  if (status === 'preparing') return 'ready'
  if (status === 'ready') return 'completed'
  return status
}

function getNextActionLabel(
  status: OrderWithItems['status'],
  serviceType: ServiceRequestType | null,
) {
  if (serviceType) return 'Ολοκλήρωση αιτήματος'
  if (status === 'new') return 'Αποδοχή'
  if (status === 'accepted') return 'Έναρξη προετοιμασίας'
  if (status === 'preparing') return 'Έτοιμη'
  if (status === 'ready') return 'Ολοκλήρωση'
  return null
}

function getElapsedLabel(createdAt: string) {
  const created = new Date(createdAt).getTime()
  const now = Date.now()
  const diffMinutes = Math.max(1, Math.floor((now - created) / (1000 * 60)))

  if (diffMinutes < 60) return `${diffMinutes} λεπτά πριν`

  const hours = Math.floor(diffMinutes / 60)
  const minutes = diffMinutes % 60

  if (hours < 24) {
    return minutes > 0
      ? `${hours} ώρ. ${minutes} λ. πριν`
      : `${hours} ώρες πριν`
  }

  const days = Math.floor(hours / 24)
  return `${days} ημέρ. πριν`
}

function getServiceRequestLabel(type: ServiceRequestType) {
  return type === 'waiter' ? 'Κλήση σερβιτόρου' : 'Αίτημα λογαριασμού'
}

export function OrdersClient({ initialOrders }: OrdersClientProps) {
  const { orders: realtimeOrders } = useRealtimeOrders(initialOrders)

  const [orders, setOrders] = useState(realtimeOrders)
  const [isPending, startTransition] = useTransition()
  const [activeFilter, setActiveFilter] = useState<FilterKey>('active')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setOrders(realtimeOrders)
  }, [realtimeOrders])

  function patchOrder(orderId: string, nextStatus: OrderWithItems['status']) {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: nextStatus } : order,
      ),
    )
  }

  function handleAdvance(
    orderId: string,
    currentStatus: OrderWithItems['status'],
    serviceType: ServiceRequestType | null,
  ) {
    const nextStatus = serviceType ? 'completed' : getNextStatus(currentStatus)
    if (nextStatus === currentStatus && !serviceType) return

    startTransition(async () => {
      setMessage(null)
      const result = await updateOrderStatus(orderId, nextStatus)

      if (!result.error) {
        patchOrder(orderId, nextStatus)
        setMessage(
          serviceType
            ? 'Το αίτημα ολοκληρώθηκε.'
            : 'Η παραγγελία ενημερώθηκε.',
        )
      }
    })
  }

  function handleCancel(orderId: string) {
    startTransition(async () => {
      setMessage(null)
      const result = await cancelOrder(orderId)

      if (!result.error) {
        patchOrder(orderId, 'cancelled')
        setMessage('Η παραγγελία ακυρώθηκε.')
      }
    })
  }

  function handleClearTable(orderId: string) {
    const order = orders.find((o) => o.id === orderId) as OrderWithOptionalTable | undefined
    const tableId = order?.table?.id

    if (!tableId) return

    const confirmed = window.confirm(
      'Θέλετε σίγουρα να εκκαθαρίσετε το τραπέζι; Θα κλείσει η τρέχουσα συνεδρία του.',
    )

    if (!confirmed) return

    startTransition(async () => {
      setMessage(null)
      const result = await clearTable(tableId)

      if (!result.error) {
        setOrders((prev) =>
          prev.filter((o) => {
            const current = o as OrderWithOptionalTable
            return current.table?.id !== tableId
          }),
        )
        setMessage('Το τραπέζι εκκαθαρίστηκε.')
      }
    })
  }

  const serviceOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          !!getServiceRequestType(o.notes) &&
          o.status !== 'completed' &&
          o.status !== 'cancelled',
      ),
    [orders],
  )

  const regularOrders = useMemo(
    () => orders.filter((o) => !getServiceRequestType(o.notes)),
    [orders],
  )

  const counts = useMemo(() => {
    return {
      all: orders.length,
      active: orders.filter(
        (o) => o.status !== 'completed' && o.status !== 'cancelled',
      ).length,
      new: regularOrders.filter((o) => o.status === 'new').length,
      accepted: regularOrders.filter((o) => o.status === 'accepted').length,
      preparing: regularOrders.filter((o) => o.status === 'preparing').length,
      ready: regularOrders.filter((o) => o.status === 'ready').length,
      completed: orders.filter((o) => o.status === 'completed').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    }
  }, [orders, regularOrders])

  const filteredOrders = useMemo(() => {
    if (activeFilter === 'all') return regularOrders

    if (activeFilter === 'active') {
      return regularOrders.filter(
        (o) => o.status !== 'completed' && o.status !== 'cancelled',
      )
    }

    return regularOrders.filter((o) => o.status === activeFilter)
  }, [regularOrders, activeFilter])

  const filters: Array<{ key: FilterKey; label: string; count: number }> = [
    { key: 'active', label: 'Ενεργές', count: counts.active },
    { key: 'new', label: 'Νέες', count: counts.new },
    { key: 'accepted', label: 'Accepted', count: counts.accepted },
    { key: 'preparing', label: 'Preparing', count: counts.preparing },
    { key: 'ready', label: 'Ready', count: counts.ready },
    { key: 'completed', label: 'Completed', count: counts.completed },
    { key: 'cancelled', label: 'Cancelled', count: counts.cancelled },
    { key: 'all', label: 'Όλες', count: counts.all },
  ]

  return (
    <div className="space-y-6">
      {serviceOrders.length > 0 ? (
        <div className="rounded-[24px] border border-[#eadfd3] bg-[#fcfaf7] p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8b715d]">
                Live service
              </p>
              <h3 className="mt-1 text-xl font-semibold tracking-tight text-gray-900">
                Service requests
              </h3>
              <p className="mt-1 text-sm text-[#7b6657]">
                Αιτήματα εξυπηρέτησης που χρειάζονται άμεση ενέργεια.
              </p>
            </div>

            <div className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-[#5f5146]">
              {serviceOrders.length} ενεργά
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {serviceOrders.map((order) => {
              const safeOrder = order as OrderWithOptionalTable
              const serviceType = getServiceRequestType(order.notes)
              const tableNumber = safeOrder.table?.table_number
              const tableName = safeOrder.table?.name?.trim()
              const tableLabel = tableNumber ? `Τραπέζι ${tableNumber}` : 'Τραπέζι'
              const tableSubtitle = tableName ? `${tableLabel} · ${tableName}` : tableLabel
              const nextActionLabel = getNextActionLabel(order.status, serviceType)

              return (
                <div
                  key={String(order.id)}
                  className="rounded-[24px] border border-[#e7ddd3] bg-white p-5"
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-semibold tracking-tight text-gray-900">
                        {tableSubtitle}
                      </h4>
                      <p className="mt-2 text-sm text-[#7b6657]">
                        {new Date(order.created_at).toLocaleString('el-GR')}
                      </p>
                      <p className="mt-1 text-xs text-[#8b715d]">
                        {getElapsedLabel(order.created_at)}
                      </p>
                    </div>

                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeClass(order.status)}`}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </div>

                  <div className="rounded-[22px] border border-[#eadfd3] bg-[#fcfaf7] p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f6efe8] text-[#7c5c46]">
                        {serviceType === 'waiter' ? (
                          <BellRing className="h-5 w-5" />
                        ) : (
                          <ReceiptText className="h-5 w-5" />
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {serviceType ? getServiceRequestLabel(serviceType) : 'Service request'}
                        </p>
                        <p className="mt-1 text-sm text-[#7b6657]">
                          Αίτημα εξυπηρέτησης από το τραπέζι.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3">
                    {order.status !== 'completed' &&
                    order.status !== 'cancelled' &&
                    nextActionLabel ? (
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-2xl bg-[#1f2937] px-4 py-3 text-sm font-semibold text-white hover:bg-[#111827]"
                        onClick={() =>
                          handleAdvance(String(order.id), order.status, serviceType)
                        }
                      >
                        {nextActionLabel}
                      </button>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      {order.status !== 'completed' && order.status !== 'cancelled' ? (
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-xl border border-[#ddd2c7] bg-white px-4 py-2 text-sm font-medium text-[#5f5146] hover:bg-[#f6efe8]"
                          onClick={() => handleCancel(String(order.id))}
                        >
                          Ακύρωση
                        </button>
                      ) : null}

                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-xl border border-[#ddd2c7] bg-white px-4 py-2 text-sm font-medium text-[#5f5146] hover:bg-[#f6efe8]"
                        onClick={() => handleClearTable(String(order.id))}
                      >
                        Εκκαθάριση τραπεζιού
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      <div className="rounded-[24px] border border-[#ebe5dd] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Φίλτρα παραγγελιών</h3>
          <p className="mt-1 text-sm text-[#7b6657]">
            Διάλεξε ποιες παραγγελίες θέλεις να βλέπεις.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const isActive = activeFilter === filter.key

            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
                className={
                  isActive
                    ? 'inline-flex items-center gap-2 rounded-full bg-[#1f2937] px-4 py-2 text-sm font-medium text-white'
                    : 'inline-flex items-center gap-2 rounded-full border border-[#ddd2c7] bg-white px-4 py-2 text-sm font-medium text-[#5f5146] transition hover:bg-[#f6efe8]'
                }
              >
                <span>{filter.label}</span>
                <span
                  className={
                    isActive
                      ? 'rounded-full bg-white/15 px-2 py-0.5 text-xs text-white'
                      : 'rounded-full bg-[#f3ece4] px-2 py-0.5 text-xs text-[#6f6156]'
                  }
                >
                  {filter.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {message ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      ) : null}

      {isPending ? (
        <div className="rounded-2xl border border-[#ebe5dd] bg-white px-4 py-3 text-sm text-[#7b6657] shadow-[0_6px_20px_rgba(15,23,42,0.04)]">
          Ενημέρωση…
        </div>
      ) : null}

      {filteredOrders.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-[#d8cdc1] bg-white p-12 text-center text-sm text-[#7b6657] shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          Δεν υπάρχουν παραγγελίες ακόμα.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredOrders.map((order) => {
            const safeOrder = order as OrderWithOptionalTable
            const totalItems =
              order.order_items?.reduce(
                (sum, item) => sum + Number(item.quantity ?? 0),
                0,
              ) ?? 0

            const tableNumber = safeOrder.table?.table_number
            const tableName = safeOrder.table?.name?.trim()
            const tableLabel = tableNumber ? `Τραπέζι ${tableNumber}` : 'Τραπέζι'
            const tableSubtitle = tableName ? `${tableLabel} · ${tableName}` : tableLabel
            const nextActionLabel = getNextActionLabel(order.status, null)

            return (
              <div
                key={String(order.id)}
                className="rounded-[24px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-semibold tracking-tight text-gray-900">
                        {tableSubtitle}
                      </h3>

                      <span className="rounded-full bg-[#f5efe7] px-2.5 py-1 text-[11px] font-medium text-[#7b6657]">
                        #{String(order.id).slice(0, 8)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-[#7b6657]">
                      {new Date(order.created_at).toLocaleString('el-GR')}
                    </p>
                    <p className="mt-1 text-xs text-[#8b715d]">
                      {getElapsedLabel(order.created_at)}
                    </p>
                  </div>

                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeClass(order.status)}`}
                  >
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                <div className="mb-4 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-[#faf7f2] px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-[#8b715d]">
                      Είδη
                    </p>
                    <p className="mt-2 text-xl font-semibold text-gray-900">
                      {totalItems}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#faf7f2] px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-[#8b715d]">
                      Γραμμές
                    </p>
                    <p className="mt-2 text-xl font-semibold text-gray-900">
                      {order.order_items?.length ?? 0}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#faf7f2] px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-[#8b715d]">
                      Σύνολο
                    </p>
                    <p className="mt-2 text-xl font-semibold text-gray-900">
                      {formatCurrency(order.total_amount)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {order.order_items?.map((item) => (
                    <div
                      key={String(item.id)}
                      className="rounded-2xl border border-[#f0e8df] bg-[#faf7f2] px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {item.quantity}× {item.product_name_snapshot_el}
                          </p>

                          {item.order_item_options &&
                          item.order_item_options.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {item.order_item_options.map((option) => (
                                <span
                                  key={String(option.id)}
                                  className="rounded-full bg-white px-2.5 py-1 text-[11px] text-[#6f6156] shadow-sm"
                                >
                                  {option.option_group_name_el}:{' '}
                                  {option.option_choice_name_el}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>

                        <p className="shrink-0 text-sm font-semibold text-gray-900">
                          {formatCurrency(item.line_total)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {order.notes ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-[#e6dcd1] bg-[#fffdfb] px-4 py-3 text-sm text-[#6f6156]">
                    <span className="font-medium text-gray-900">Σημείωση:</span>{' '}
                    {order.notes}
                  </div>
                ) : null}

                <div className="mt-5 flex flex-col gap-3">
                  {order.status !== 'completed' &&
                  order.status !== 'cancelled' &&
                  nextActionLabel ? (
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-2xl bg-[#1f2937] px-4 py-3 text-sm font-semibold text-white hover:bg-[#111827]"
                      onClick={() =>
                        handleAdvance(String(order.id), order.status, null)
                      }
                    >
                      {nextActionLabel}
                    </button>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    {order.status !== 'completed' && order.status !== 'cancelled' ? (
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-xl border border-[#ddd2c7] bg-white px-4 py-2 text-sm font-medium text-[#5f5146] hover:bg-[#f6efe8]"
                        onClick={() => handleCancel(String(order.id))}
                      >
                        Ακύρωση
                      </button>
                    ) : null}

                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-xl border border-[#ddd2c7] bg-white px-4 py-2 text-sm font-medium text-[#5f5146] hover:bg-[#f6efe8]"
                      onClick={() => handleClearTable(String(order.id))}
                    >
                      Εκκαθάριση τραπεζιού
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}