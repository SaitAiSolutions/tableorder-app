'use client'

import Link from 'next/link'
import { ArrowRight, BellRing, ReceiptText } from 'lucide-react'
import { useMemo } from 'react'
import { useRealtimeOrders } from '@/hooks/use-realtime-orders'
import { formatCurrency } from '@/lib/utils/format-currency'
import type {
  OrderWithItems,
  ServiceRequestType,
} from '@/types/database.types'

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

const SERVICE_REQUEST_PREFIX = '__SERVICE_REQUEST__:'

function getServiceRequestType(notes?: string | null): ServiceRequestType | null {
  if (!notes?.startsWith(SERVICE_REQUEST_PREFIX)) return null

  const value = notes.replace(SERVICE_REQUEST_PREFIX, '').trim()

  if (value === 'waiter' || value === 'bill') return value
  return null
}

function getServiceRequestLabel(type: ServiceRequestType) {
  return type === 'waiter' ? 'Κλήση σερβιτόρου' : 'Αίτημα λογαριασμού'
}

function getOrderStatusLabel(status: string) {
  if (status === 'new') return 'Νέα'
  if (status === 'accepted') return 'Αποδεκτή'
  if (status === 'preparing') return 'Σε προετοιμασία'
  if (status === 'ready') return 'Έτοιμη'
  if (status === 'completed') return 'Ολοκληρωμένη'
  if (status === 'cancelled') return 'Ακυρωμένη'
  return status
}

function getTableDisplayTitle(table?: {
  table_number?: string
  name?: string | null
} | null) {
  const number = String(table?.table_number ?? '').trim()
  const name = String(table?.name ?? '').trim()

  if (number && name) return `Τραπέζι ${number} · ${name}`
  if (number) return `Τραπέζι ${number}`
  if (name) return name
  return 'Τραπέζι'
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

  const prioritizedActiveItem = useMemo(() => {
    const activeServiceRequest = activeOrders.find((order) =>
      !!getServiceRequestType(order.notes),
    ) as OrderWithOptionalTable | undefined

    if (activeServiceRequest) return activeServiceRequest

    return activeOrders.find((order) => !getServiceRequestType(order.notes)) as
      | OrderWithOptionalTable
      | undefined
  }, [activeOrders])

  if (prioritizedActiveItem) {
    const serviceType = getServiceRequestType(prioritizedActiveItem.notes)
    const tableTitle = getTableDisplayTitle(prioritizedActiveItem.table)

    return (
      <div className="rounded-[22px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] sm:rounded-[24px] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8b715d]">
              Live activity
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
              {serviceType ? getServiceRequestLabel(serviceType) : 'Νέα ενεργή παραγγελία'}
            </h3>
            <p className="mt-3 text-sm leading-6 text-[#7b6657]">
              {tableTitle}
            </p>
          </div>

          <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-[#8b715d]" />
        </div>

        {serviceType ? (
          <div className="mt-5 rounded-[22px] border border-[#eadfd3] bg-[#fcfaf7] p-4">
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
                  Το τραπέζι ζητά εξυπηρέτηση
                </p>
                <p className="mt-1 text-sm text-[#7b6657]">
                  Ανοίξτε τις παραγγελίες για να ολοκληρώσετε το αίτημα.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-[#faf7f2] px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#8b715d]">
                Status
              </p>
              <p className="mt-2 text-lg font-semibold text-gray-900">
                {getOrderStatusLabel(prioritizedActiveItem.status)}
              </p>
            </div>

            <div className="rounded-2xl bg-[#faf7f2] px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#8b715d]">
                Είδη
              </p>
              <p className="mt-2 text-lg font-semibold text-gray-900">
                {prioritizedActiveItem.order_items?.length ?? 0}
              </p>
            </div>

            <div className="rounded-2xl bg-[#faf7f2] px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#8b715d]">
                Σύνολο
              </p>
              <p className="mt-2 text-lg font-semibold text-gray-900">
                {formatCurrency(prioritizedActiveItem.total_amount, currency)}
              </p>
            </div>
          </div>
        )}

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