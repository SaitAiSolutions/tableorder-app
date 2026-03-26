'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { LiveOrderFeed } from './live-order-feed'
import { cancelOrder, updateOrderStatus } from '@/lib/actions/orders.actions'
import { clearTable } from '@/lib/actions/tables.actions'
import type { OrderWithItems } from '@/types/database.types'

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

export function OrdersClient({ initialOrders }: OrdersClientProps) {
  const [orders, setOrders] = useState(initialOrders)
  const [isPending, startTransition] = useTransition()
  const [activeFilter, setActiveFilter] = useState<FilterKey>('active')

  useEffect(() => {
    setOrders(initialOrders)
  }, [initialOrders])

  function patchOrder(orderId: string, nextStatus: OrderWithItems['status']) {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: nextStatus } : order,
      ),
    )
  }

  function getNextStatus(status: OrderWithItems['status']) {
    if (status === 'new') return 'accepted'
    if (status === 'accepted') return 'preparing'
    if (status === 'preparing') return 'ready'
    if (status === 'ready') return 'completed'
    return status
  }

  function handleAdvance(orderId: string, currentStatus: OrderWithItems['status']) {
    const nextStatus = getNextStatus(currentStatus)
    if (nextStatus === currentStatus) return

    startTransition(async () => {
      const result = await updateOrderStatus(orderId, nextStatus)
      if (!result.error) {
        patchOrder(orderId, nextStatus)
      }
    })
  }

  function handleCancel(orderId: string) {
    startTransition(async () => {
      const result = await cancelOrder(orderId)
      if (!result.error) {
        patchOrder(orderId, 'cancelled')
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
      const result = await clearTable(tableId)
      if (!result.error) {
        setOrders((prev) =>
          prev.filter((o) => {
            const current = o as OrderWithOptionalTable
            return current.table?.id !== tableId
          }),
        )
      }
    })
  }

  const counts = useMemo(() => {
    return {
      all: orders.length,
      active: orders.filter(
        (o) => o.status !== 'completed' && o.status !== 'cancelled',
      ).length,
      new: orders.filter((o) => o.status === 'new').length,
      accepted: orders.filter((o) => o.status === 'accepted').length,
      preparing: orders.filter((o) => o.status === 'preparing').length,
      ready: orders.filter((o) => o.status === 'ready').length,
      completed: orders.filter((o) => o.status === 'completed').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    }
  }, [orders])

  const filteredOrders = useMemo(() => {
    if (activeFilter === 'all') return orders

    if (activeFilter === 'active') {
      return orders.filter(
        (o) => o.status !== 'completed' && o.status !== 'cancelled',
      )
    }

    return orders.filter((o) => o.status === activeFilter)
  }, [orders, activeFilter])

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
    <div className="space-y-5">
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

      <LiveOrderFeed
        initialOrders={filteredOrders}
        onAdvance={handleAdvance}
        onCancel={handleCancel}
        onClearTable={handleClearTable}
        pending={isPending}
      />
    </div>
  )
}