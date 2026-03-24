'use client'

import { formatCurrency } from '@/lib/utils/format-currency'

interface CartBarProps {
  totalItems: number
  totalAmount: number
  currency: string
  onOpen: () => void
}

export function CartBar({ totalItems, totalAmount, currency, onOpen }: CartBarProps) {
  if (totalItems === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#e8ddd2] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{totalItems} προϊόντα</p>
          <p className="text-sm text-[#7b6657]">
            {formatCurrency(totalAmount, currency)}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="rounded-2xl bg-[#1f2937] px-5 py-3 text-sm font-medium text-white shadow-[0_10px_24px_rgba(31,41,55,0.18)] transition hover:bg-[#111827]"
        >
          Προβολή παραγγελίας
        </button>
      </div>
    </div>
  )
}