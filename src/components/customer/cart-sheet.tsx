'use client'

import { useEffect } from 'react'
import { ShoppingBag, StickyNote, Trash2, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format-currency'
import type { CartItem } from '@/types/database.types'

type MenuLanguage = 'en' | 'el'

interface CartSheetProps {
  open: boolean
  cart: CartItem[]
  currency: string
  notes: string
  onNotesChange: (value: string) => void
  onClose: () => void
  onIncrease: (key: string) => void
  onDecrease: (key: string) => void
  onRemove: (key: string) => void
  onSubmit: () => void | Promise<void>
  submitting?: boolean
  language: MenuLanguage
}

export function CartSheet({
  open,
  cart,
  currency,
  notes,
  onNotesChange,
  onClose,
  onIncrease,
  onDecrease,
  onRemove,
  onSubmit,
  submitting = false,
  language,
}: CartSheetProps) {
  useEffect(() => {
    if (!open) return

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow

    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
    }
  }, [open])

  if (!open) return null

  const totalAmount = cart.reduce((sum, item) => sum + item.line_total, 0)
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)

  async function handleSubmitClick() {
    if (submitting) return
    if (cart.length === 0) return
    await onSubmit()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <button
        type="button"
        className="absolute inset-0 bg-[#111827]/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="absolute inset-x-0 bottom-0 flex max-h-[92vh] flex-col rounded-t-[30px] border-t border-[#eadfd3] bg-[#fcfaf7] shadow-[0_-10px_40px_rgba(15,23,42,0.12)]">
        <div className="mx-auto flex w-full max-w-5xl min-h-0 flex-1 flex-col px-4 pb-5 pt-4 sm:px-6">
          <div className="mb-4 flex shrink-0 items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8a6d58]">
                Checkout
              </p>
              <h3 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
                {language === 'en' ? 'Your order' : 'Η παραγγελία σας'}
              </h3>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#e8ddd2] bg-white text-[#6b5a4f] transition hover:bg-[#f8f3ee]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {cart.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-[#d9cec3] bg-white p-10 text-center text-sm text-gray-500">
              {language === 'en' ? 'Your cart is empty.' : 'Το καλάθι είναι άδειο.'}
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="space-y-4 pb-2">
                <div className="rounded-[22px] border border-[#eee5dc] bg-white px-4 py-3 text-sm text-[#6b5a4f]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f6efe8] text-[#7c5c46]">
                      <ShoppingBag className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="font-semibold text-gray-900">
                        {language === 'en'
                          ? `${totalItems} ${totalItems === 1 ? 'item' : 'items'} in cart`
                          : `${totalItems} ${totalItems === 1 ? 'προϊόν' : 'προϊόντα'} στο καλάθι`}
                      </p>
                      <p className="text-[#7b6657]">
                        {language === 'en' ? 'Total' : 'Σύνολο'}:{' '}
                        {formatCurrency(totalAmount, currency)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
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
                            {formatCurrency(item.base_price, currency)} /{' '}
                            {language === 'en' ? 'item' : 'τεμ.'}
                          </p>

                          {item.options.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {item.options.map((option) => (
                                <span
                                  key={option.choice_id}
                                  className="rounded-full bg-[#f6efe8] px-2.5 py-1 text-[11px] text-[#6f6156]"
                                >
                                  {option.group_name}: {option.choice_name}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <p className="whitespace-nowrap text-base font-semibold text-gray-900">
                            {formatCurrency(item.line_total, currency)}
                          </p>

                          <button
                            type="button"
                            onClick={() => onRemove(item.key)}
                            className="inline-flex items-center gap-1 rounded-xl border border-[#eadfd3] bg-white px-2.5 py-1.5 text-xs font-medium text-[#7b6657] hover:bg-[#f8f3ee]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {language === 'en' ? 'Remove' : 'Αφαίρεση'}
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
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

                        <p className="text-xs text-[#8a6d58]">
                          {formatCurrency(item.base_price, currency)} × {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-[24px] border border-[#eadfd3] bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,0.04)]">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f6efe8] text-[#7c5c46]">
                      <StickyNote className="h-5 w-5" />
                    </div>

                    <div>
                      <label
                        htmlFor="order-notes"
                        className="block text-sm font-medium text-gray-900"
                      >
                        {language === 'en' ? 'Order note' : 'Σημείωση παραγγελίας'}
                      </label>
                      <p className="text-xs text-[#7b6657]">
                        {language === 'en'
                          ? 'Optional, for special instructions to the staff.'
                          : 'Προαιρετικό, για ειδικές οδηγίες προς το προσωπικό.'}
                      </p>
                    </div>
                  </div>

                  <textarea
                    id="order-notes"
                    value={notes}
                    onChange={(e) => onNotesChange(e.target.value)}
                    placeholder={
                      language === 'en'
                        ? 'e.g. no ice, with a little milk, please bring water too'
                        : 'π.χ. χωρίς πάγο, με λίγο γάλα, φέρτε και νερό'
                    }
                    rows={3}
                    className="w-full rounded-2xl border border-[#e7ddd3] bg-[#fffdfa] px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#c9b29d] focus:ring-2 focus:ring-[#efe4d8]"
                  />
                </div>

                <div className="rounded-[24px] border border-[#eadfd3] bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,0.04)]">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-[#7b6657]">
                        {language === 'en' ? 'Final total' : 'Τελικό σύνολο'}
                      </p>
                      <p className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
                        {formatCurrency(totalAmount, currency)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#f6efe8] px-3 py-2 text-right">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a6d58]">
                        {language === 'en' ? 'Ready to send' : 'Έτοιμο για αποστολή'}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {language === 'en'
                          ? `${totalItems} ${totalItems === 1 ? 'item' : 'items'}`
                          : `${totalItems} ${totalItems === 1 ? 'είδος' : 'είδη'}`}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmitClick}
                    disabled={submitting || cart.length === 0}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-[#1f2937] px-4 py-3 text-sm font-semibold text-white hover:bg-[#111827] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting
                      ? language === 'en'
                        ? 'Sending order...'
                        : 'Αποστολή παραγγελίας...'
                      : language === 'en'
                        ? 'Send order'
                        : 'Αποστολή παραγγελίας'}
                  </button>

                  <p className="mt-3 text-center text-xs text-[#8a6d58]">
                    {language === 'en'
                      ? 'Your order is sent directly to the staff.'
                      : 'Η παραγγελία αποστέλλεται άμεσα στο προσωπικό του καταστήματος.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}