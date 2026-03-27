'use client'

import { useMemo } from 'react'
import { OrderCard } from '@/components/dashboard/order-card'
import { useRealtimeOrders } from '@/hooks/use-realtime-orders'
import type { OrderWithItems, TableWithActiveSession } from '@/types/database.types'

interface LiveOrderFeedProps {
  initialOrders: OrderWithItems[]
  availableTables?: TableWithActiveSession[]
  onAdvance?: (orderId: string, currentStatus: OrderWithItems['status']) => void
  onCancel?: (orderId: string) => void
  onClearTable?: (orderId: string) => void
  onTransfer?: (orderId: string, targetTableId: string) => void
  pending?: boolean
}

export default function LiveOrderFeed({
  initialOrders,
  availableTables = [],
  onAdvance,
  onCancel,
  onClearTable,
  onTransfer,
  pending = false,
}: LiveOrderFeedProps) {
  const { orders } = useRealtimeOrders(initialOrders)

  const sortedOrders = useMemo(() => {
    return [...orders].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
  }, [orders])

  if (sortedOrders.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-[#d8cdc1] bg-white p-12 text-center text-sm text-[#7b6657] shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
        Δεν υπάρχουν παραγγελίες ακόμα.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {pending ? (
        <div className="rounded-2xl border border-[#ebe5dd] bg-white px-4 py-3 text-sm text-[#7b6657] shadow-[0_6px_20px_rgba(15,23,42,0.04)]">
          Ενημέρωση…
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {sortedOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            availableTables={availableTables}
            onAdvance={
              onAdvance
                ? (orderId) => onAdvance(orderId, order.status)
                : undefined
            }
            onCancel={onCancel}
            onClearTable={onClearTable}
            onTransfer={onTransfer}
          />
        ))}
      </div>
    </div>
  )
}