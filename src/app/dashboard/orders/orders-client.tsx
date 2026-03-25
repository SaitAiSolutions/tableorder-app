'use client'

import { useEffect, useState, useTransition } from 'react'
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

export function OrdersClient({ initialOrders }: OrdersClientProps) {
  const [orders, setOrders] = useState(initialOrders)
  const [isPending, startTransition] = useTransition()

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
        setOrders((prev) => prev.filter((o) => {
          const current = o as OrderWithOptionalTable
          return current.table?.id !== tableId
        }))
      }
    })
  }

  return (
    <LiveOrderFeed
      initialOrders={orders}
      onAdvance={handleAdvance}
      onCancel={handleCancel}
      onClearTable={handleClearTable}
      pending={isPending}
    />
  )
}