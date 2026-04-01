'use client'

import { useMemo, useState } from 'react'
import { BellRing, ReceiptText } from 'lucide-react'
import { CategoryNav } from '@/components/customer/category-nav'
import { ProductGrid } from '@/components/customer/product-grid'
import { CartBar } from '@/components/customer/cart-bar'
import { CartSheet } from '@/components/customer/cart-sheet'
import { OrderConfirmation } from '@/components/customer/order-confirmation'
import { ErrorMessage } from '@/components/ui/error-message'
import { Button } from '@/components/ui/button'
import {
  placeOrder,
  requestBill,
  requestWaiter,
} from '@/lib/actions/orders.actions'
import { formatCurrency } from '@/lib/utils/format-currency'
import type {
  CartItem,
  CategoryWithProducts,
  CustomerMenuData,
  ServiceRequestType,
} from '@/types/database.types'

interface CustomerAppProps {
  data: CustomerMenuData
}

type MenuLanguage = 'en' | 'el'

function getLocalizedText(
  lang: MenuLanguage,
  greek?: string | null,
  english?: string | null,
  fallback?: string,
) {
  if (lang === 'en') {
    return english?.trim() || greek?.trim() || fallback || ''
  }

  return greek?.trim() || english?.trim() || fallback || ''
}

export function CustomerApp({ data }: CustomerAppProps) {
  const [language, setLanguage] = useState<MenuLanguage>('en')
  const [cart, setCart] = useState<CartItem[]>([])
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(
    data.categories[0]?.id ?? null,
  )
  const [cartOpen, setCartOpen] = useState(false)
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [serviceMessage, setServiceMessage] = useState<string | null>(null)
  const [serviceSubmitting, setServiceSubmitting] =
    useState<ServiceRequestType | null>(null)
  const [orderNotes, setOrderNotes] = useState('')

  const [optionProduct, setOptionProduct] = useState<
    CategoryWithProducts['products'][number] | null
  >(null)
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string>>({})
  const [optionError, setOptionError] = useState<string | null>(null)

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

  function openOptionsModal(product: CategoryWithProducts['products'][number]) {
    setOptionError(null)
    setOptionProduct(product)
    setSelectedChoices({})
  }

  function closeOptionsModal() {
    setOptionProduct(null)
    setSelectedChoices({})
    setOptionError(null)
  }

  function handleSelectChoice(groupId: string, choiceId: string) {
    setSelectedChoices((prev) => ({
      ...prev,
      [groupId]: prev[groupId] === choiceId ? '' : choiceId,
    }))
  }

  function addToCart(product: CategoryWithProducts['products'][number]) {
    const optionGroups = product.product_option_groups ?? []

    if (optionGroups.length > 0) {
      openOptionsModal(product)
      return
    }

    setCart((prev) => {
      const key = buildCartKey(product.id, [])
      const existing = prev.find((item) => item.key === key)
      const basePrice = Number(product.price ?? 0)

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
        name: getLocalizedText(language, product.name_el, product.name_en, 'Product'),
        base_price: basePrice,
        quantity: 1,
        options: [],
        line_total: basePrice,
      }

      return [...prev, nextItem]
    })
  }

  function handleConfirmOptions() {
    if (!optionProduct) return

    const optionGroups = optionProduct.product_option_groups ?? []

    for (const group of optionGroups) {
      if (group.is_required && !selectedChoices[group.id]) {
        setOptionError(
          language === 'en'
            ? `Please select: ${getLocalizedText(language, group.name_el, group.name_en, 'Option')}`
            : `Παρακαλώ επιλέξτε: ${getLocalizedText(language, group.name_el, group.name_en, 'Επιλογή')}`,
        )
        return
      }
    }

    const selectedOptionObjects = optionGroups
      .map((group) => {
        const selectedChoiceId = selectedChoices[group.id]
        if (!selectedChoiceId) return null

        const choice = group.product_option_choices?.find(
          (item) => item.id === selectedChoiceId,
        )
        if (!choice) return null

        return {
          group_id: group.id,
          group_name: getLocalizedText(language, group.name_el, group.name_en, 'Option'),
          choice_id: choice.id,
          choice_name: getLocalizedText(
            language,
            choice.name_el,
            choice.name_en,
            'Choice',
          ),
          price_delta: Number(choice.price_delta ?? 0),
        }
      })
      .filter(Boolean) as CartItem['options']

    const selectedChoiceIds = selectedOptionObjects.map((option) => option.choice_id)
    const basePrice = Number(optionProduct.price ?? 0)
    const optionExtra = selectedOptionObjects.reduce(
      (sum, option) => sum + Number(option.price_delta ?? 0),
      0,
    )
    const finalUnitPrice = basePrice + optionExtra

    setCart((prev) => {
      const key = buildCartKey(optionProduct.id, selectedChoiceIds)
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
        product_id: optionProduct.id,
        name: getLocalizedText(
          language,
          optionProduct.name_el,
          optionProduct.name_en,
          'Product',
        ),
        base_price: finalUnitPrice,
        quantity: 1,
        options: selectedOptionObjects,
        line_total: finalUnitPrice,
      }

      return [...prev, nextItem]
    })

    closeOptionsModal()
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

  function removeItem(key: string) {
    setCart((prev) => prev.filter((item) => item.key !== key))
  }

  function clearCart() {
    setCart([])
    setOrderNotes('')
  }

  async function handleSubmitOrder() {
    if (cart.length === 0) return

    setSubmitting(true)
    setSubmitError(null)
    setServiceMessage(null)

    const result = await placeOrder({
      p_business_id: data.business.id,
      p_table_id: data.table.id,
      p_notes: orderNotes.trim() || null,
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
    setOrderNotes('')
    setCartOpen(false)
    setConfirmationOpen(true)
  }

  async function handleServiceRequest(type: ServiceRequestType) {
    setSubmitError(null)
    setServiceMessage(null)
    setServiceSubmitting(type)

    const action =
      type === 'waiter'
        ? requestWaiter(data.business.id, data.table.id)
        : requestBill(data.business.id, data.table.id)

    const result = await action

    setServiceSubmitting(null)

    if (result.error) {
      setSubmitError(result.error)
      return
    }

    setServiceMessage(
      type === 'waiter'
        ? language === 'en'
          ? 'Waiter call sent successfully.'
          : 'Η κλήση σερβιτόρου στάλθηκε επιτυχώς.'
        : language === 'en'
          ? 'Bill request sent successfully.'
          : 'Το αίτημα λογαριασμού στάλθηκε επιτυχώς.',
    )
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = cart.reduce((sum, item) => sum + item.line_total, 0)

  const optionGroups = optionProduct?.product_option_groups ?? []
  const optionBasePrice = Number(optionProduct?.price ?? 0)
  const optionSelectedTotal = optionGroups.reduce((sum, group) => {
    const selectedChoiceId = selectedChoices[group.id]
    if (!selectedChoiceId) return sum

    const choice = group.product_option_choices?.find((item) => item.id === selectedChoiceId)
    return sum + Number(choice?.price_delta ?? 0)
  }, 0)
  const optionFinalPrice = optionBasePrice + optionSelectedTotal

  return (
    <div className="min-h-screen bg-[#f6f3ee] pb-28">
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
        <div className="mb-6 overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="bg-gradient-to-r from-[#1f2937] via-[#2b3442] to-[#7c5c46] px-6 py-8 text-white">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl">
                <p className="mb-2 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-white/90">
                  Digital Menu
                </p>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  {data.business.name}
                </h1>
                <p className="mt-2 text-sm text-white/80 sm:text-base">
                  {language === 'en'
                    ? 'Welcome. Browse the menu and place your order easily from your phone.'
                    : 'Καλώς ήρθατε. Δείτε το μενού και στείλτε την παραγγελία σας εύκολα από το κινητό.'}
                </p>

                <div className="mt-5 inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white">
                  {language === 'en'
                    ? `Table ${data.table.table_number}`
                    : `Τραπέζι ${data.table.table_number}`}
                </div>
              </div>

              <div className="inline-flex w-fit items-center rounded-full bg-white/10 p-1">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={
                    language === 'en'
                      ? 'rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#1f2937]'
                      : 'rounded-full px-4 py-2 text-sm font-semibold text-white/85'
                  }
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('el')}
                  className={
                    language === 'el'
                      ? 'rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#1f2937]'
                      : 'rounded-full px-4 py-2 text-sm font-semibold text-white/85'
                  }
                >
                  EL
                </button>
              </div>
            </div>
          </div>
        </div>

        {submitError ? (
          <div className="mb-4">
            <ErrorMessage message={submitError} />
          </div>
        ) : null}

        {serviceMessage ? (
          <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {serviceMessage}
          </div>
        ) : null}

        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => handleServiceRequest('waiter')}
            disabled={serviceSubmitting !== null}
            className="flex items-center justify-between rounded-[24px] border border-[#e7ddd3] bg-white px-5 py-4 text-left shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition hover:bg-[#fcfaf7] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f6efe8] text-[#7c5c46]">
                <BellRing className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">
                  {language === 'en' ? 'Call waiter' : 'Κλήση σερβιτόρου'}
                </p>
                <p className="mt-1 text-sm text-[#7b6657]">
                  {language === 'en'
                    ? 'Send a notification to the staff for your table.'
                    : 'Στείλτε ειδοποίηση στο προσωπικό για το τραπέζι σας.'}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-[#1f2937] px-4 py-2 text-sm font-semibold text-white">
              {serviceSubmitting === 'waiter'
                ? language === 'en'
                  ? 'Sending...'
                  : 'Αποστολή...'
                : language === 'en'
                  ? 'Call'
                  : 'Κλήση'}
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleServiceRequest('bill')}
            disabled={serviceSubmitting !== null}
            className="flex items-center justify-between rounded-[24px] border border-[#e7ddd3] bg-white px-5 py-4 text-left shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition hover:bg-[#fcfaf7] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f6efe8] text-[#7c5c46]">
                <ReceiptText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">
                  {language === 'en' ? 'Request bill' : 'Αίτημα λογαριασμού'}
                </p>
                <p className="mt-1 text-sm text-[#7b6657]">
                  {language === 'en'
                    ? 'Send a bill request to the staff.'
                    : 'Στείλτε αίτημα για λογαριασμό στο προσωπικό.'}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-[#1f2937] px-4 py-2 text-sm font-semibold text-white">
              {serviceSubmitting === 'bill'
                ? language === 'en'
                  ? 'Sending...'
                  : 'Αποστολή...'
                : language === 'en'
                  ? 'Request'
                  : 'Αίτημα'}
            </div>
          </button>
        </div>

        <div className="rounded-[24px] border border-black/5 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-5">
          <CategoryNav
            categories={data.categories}
            activeCategoryId={activeCategory?.id ?? null}
            onSelect={setActiveCategoryId}
            language={language}
          />
        </div>

        {activeCategory ? (
          <div className="mt-6">
            <ProductGrid
              category={activeCategory}
              currency={data.business.currency}
              onAdd={addToCart}
              language={language}
            />
          </div>
        ) : (
          <div className="mt-8 rounded-[24px] border border-dashed border-[#d9cec3] bg-white p-12 text-center text-sm text-gray-500 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            {language === 'en'
              ? 'There are no available categories.'
              : 'Δεν υπάρχουν διαθέσιμες κατηγορίες.'}
          </div>
        )}
      </div>

      <CartBar
        totalItems={totalItems}
        totalAmount={totalAmount}
        currency={data.business.currency}
        onOpen={() => setCartOpen(true)}
        language={language}
      />

      <CartSheet
        open={cartOpen}
        cart={cart}
        currency={data.business.currency}
        notes={orderNotes}
        onNotesChange={setOrderNotes}
        onClose={() => setCartOpen(false)}
        onIncrease={increaseItem}
        onDecrease={decreaseItem}
        onRemove={removeItem}
        onClearCart={clearCart}
        onSubmit={handleSubmitOrder}
        submitting={submitting}
        language={language}
      />

      <OrderConfirmation
        open={confirmationOpen}
        onClose={() => setConfirmationOpen(false)}
        language={language}
      />

      {optionProduct ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-black/5 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
            <div className="border-b border-[#eee5dc] px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {getLocalizedText(
                      language,
                      optionProduct.name_el,
                      optionProduct.name_en,
                      'Product',
                    )}
                  </h3>
                  <p className="mt-1 text-sm text-[#7b6657]">
                    {language === 'en'
                      ? 'Choose product options before adding it to your cart.'
                      : 'Επιλέξτε τις παραμέτρους του προϊόντος πριν το προσθέσετε.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeOptionsModal}
                  className="rounded-full p-2 text-gray-500 transition hover:bg-[#f6efe8] hover:text-gray-900"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-4 px-5 py-5 sm:px-6">
              {optionError ? <ErrorMessage message={optionError} /> : null}

              {optionGroups.map((group) => (
                <div
                  key={group.id}
                  className="rounded-2xl border border-[#ebe5dd] bg-[#faf7f2] p-4"
                >
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">
                        {getLocalizedText(language, group.name_el, group.name_en, 'Option')}
                      </h4>
                      <p className="mt-1 text-xs text-[#7b6657]">
                        {group.is_required
                          ? language === 'en'
                            ? 'Required option'
                            : 'Υποχρεωτική επιλογή'
                          : language === 'en'
                            ? 'Optional option'
                            : 'Προαιρετική επιλογή'}
                      </p>
                    </div>

                    {group.is_required ? (
                      <span className="rounded-full bg-[#1f2937] px-2.5 py-1 text-[11px] font-medium text-white">
                        {language === 'en' ? 'Required' : 'Υποχρεωτικό'}
                      </span>
                    ) : (
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-[#7b6657]">
                        {language === 'en' ? 'Optional' : 'Προαιρετικό'}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {group.product_option_choices?.map((choice) => {
                      const isSelected = selectedChoices[group.id] === choice.id
                      const extra = Number(choice.price_delta ?? 0)

                      return (
                        <button
                          key={choice.id}
                          type="button"
                          onClick={() => handleSelectChoice(group.id, choice.id)}
                          className={
                            isSelected
                              ? 'rounded-full border border-[#1f2937] bg-[#1f2937] px-4 py-2 text-sm font-medium text-white'
                              : 'rounded-full border border-[#d8cdc1] bg-white px-4 py-2 text-sm font-medium text-[#5f5146] transition hover:bg-[#f6efe8]'
                          }
                        >
                          {getLocalizedText(language, choice.name_el, choice.name_en, 'Choice')}
                          {extra > 0
                            ? ` (+${formatCurrency(extra, data.business.currency)})`
                            : ''}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#eee5dc] px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-[#8a6d58]">
                    {language === 'en' ? 'Final price' : 'Τελική τιμή'}
                  </p>
                  <p className="mt-1 text-xl font-semibold text-gray-900">
                    {formatCurrency(optionFinalPrice, data.business.currency)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-xl"
                    onClick={closeOptionsModal}
                  >
                    {language === 'en' ? 'Cancel' : 'Άκυρο'}
                  </Button>

                  <Button
                    type="button"
                    className="rounded-xl bg-[#1f2937] text-white hover:bg-[#111827]"
                    onClick={handleConfirmOptions}
                  >
                    {language === 'en' ? 'Add to cart' : 'Προσθήκη στο καλάθι'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}