'use client'

import { useState, useTransition } from 'react'
import { LiveOrderFeed } from './live-order-feed'
import { cancelOrder, updateOrderStatus } from '@/lib/actions/orders.actions'
import type { OrderWithItems } from '@/types/database.types'

interface OrdersClientProps {
  initialOrders: OrderWithItems[]
}

export function OrdersClient({ initialOrders }: OrdersClientProps) {
  const [orders, setOrders] = useState(initialOrders)
  const [isPending, startTransition] = useTransition()

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

  return (
    <LiveOrderFeed
      initialOrders={orders}
      onAdvance={handleAdvance}
      onCancel={handleCancel}
      pending={isPending}
    />
  )
}