'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils/format-currency'
import { getStatusMeta } from '@/lib/utils/order-status'
import type { OrderWithItems, TableWithActiveSession } from '@/types/database.types'

interface OrderCardProps {
  order: OrderWithItems
  availableTables?: TableWithActiveSession[]
  onAdvance?: (orderId: string) => void
  onCancel?: (orderId: string) => void
  onClearTable?: (orderId: string) => void
  onTransfer?: (orderId: string, targetTableId: string) => void
}

type OrderWithOptionalTable = OrderWithItems & {
  table?: {
    id?: string
    table_number?: string
    name?: string | null
  } | null
}

export function OrderCard({
  order,
  availableTables = [],
  onAdvance,
  onCancel,
  onClearTable,
  onTransfer,
}: OrderCardProps) {
  const meta = getStatusMeta(order.status)
  const safeOrder = order as OrderWithOptionalTable

  const [transferOpen, setTransferOpen] = useState(false)
  const [targetTableId, setTargetTableId] = useState('')

  const tableNumber = safeOrder.table?.table_number
  const tableName = safeOrder.table?.name?.trim()

  const tableLabel = tableNumber ? `Τραπέζι ${tableNumber}` : 'Τραπέζι'
  const tableSubtitle = tableName ? `${tableLabel} · ${tableName}` : tableLabel

  const filteredTables = useMemo(() => {
    return availableTables.filter((table) => table.id !== safeOrder.table?.id)
  }, [availableTables, safeOrder.table?.id])

  function handleTransferSubmit() {
    if (!targetTableId) return
    onTransfer?.(order.id, targetTableId)
    setTransferOpen(false)
    setTargetTableId('')
  }

  return (
    <div className="rounded-[24px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-gray-900">
            {tableSubtitle}
          </h3>
          <p className="mt-1 text-sm text-[#7b6657]">
            {new Date(order.created_at).toLocaleString('el-GR')}
          </p>
        </div>

        <Badge className={meta.badge}>{meta.label_el}</Badge>
      </div>

      <div className="space-y-3">
        {order.order_items?.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-[#f0e8df] bg-[#faf7f2] px-4 py-3"
          >
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-gray-900">
                {item.quantity}× {item.product_name_snapshot_el}
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {formatCurrency(item.line_total)}
              </p>
            </div>

            {item.order_item_options && item.order_item_options.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {item.order_item_options.map((option) => (
                  <span
                    key={option.id}
                    className="rounded-full bg-white px-2.5 py-1 text-[11px] text-[#6f6156] shadow-sm"
                  >
                    {option.option_group_name_el}: {option.option_choice_name_el}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {order.notes ? (
        <div className="mt-4 rounded-2xl border border-dashed border-[#e6dcd1] bg-[#fffdfb] px-4 py-3 text-sm text-[#6f6156]">
          Σημείωση: {order.notes}
        </div>
      ) : null}

      {transferOpen ? (
        <div className="mt-4 rounded-2xl border border-[#e6dcd1] bg-[#fffdfb] p-4">
          <p className="mb-2 text-sm font-medium text-gray-900">
            Μεταφορά παραγγελίας σε άλλο τραπέζι
          </p>

          <select
            value={targetTableId}
            onChange={(e) => setTargetTableId(e.target.value)}
            className="h-11 w-full rounded-xl border border-[#e7ddd3] bg-white px-3 text-sm text-gray-900 focus:border-[#c9b29d] focus:outline-none focus:ring-2 focus:ring-[#efe4d8]"
          >
            <option value="">Επιλέξτε ελεύθερο τραπέζι</option>
            {filteredTables.map((table) => (
              <option key={table.id} value={table.id}>
                Τραπέζι {table.table_number}
                {table.name ? ` · ${table.name}` : ''}
              </option>
            ))}
          </select>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              className="rounded-xl"
              onClick={handleTransferSubmit}
              disabled={!targetTableId}
            >
              Επιβεβαίωση μεταφοράς
            </Button>

            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="rounded-xl"
              onClick={() => {
                setTransferOpen(false)
                setTargetTableId('')
              }}
            >
              Άκυρο
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-lg font-semibold text-gray-900">
          Σύνολο: {formatCurrency(order.total_amount)}
        </p>

        <div className="flex flex-wrap gap-2">
          {order.status !== 'completed' &&
          order.status !== 'cancelled' &&
          meta.action_el ? (
            <Button
              type="button"
              size="sm"
              className="rounded-xl bg-[#1f2937] text-white hover:bg-[#111827]"
              onClick={() => onAdvance?.(order.id)}
            >
              {meta.action_el}
            </Button>
          ) : null}

          {order.status !== 'completed' && order.status !== 'cancelled' ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="rounded-xl text-[#6f6156] hover:bg-[#f5efe7] hover:text-[#1f2937]"
              onClick={() => onCancel?.(order.id)}
            >
              Ακύρωση
            </Button>
          ) : null}

          {order.status !== 'completed' && order.status !== 'cancelled' ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="rounded-xl text-[#6f6156] hover:bg-[#f5efe7] hover:text-[#1f2937]"
              onClick={() => setTransferOpen((prev) => !prev)}
            >
              Μεταφορά
            </Button>
          ) : null}

          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="rounded-xl text-[#6f6156] hover:bg-[#f5efe7] hover:text-[#1f2937]"
            onClick={() => onClearTable?.(order.id)}
          >
            Εκκαθάριση τραπεζιού
          </Button>
        </div>
      </div>
    </div>
  )
}