'use client'

import { useState, useTransition } from 'react'
import { createCategory, createProduct } from '@/lib/actions/menu.actions'
import { Button } from '@/components/ui/button'
import { Input, Field } from '@/components/ui/input'
import { ErrorMessage } from '@/components/ui/error-message'
import { formatCurrency } from '@/lib/utils/format-currency'
import type { Category, Product } from '@/types/database.types'

interface MenuManagerProps {
  businessId: string
  currency: string
  categories: Category[]
  products: Product[]
}

export function MenuManager({
  businessId,
  currency,
  categories,
  products,
}: MenuManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [productError, setProductError] = useState<string | null>(null)
  const [categorySuccess, setCategorySuccess] = useState<string | null>(null)
  const [productSuccess, setProductSuccess] = useState<string | null>(null)

  function handleCreateCategory(formData: FormData) {
    startTransition(async () => {
      setCategoryError(null)
      setCategorySuccess(null)

      const name = (formData.get('name_el') as string)?.trim()
      if (!name) {
        setCategoryError('Απαιτείται όνομα κατηγορίας.')
        return
      }

      const result = await createCategory({
        business_id: businessId,
        name_el: name,
        name_en: null,
        sort_order: categories.length + 1,
        is_active: true,
      })

      if (result.error) {
        setCategoryError(result.error)
        return
      }

      setCategorySuccess('Η κατηγορία δημιουργήθηκε.')
    })
  }

  function handleCreateProduct(formData: FormData) {
    startTransition(async () => {
      setProductError(null)
      setProductSuccess(null)

      const name = (formData.get('name_el') as string)?.trim()
      const categoryId = (formData.get('category_id') as string)?.trim()
      const rawPrice = (formData.get('price') as string)?.trim()

      if (!name || !categoryId || !rawPrice) {
        setProductError('Συμπληρώστε όνομα, κατηγορία και τιμή.')
        return
      }

      const price = Number(rawPrice.replace(',', '.'))
      if (Number.isNaN(price) || price < 0) {
        setProductError('Η τιμή δεν είναι έγκυρη.')
        return
      }

      const result = await createProduct({
        business_id: businessId,
        category_id: categoryId,
        name_el: name,
        name_en: null,
        description_el:
          ((formData.get('description_el') as string) || '').trim() || null,
        description_en: null,
        price,
        image_url: null,
        is_available: true,
        sort_order: products.length + 1,
      })

      if (result.error) {
        setProductError(result.error)
        return
      }

      setProductSuccess('Το προϊόν δημιουργήθηκε.')
    })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-[24px] border border-[#ebe5dd] bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8b715d]">
              Category setup
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
              Νέα κατηγορία
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#7b6657]">
              Προσθέστε νέα κατηγορία ώστε να οργανώσετε καλύτερα το μενού σας.
            </p>
          </div>

          <form action={handleCreateCategory} className="space-y-4">
            <ErrorMessage message={categoryError} />
            {categorySuccess ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {categorySuccess}
              </div>
            ) : null}

            <Field label="Όνομα κατηγορίας" htmlFor="name_el" required>
              <Input
                id="name_el"
                name="name_el"
                placeholder="π.χ. Καφέδες"
                required
                className="rounded-2xl border-[#e7ddd3] bg-[#fffdfa] py-3"
              />
            </Field>

            <Button type="submit" loading={isPending} className="rounded-2xl">
              Δημιουργία κατηγορίας
            </Button>
          </form>
        </div>

        <div className="rounded-[24px] border border-[#ebe5dd] bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8b715d]">
              Existing categories
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
              Υπάρχουσες κατηγορίες
            </h3>
          </div>

          {categories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d8cdc1] bg-[#fffdfa] px-4 py-8 text-center text-sm text-[#7b6657]">
              Δεν υπάρχουν κατηγορίες ακόμα.
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((category, index) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between rounded-2xl border border-[#eee5dc] bg-[#faf7f2] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {category.name_el}
                    </p>
                    <p className="mt-1 text-xs text-[#7b6657]">
                      Κατηγορία #{index + 1}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs text-[#7b6657] shadow-sm">
                    Ενεργή
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-[24px] border border-[#ebe5dd] bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8b715d]">
              Product setup
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
              Νέο προϊόν
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#7b6657]">
              Προσθέστε προϊόν σε υπάρχουσα κατηγορία για να εμφανιστεί στο customer menu.
            </p>
          </div>

          <form action={handleCreateProduct} className="space-y-4">
            <ErrorMessage message={productError} />
            {productSuccess ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {productSuccess}
              </div>
            ) : null}

            <Field label="Όνομα προϊόντος" htmlFor="product_name_el" required>
              <Input
                id="product_name_el"
                name="name_el"
                placeholder="π.χ. Freddo Espresso"
                required
                className="rounded-2xl border-[#e7ddd3] bg-[#fffdfa] py-3"
              />
            </Field>

            <Field label="Κατηγορία" htmlFor="category_id" required>
              <select
                id="category_id"
                name="category_id"
                className="h-12 w-full rounded-2xl border border-[#e7ddd3] bg-[#fffdfa] px-4 text-sm text-gray-900 focus:border-[#c9b29d] focus:outline-none focus:ring-2 focus:ring-[#efe4d8]"
                required
                defaultValue=""
              >
                <option value="" disabled>
                  Επιλέξτε κατηγορία
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name_el}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Περιγραφή" htmlFor="description_el">
              <Input
                id="description_el"
                name="description_el"
                placeholder="π.χ. Διπλός παγωμένος espresso"
                className="rounded-2xl border-[#e7ddd3] bg-[#fffdfa] py-3"
              />
            </Field>

            <Field label="Τιμή" htmlFor="price" required>
              <Input
                id="price"
                name="price"
                placeholder="π.χ. 3.50"
                required
                className="rounded-2xl border-[#e7ddd3] bg-[#fffdfa] py-3"
              />
            </Field>

            <Button type="submit" loading={isPending} className="rounded-2xl">
              Δημιουργία προϊόντος
            </Button>
          </form>
        </div>

        <div className="rounded-[24px] border border-[#ebe5dd] bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8b715d]">
              Existing products
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
              Υπάρχοντα προϊόντα
            </h3>
          </div>

          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d8cdc1] bg-[#fffdfa] px-4 py-8 text-center text-sm text-[#7b6657]">
              Δεν υπάρχουν προϊόντα ακόμα.
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-2xl border border-[#eee5dc] bg-[#faf7f2] px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {product.name_el}
                    </p>
                    <p className="mt-1 truncate text-xs text-[#7b6657]">
                      {product.description_el ?? 'Χωρίς περιγραφή'}
                    </p>
                  </div>
                  <p className="ml-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {formatCurrency(Number(product.price ?? 0), currency)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}