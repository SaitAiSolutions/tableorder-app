'use client'

import { useMemo, useState } from 'react'
import { CategoryNav } from '@/components/customer/category-nav'
import { ProductGrid } from '@/components/customer/product-grid'
import { CartBar } from '@/components/customer/cart-bar'
import { CartSheet } from '@/components/customer/cart-sheet'
import { OrderConfirmation } from '@/components/customer/order-confirmation'
import { ErrorMessage } from '@/components/ui/error-message'
import { placeOrder } from '@/lib/actions/orders.actions'
import type {
  CartItem,
  CategoryWithProducts,
  CustomerMenuData,
} from '@/types/database.types'

interface CustomerAppProps {
  data: CustomerMenuData
}

export function CustomerApp({ data }: CustomerAppProps) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(
    data.categories[0]?.id ?? null,
  )
  const [cartOpen, setCartOpen] = useState(false)
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const activeCategory = useMemo(
    () =>
      data.categories.find((c) => c.id === activeCategoryId) ??
      data.categories[0] ??
      null,
    [data.categories, activeCategoryId],
  )

  function buildCartKey(productId: string, choiceIds: string[] = []) {
    const sorted = [...choiceIds].sort()
    return `${productId}::${sorted.join(',')}`
  }

  function addToCart(product: CategoryWithProducts['products'][number]) {
    setCart((prev) => {
      const key = buildCartKey(product.id, [])

      const existing = prev.find((item) => item.key === key)

      if (existing) {
        return prev.map((item) =>
          item.key === existing.key
            ? {
                ...item,
                quantity: item.quantity + 1,
                line_total: (item.quantity + 1) * item.base_price,
              }
            : item,
        )
      }

      const nextItem: CartItem = {
        key,
        product_id: product.id,
        name: product.name_el,
        base_price: Number(product.price ?? 0),
        quantity: 1,
        options: [],
        line_total: Number(product.price ?? 0),
      }

      return [...prev, nextItem]
    })
  }

  function increaseItem(key: string) {
    setCart((prev) =>
      prev.map((item) =>
        item.key === key
          ? {
              ...item,
              quantity: item.quantity + 1,
              line_total: (item.quantity + 1) * item.base_price,
            }
          : item,
      ),
    )
  }

  function decreaseItem(key: string) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.key === key
            ? {
                ...item,
                quantity: item.quantity - 1,
                line_total: (item.quantity - 1) * item.base_price,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  async function handleSubmitOrder() {
    if (cart.length === 0) return

    setSubmitting(true)
    setSubmitError(null)

    const result = await placeOrder({
      p_business_id: data.business.id,
      p_table_id: data.table.id,
      p_notes: null,
      p_items: cart.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        choice_ids: item.options.map((opt) => opt.choice_id),
      })),
    })

    setSubmitting(false)

    if (result.error) {
      setSubmitError(result.error)
      return
    }

    setCart([])
    setCartOpen(false)
    setConfirmationOpen(true)
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = cart.reduce((sum, item) => sum + item.line_total, 0)

  return (
    <div className="min-h-screen bg-[#f6f3ee] pb-28">
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
        <div className="mb-6 overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="bg-gradient-to-r from-[#1f2937] via-[#2b3442] to-[#7c5c46] px-6 py-8 text-white">
            <div className="max-w-2xl">
              <p className="mb-2 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-white/90">
                Digital Menu
              </p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {data.business.name}
              </h1>
              <p className="mt-2 text-sm text-white/80 sm:text-base">
                Καλώς ήρθατε. Δείτε το μενού και στείλτε την παραγγελία σας
                εύκολα από το κινητό.
              </p>

              <div className="mt-5 inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white">
                Τραπέζι {data.table.table_number}
              </div>
            </div>
          </div>
        </div>

        {submitError ? (
          <div className="mb-4">
            <ErrorMessage message={submitError} />
          </div>
        ) : null}

        <div className="rounded-[24px] border border-black/5 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-5">
          <CategoryNav
            categories={data.categories}
            activeCategoryId={activeCategory?.id ?? null}
            onSelect={setActiveCategoryId}
          />
        </div>

        {activeCategory ? (
          <div className="mt-6">
            <ProductGrid
              category={activeCategory}
              currency={data.business.currency}
              onAdd={addToCart}
            />
          </div>
        ) : (
          <div className="mt-8 rounded-[24px] border border-dashed border-[#d9cec3] bg-white p-12 text-center text-sm text-gray-500 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            Δεν υπάρχουν διαθέσιμες κατηγορίες.
          </div>
        )}
      </div>

      <CartBar
        totalItems={totalItems}
        totalAmount={totalAmount}
        currency={data.business.currency}
        onOpen={() => setCartOpen(true)}
      />

      <CartSheet
        open={cartOpen}
        cart={cart}
        currency={data.business.currency}
        onClose={() => setCartOpen(false)}
        onIncrease={increaseItem}
        onDecrease={decreaseItem}
        onSubmit={handleSubmitOrder}
        submitting={submitting}
      />

      <OrderConfirmation
        open={confirmationOpen}
        onClose={() => setConfirmationOpen(false)}
      />
    </div>
  )
}