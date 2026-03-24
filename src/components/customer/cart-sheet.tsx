'use client'

import { formatCurrency } from '@/lib/utils/format-currency'
import { Button } from '@/components/ui/button'
import type { CartItem } from '@/types/database.types'

interface CartSheetProps {
  open: boolean
  cart: CartItem[]
  currency: string
  onClose: () => void
  onIncrease: (key: string) => void
  onDecrease: (key: string) => void
  onSubmit: () => void
  submitting?: boolean
}

export function CartSheet({
  open,
  cart,
  currency,
  onClose,
  onIncrease,
  onDecrease,
  onSubmit,
  submitting = false,
}: CartSheetProps) {
  if (!open) return null

  const totalAmount = cart.reduce((sum, item) => sum + item.line_total, 0)
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-[#111827]/35 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="absolute bottom-0 left-0 right-0 rounded-t-[28px] border-t border-[#eadfd3] bg-[#fcfaf7] shadow-[0_-10px_40px_rgba(15,23,42,0.12)]">
        <div className="mx-auto max-w-5xl px-4 pb-6 pt-4 sm:px-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8a6d58]">
                Your order
              </p>
              <h3 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
                Η παραγγελία σας
              </h3>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#e8ddd2] bg-white px-4 py-2 text-sm font-medium text-[#6b5a4f] transition hover:bg-[#f8f3ee]"
            >
              Κλείσιμο
            </button>
          </div>

          {cart.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-[#d9cec3] bg-white p-10 text-center text-sm text-gray-500">
              Το καλάθι είναι άδειο.
            </div>
          ) : (
            <>
              <div className="mb-4 rounded-[22px] border border-[#eee5dc] bg-white px-4 py-3 text-sm text-[#6b5a4f]">
                <span className="font-semibold text-gray-900">{totalItems}</span> προϊόντα στο καλάθι
              </div>

              <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.key}
                    className="rounded-[22px] border border-[#eee5dc] bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,0.04)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-gray-900">
                          {item.name}
                        </p>
                        <p className="mt-1 text-sm text-[#7b6657]">
                          {formatCurrency(item.base_price, currency)} / τεμ.
                        </p>
                      </div>

                      <p className="whitespace-nowrap text-base font-semibold text-gray-900">
                        {formatCurrency(item.line_total, currency)}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onDecrease(item.key)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e5d8cb] bg-[#faf7f2] text-lg font-semibold text-gray-800 transition hover:bg-[#f3ece4]"
                      >
                        −
                      </button>

                      <div className="min-w-8 text-center text-sm font-semibold text-gray-900">
                        {item.quantity}
                      </div>

                      <button
                        type="button"
                        onClick={() => onIncrease(item.key)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e5d8cb] bg-[#faf7f2] text-lg font-semibold text-gray-800 transition hover:bg-[#f3ece4]"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-[24px] border border-[#eadfd3] bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,0.04)]">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#7b6657]">Σύνολο παραγγελίας</p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
                      {formatCurrency(totalAmount, currency)}
                    </p>
                  </div>
                </div>

                <Button
                  className="w-full rounded-2xl bg-[#1f2937] py-3 text-white hover:bg-[#111827]"
                  onClick={onSubmit}
                  loading={submitting}
                >
                  Ολοκλήρωση παραγγελίας
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}