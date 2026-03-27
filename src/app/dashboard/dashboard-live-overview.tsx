'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useMemo } from 'react'
import { useRealtimeOrders } from '@/hooks/use-realtime-orders'
import { formatCurrency } from '@/lib/utils/format-currency'
import type { OrderWithItems } from '@/types/database.types'

interface DashboardLiveOverviewProps {
  initialOrders: OrderWithItems[]
  currency: string
  nextAction: {
    title: string
    description: string
    href: string
    cta: string
  }
}

type OrderWithOptionalTable = OrderWithItems & {
  table?: {
    id?: string
    table_number?: string
    name?: string | null
  } | null
}

export function DashboardLiveOverview({
  initialOrders,
  currency,
  nextAction,
}: DashboardLiveOverviewProps) {
  const { orders } = useRealtimeOrders(initialOrders)

  const activeOrders = useMemo(() => {
    return orders.filter(
      (o) => o.status !== 'completed' && o.status !== 'cancelled',
    )
  }, [orders])

  const latestActiveOrder = useMemo(() => {
    return activeOrders[0] as OrderWithOptionalTable | undefined
  }, [activeOrders])

  if (latestActiveOrder) {
    const tableNumber = latestActiveOrder.table?.table_number
    const tableName = latestActiveOrder.table?.name?.trim()
    const tableLabel = tableNumber ? `Τραπέζι ${tableNumber}` : 'Τραπέζι'
    const tableSubtitle = tableName ? `${tableLabel} · ${tableName}` : tableLabel

    return (
      <div className="rounded-[22px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] sm:rounded-[24px] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8b715d]">
              Live order
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
              Νέα ενεργή παραγγελία
            </h3>
            <p className="mt-3 text-sm leading-6 text-[#7b6657]">
              {tableSubtitle}
            </p>
          </div>

          <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-[#8b715d]" />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-[#faf7f2] px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#8b715d]">
              Status
            </p>
            <p className="mt-2 text-lg font-semibold text-gray-900">
              {latestActiveOrder.status}
            </p>
          </div>

          <div className="rounded-2xl bg-[#faf7f2] px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#8b715d]">
              Είδη
            </p>
            <p className="mt-2 text-lg font-semibold text-gray-900">
              {latestActiveOrder.order_items?.length ?? 0}
            </p>
          </div>

          <div className="rounded-2xl bg-[#faf7f2] px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#8b715d]">
              Σύνολο
            </p>
            <p className="mt-2 text-lg font-semibold text-gray-900">
              {formatCurrency(latestActiveOrder.total_amount, currency)}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center justify-center rounded-2xl bg-[#1f2937] px-5 py-3 text-sm font-semibold text-white hover:bg-[#111827]"
          >
            Άνοιγμα παραγγελιών
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-[22px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] sm:rounded-[24px] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8b715d]">
            Next step
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
            {nextAction.title}
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#7b6657]">
            {nextAction.description}
          </p>
        </div>

        <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-[#8b715d]" />
      </div>

      <div className="mt-6">
        <Link
          href={nextAction.href}
          className="inline-flex items-center justify-center rounded-2xl bg-[#1f2937] px-5 py-3 text-sm font-semibold text-white hover:bg-[#111827]"
        >
          {nextAction.cta}
        </Link>
      </div>
    </div>
  )
}