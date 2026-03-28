import {
  ClipboardList,
  CheckCircle2,
  Clock3,
  XCircle,
  BellRing,
} from 'lucide-react'
import { getOrdersByBusiness } from '@/lib/actions/orders.actions'
import type { ServiceRequestType } from '@/types/database.types'
import { OrdersClient } from './orders-client'

const SERVICE_REQUEST_PREFIX = '__SERVICE_REQUEST__:'

function getServiceRequestType(notes?: string | null): ServiceRequestType | null {
  if (!notes?.startsWith(SERVICE_REQUEST_PREFIX)) return null

  const value = notes.replace(SERVICE_REQUEST_PREFIX, '').trim()

  if (value === 'waiter' || value === 'bill') return value
  return null
}

export default async function DashboardOrdersPage() {
  const { data: orders, error } = await getOrdersByBusiness()

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-3xl font-semibold tracking-tight text-gray-900">
          Παραγγελίες
        </h2>
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Σφάλμα φόρτωσης παραγγελιών: {error}
        </div>
      </div>
    )
  }

  const safeOrders = orders ?? []

  const regularOrders = safeOrders.filter((order) => !getServiceRequestType(order.notes))
  const serviceOrders = safeOrders.filter(
    (order) =>
      !!getServiceRequestType(order.notes) &&
      order.status !== 'completed' &&
      order.status !== 'cancelled',
  )

  const activeOrders = regularOrders.filter(
    (order) => order.status !== 'completed' && order.status !== 'cancelled',
  ).length

  const completedOrders = regularOrders.filter(
    (order) => order.status === 'completed',
  ).length

  const cancelledOrders = regularOrders.filter(
    (order) => order.status === 'cancelled',
  ).length

  const newOrders = regularOrders.filter((order) => order.status === 'new').length

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8b715d]">
          Live operations
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
          Παραγγελίες
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#7b6657]">
          Live ροή παραγγελιών της επιχείρησης και άμεση διαχείριση κατάστασης.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-[22px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5efe7] text-[#7c5c46]">
            <ClipboardList className="h-5 w-5" />
          </div>
          <p className="text-sm text-[#7b6657]">Ενεργές παραγγελίες</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
            {activeOrders}
          </p>
        </div>

        <div className="rounded-[22px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5efe7] text-[#7c5c46]">
            <BellRing className="h-5 w-5" />
          </div>
          <p className="text-sm text-[#7b6657]">Service requests</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
            {serviceOrders.length}
          </p>
        </div>

        <div className="rounded-[22px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5efe7] text-[#7c5c46]">
            <Clock3 className="h-5 w-5" />
          </div>
          <p className="text-sm text-[#7b6657]">Νέες παραγγελίες</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
            {newOrders}
          </p>
        </div>

        <div className="rounded-[22px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5efe7] text-[#7c5c46]">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <p className="text-sm text-[#7b6657]">Ολοκληρωμένες</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
            {completedOrders}
          </p>
        </div>

        <div className="rounded-[22px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5efe7] text-[#7c5c46]">
            <XCircle className="h-5 w-5" />
          </div>
          <p className="text-sm text-[#7b6657]">Ακυρωμένες</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
            {cancelledOrders}
          </p>
        </div>
      </div>

      <OrdersClient initialOrders={safeOrders} />
    </div>
  )
}