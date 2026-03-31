'use client'

import { ShoppingBag } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format-currency'

type MenuLanguage = 'en' | 'el'

interface CartBarProps {
  totalItems: number
  totalAmount: number
  currency: string
  onOpen: () => void
  language: MenuLanguage
}

export function CartBar({
  totalItems,
  totalAmount,
  currency,
  onOpen,
  language,
}: CartBarProps) {
  if (totalItems === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#e8ddd2] bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={onOpen}
          className="flex w-full items-center justify-between gap-4 rounded-[24px] bg-[#1f2937] px-4 py-3 text-left text-white shadow-[0_10px_24px_rgba(31,41,55,0.18)] transition hover:bg-[#111827]"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <ShoppingBag className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold">
                {language === 'en'
                  ? `${totalItems} ${totalItems === 1 ? 'item' : 'items'}`
                  : `${totalItems} ${totalItems === 1 ? 'προϊόν' : 'προϊόντα'}`}
              </p>
              <p className="text-sm text-white/75">
                {language === 'en' ? 'Total' : 'Σύνολο'}:{' '}
                {formatCurrency(totalAmount, currency)}
              </p>
            </div>
          </div>

          <div className="shrink-0 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-[#1f2937]">
            {language === 'en' ? 'View' : 'Προβολή'}
          </div>
        </button>
      </div>
    </div>
  )
}