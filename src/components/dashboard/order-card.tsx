'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils/format-currency'
import { getStatusMeta } from '@/lib/utils/order-status'
import type { OrderWithItems } from '@/types/database.types'

interface OrderCardProps {
  order: OrderWithItems
  onAdvance?: (orderId: string) => void
  onCancel?: (orderId: string) => void
}

export function OrderCard({ order, onAdvance, onCancel }: OrderCardProps) {
  const meta = getStatusMeta(order.status)

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Τραπέζι {order.table?.table_number ?? '-'}
          </h3>
          <p className="text-xs text-gray-500">
            {new Date(order.created_at).toLocaleString('el-GR')}
          </p>
        </div>
        <Badge className={meta.badge}>{meta.label_el}</Badge>
      </div>

      <div className="space-y-2">
        {order.items?.map((item) => (
          <div key={item.id} className="rounded-lg bg-gray-50 px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-gray-900">
                {item.quantity}× {item.product_name_snapshot_el}
              </p>
              <p className="text-sm text-gray-700">{formatCurrency(item.line_total)}</p>
            </div>

            {item.options && item.options.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {item.options.map((option) => (
                  <span
                    key={option.id}
                    className="rounded-full bg-white px-2 py-0.5 text-[11px] text-gray-600"
                  >
                    {option.option_group_name_el}: {option.option_choice_name_el}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {order.notes && (
        <div className="mt-3 rounded-lg border border-dashed border-gray-200 px-3 py-2 text-xs text-gray-600">
          Σημείωση: {order.notes}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">
          Σύνολο: {formatCurrency(order.total_amount)}
        </p>

        <div className="flex gap-2">
          {order.status !== 'completed' && order.status !== 'cancelled' && meta.action_el && (
            <Button
              type="button"
              size="sm"
              onClick={() => onAdvance?.(order.id)}
            >
              {meta.action_el}
            </Button>
          )}

          {order.status !== 'completed' && order.status !== 'cancelled' && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onCancel?.(order.id)}
            >
              Ακύρωση
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}