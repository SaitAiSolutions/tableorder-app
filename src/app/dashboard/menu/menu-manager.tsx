'use client'

import Image from 'next/image'
import { useState, useTransition } from 'react'
import {
  createCategory,
  createOptionChoice,
  createOptionGroup,
  createProduct,
  deleteCategory,
  deleteOptionChoice,
  deleteOptionGroup,
  deleteProduct,
  moveCategoryDown,
  moveCategoryUp,
  updateCategory,
  updateProduct,
  uploadProductImage,
} from '@/lib/actions/menu.actions'
import { Button } from '@/components/ui/button'
import { Input, Field } from '@/components/ui/input'
import { ErrorMessage } from '@/components/ui/error-message'
import { formatCurrency } from '@/lib/utils/format-currency'
import type {
  Category,
  ProductWithOptions,
  ProductOptionGroup,
} from '@/types/database.types'

interface MenuManagerProps {
  businessId: string
  currency: string
  categories: Category[]
  products: ProductWithOptions[]
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

  const [selectedProductFileName, setSelectedProductFileName] = useState('')
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingCategoryName, setEditingCategoryName] = useState('')

  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [editingProductName, setEditingProductName] = useState('')
  const [editingProductDescription, setEditingProductDescription] = useState('')
  const [editingProductPrice, setEditingProductPrice] = useState('')
  const [editingProductCategoryId, setEditingProductCategoryId] = useState('')
  const [editingProductFileName, setEditingProductFileName] = useState('')

  const [openGroupProductId, setOpenGroupProductId] = useState<string | null>(null)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupRequired, setNewGroupRequired] = useState(false)

  const [openChoiceGroupId, setOpenChoiceGroupId] = useState<string | null>(null)
  const [newChoiceName, setNewChoiceName] = useState('')
  const [newChoicePriceDelta, setNewChoicePriceDelta] = useState('0')

  function resetMessages() {
    setCategoryError(null)
    setCategorySuccess(null)
    setProductError(null)
    setProductSuccess(null)
  }

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

      const createResult = await createProduct({
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

      if (createResult.error || !createResult.data) {
        setProductError(createResult.error ?? 'Αποτυχία δημιουργίας προϊόντος.')
        return
      }

      const imageFile = formData.get('image') as File | null

      if (imageFile && imageFile.size > 0) {
        const uploadResult = await uploadProductImage(
          businessId,
          createResult.data.id,
          formData,
        )

        if (uploadResult.error) {
          setProductError(
            `Το προϊόν δημιουργήθηκε, αλλά η εικόνα δεν ανέβηκε: ${uploadResult.error}`,
          )
          return
        }
      }

      setSelectedProductFileName('')
      setProductSuccess('Το προϊόν δημιουργήθηκε.')
    })
  }

  function handleDeleteProduct(productId: string) {
    const confirmed = window.confirm(
      'Θέλετε σίγουρα να διαγράψετε αυτό το προϊόν;',
    )

    if (!confirmed) return

    startTransition(async () => {
      setProductError(null)
      setProductSuccess(null)
      setDeletingProductId(productId)

      const result = await deleteProduct(productId)

      if (result.error) {
        setProductError(result.error)
        setDeletingProductId(null)
        return
      }

      setDeletingProductId(null)
      setProductSuccess('Το προϊόν διαγράφηκε.')
    })
  }

  function startEditCategory(category: Category) {
    setEditingCategoryId(category.id)
    setEditingCategoryName(category.name_el)
    setCategoryError(null)
    setCategorySuccess(null)
  }

  function handleSaveCategory(categoryId: string) {
    startTransition(async () => {
      setCategoryError(null)
      setCategorySuccess(null)

      const trimmed = editingCategoryName.trim()

      if (!trimmed) {
        setCategoryError('Το όνομα κατηγορίας δεν μπορεί να είναι κενό.')
        return
      }

      const result = await updateCategory(categoryId, { name_el: trimmed })

      if (result.error) {
        setCategoryError(result.error)
        return
      }

      setEditingCategoryId(null)
      setEditingCategoryName('')
      setCategorySuccess('Η κατηγορία ενημερώθηκε.')
    })
  }

  function handleMoveUp(categoryId: string) {
    startTransition(async () => {
      setCategoryError(null)
      setCategorySuccess(null)

      const result = await moveCategoryUp(categoryId)

      if (result.error) {
        setCategoryError(result.error)
        return
      }

      setCategorySuccess('Η σειρά κατηγορίας ενημερώθηκε.')
    })
  }

  function handleMoveDown(categoryId: string) {
    startTransition(async () => {
      setCategoryError(null)
      setCategorySuccess(null)

      const result = await moveCategoryDown(categoryId)

      if (result.error) {
        setCategoryError(result.error)
        return
      }

      setCategorySuccess('Η σειρά κατηγορίας ενημερώθηκε.')
    })
  }

  function handleDeleteCategory(categoryId: string) {
    const confirmed = window.confirm(
      'Θέλετε σίγουρα να διαγράψετε αυτή την κατηγορία;',
    )

    if (!confirmed) return

    startTransition(async () => {
      setCategoryError(null)
      setCategorySuccess(null)

      const result = await deleteCategory(categoryId)

      if (result.error) {
        setCategoryError(result.error)
        return
      }

      setCategorySuccess('Η κατηγορία διαγράφηκε.')
    })
  }

  function startEditProduct(product: ProductWithOptions) {
    setEditingProductId(product.id)
    setEditingProductName(product.name_el)
    setEditingProductDescription(product.description_el ?? '')
    setEditingProductPrice(String(product.price ?? ''))
    setEditingProductCategoryId(product.category_id)
    setEditingProductFileName('')
    setProductError(null)
    setProductSuccess(null)
  }

  function cancelEditProduct() {
    setEditingProductId(null)
    setEditingProductName('')
    setEditingProductDescription('')
    setEditingProductPrice('')
    setEditingProductCategoryId('')
    setEditingProductFileName('')
  }

  function handleSaveProduct(productId: string) {
    startTransition(async () => {
      setProductError(null)
      setProductSuccess(null)

      const trimmedName = editingProductName.trim()
      const trimmedCategoryId = editingProductCategoryId.trim()
      const normalizedPrice = Number(editingProductPrice.replace(',', '.'))

      if (!trimmedName || !trimmedCategoryId || !editingProductPrice.trim()) {
        setProductError('Συμπληρώστε όνομα, κατηγορία και τιμή.')
        return
      }

      if (Number.isNaN(normalizedPrice) || normalizedPrice < 0) {
        setProductError('Η τιμή δεν είναι έγκυρη.')
        return
      }

      const updateResult = await updateProduct(productId, {
        name_el: trimmedName,
        category_id: trimmedCategoryId,
        description_el: editingProductDescription.trim() || null,
        price: normalizedPrice,
      })

      if (updateResult.error) {
        setProductError(updateResult.error)
        return
      }

      const fileInput = document.getElementById(
        `edit-image-${productId}`,
      ) as HTMLInputElement | null
      const file = fileInput?.files?.[0] ?? null

      if (file) {
        const editFormData = new FormData()
        editFormData.append('image', file)

        const uploadResult = await uploadProductImage(
          businessId,
          productId,
          editFormData,
        )

        if (uploadResult.error) {
          setProductError(
            `Το προϊόν ενημερώθηκε, αλλά η νέα εικόνα δεν ανέβηκε: ${uploadResult.error}`,
          )
          return
        }
      }

      cancelEditProduct()
      setProductSuccess('Το προϊόν ενημερώθηκε.')
    })
  }

  function handleCreateOptionGroup(product: ProductWithOptions) {
    startTransition(async () => {
      resetMessages()

      const trimmedName = newGroupName.trim()

      if (!trimmedName) {
        setProductError('Γράψτε όνομα ομάδας επιλογών.')
        return
      }

      const result = await createOptionGroup({
        business_id: businessId,
        product_id: product.id,
        name_el: trimmedName,
        name_en: null,
        is_required: newGroupRequired,
        sort_order: (product.product_option_groups?.length ?? 0) + 1,
      })

      if (result.error) {
        setProductError(result.error)
        return
      }

      setNewGroupName('')
      setNewGroupRequired(false)
      setOpenGroupProductId(null)
      setProductSuccess('Η ομάδα επιλογών δημιουργήθηκε.')
    })
  }

  function handleCreateOptionChoice(
    group: ProductOptionGroup & { product_option_choices?: { sort_order: number }[] },
  ) {
    startTransition(async () => {
      resetMessages()

      const trimmedName = newChoiceName.trim()
      const priceDelta = Number(newChoicePriceDelta.replace(',', '.'))

      if (!trimmedName) {
        setProductError('Γράψτε όνομα επιλογής.')
        return
      }

      if (Number.isNaN(priceDelta)) {
        setProductError('Το extra κόστος δεν είναι έγκυρο.')
        return
      }

      const result = await createOptionChoice({
        business_id: businessId,
        group_id: group.id,
        name_el: trimmedName,
        name_en: null,
        price_delta: priceDelta,
        sort_order: (group.product_option_choices?.length ?? 0) + 1,
      })

      if (result.error) {
        setProductError(result.error)
        return
      }

      setNewChoiceName('')
      setNewChoicePriceDelta('0')
      setOpenChoiceGroupId(null)
      setProductSuccess('Η επιλογή δημιουργήθηκε.')
    })
  }

  function handleDeleteOptionGroup(groupId: string) {
    const confirmed = window.confirm(
      'Θέλετε σίγουρα να διαγράψετε αυτή την ομάδα επιλογών;',
    )

    if (!confirmed) return

    startTransition(async () => {
      resetMessages()

      const result = await deleteOptionGroup(groupId)

      if (result.error) {
        setProductError(result.error)
        return
      }

      setProductSuccess('Η ομάδα επιλογών διαγράφηκε.')
    })
  }

  function handleDeleteOptionChoice(choiceId: string) {
    const confirmed = window.confirm(
      'Θέλετε σίγουρα να διαγράψετε αυτή την επιλογή;',
    )

    if (!confirmed) return

    startTransition(async () => {
      resetMessages()

      const result = await deleteOptionChoice(choiceId)

      if (result.error) {
        setProductError(result.error)
        return
      }

      setProductSuccess('Η επιλογή διαγράφηκε.')
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
                  className="rounded-2xl border border-[#eee5dc] bg-[#faf7f2] px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      {editingCategoryId === category.id ? (
                        <Input
                          value={editingCategoryName}
                          onChange={(e) => setEditingCategoryName(e.target.value)}
                          className="rounded-xl border-[#e7ddd3] bg-white py-2"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-gray-900">
                          {category.name_el}
                        </p>
                      )}

                      <p className="mt-1 text-xs text-[#7b6657]">
                        Κατηγορία #{index + 1}
                      </p>
                    </div>

                    <span className="rounded-full bg-white px-3 py-1 text-xs text-[#7b6657] shadow-sm">
                      Ενεργή
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {editingCategoryId === category.id ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          className="rounded-xl"
                          loading={isPending}
                          onClick={() => handleSaveCategory(category.id)}
                        >
                          Αποθήκευση
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="rounded-xl"
                          onClick={() => {
                            setEditingCategoryId(null)
                            setEditingCategoryName('')
                          }}
                        >
                          Άκυρο
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="rounded-xl"
                          onClick={() => startEditCategory(category)}
                        >
                          Edit
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="rounded-xl"
                          disabled={index === 0 || isPending}
                          onClick={() => handleMoveUp(category.id)}
                        >
                          ↑ Πάνω
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="rounded-xl"
                          disabled={index === categories.length - 1 || isPending}
                          onClick={() => handleMoveDown(category.id)}
                        >
                          ↓ Κάτω
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          Διαγραφή
                        </Button>
                      </>
                    )}
                  </div>
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

            <Field label="Εικόνα προϊόντος" htmlFor="image">
              <div className="rounded-2xl border border-[#e7ddd3] bg-[#fffdfa] p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>

                  <div className="flex min-w-0 flex-col gap-2">
                    <label
                      htmlFor="image"
                      className="inline-flex w-fit cursor-pointer rounded-xl border border-[#d9cec3] bg-white px-4 py-2 text-sm font-medium text-[#5f5146] transition hover:bg-[#f6efe8]"
                    >
                      Επιλογή εικόνας
                    </label>

                    <input
                      id="image"
                      name="image"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={(e) =>
                        setSelectedProductFileName(e.target.files?.[0]?.name ?? '')
                      }
                    />

                    <p className="text-xs text-[#7b6657]">
                      JPG, PNG, WEBP ή SVG έως 5 MB
                    </p>

                    {selectedProductFileName ? (
                      <p className="truncate text-sm text-gray-700">
                        Επιλεγμένο: {selectedProductFileName}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
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
              {products.map((product) => {
                const imageUrl =
                  typeof product.image_url === 'string' && product.image_url.trim().length > 0
                    ? product.image_url
                    : null

                return (
                  <div
                    key={product.id}
                    className="rounded-2xl border border-[#eee5dc] bg-[#faf7f2] px-4 py-3"
                  >
                    {editingProductId === product.id ? (
                      <div className="space-y-4">
                        <Field label="Όνομα προϊόντος" htmlFor={`edit-name-${product.id}`} required>
                          <Input
                            id={`edit-name-${product.id}`}
                            value={editingProductName}
                            onChange={(e) => setEditingProductName(e.target.value)}
                            className="rounded-2xl border-[#e7ddd3] bg-white py-3"
                          />
                        </Field>

                        <Field label="Κατηγορία" htmlFor={`edit-category-${product.id}`} required>
                          <select
                            id={`edit-category-${product.id}`}
                            value={editingProductCategoryId}
                            onChange={(e) => setEditingProductCategoryId(e.target.value)}
                            className="h-12 w-full rounded-2xl border border-[#e7ddd3] bg-white px-4 text-sm text-gray-900 focus:border-[#c9b29d] focus:outline-none focus:ring-2 focus:ring-[#efe4d8]"
                          >
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name_el}
                              </option>
                            ))}
                          </select>
                        </Field>

                        <Field label="Περιγραφή" htmlFor={`edit-description-${product.id}`}>
                          <Input
                            id={`edit-description-${product.id}`}
                            value={editingProductDescription}
                            onChange={(e) => setEditingProductDescription(e.target.value)}
                            className="rounded-2xl border-[#e7ddd3] bg-white py-3"
                          />
                        </Field>

                        <Field label="Τιμή" htmlFor={`edit-price-${product.id}`} required>
                          <Input
                            id={`edit-price-${product.id}`}
                            value={editingProductPrice}
                            onChange={(e) => setEditingProductPrice(e.target.value)}
                            className="rounded-2xl border-[#e7ddd3] bg-white py-3"
                          />
                        </Field>

                        <Field label="Αλλαγή εικόνας" htmlFor={`edit-image-${product.id}`}>
                          <div className="rounded-2xl border border-[#e7ddd3] bg-white p-4">
                            <div className="flex items-center gap-4">
                              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#e7ddd3] bg-[#faf7f2]">
                                {imageUrl ? (
                                  <Image
                                    src={imageUrl}
                                    alt={product.name_el}
                                    width={64}
                                    height={64}
                                    className="h-full w-full object-cover"
                                    unoptimized
                                  />
                                ) : (
                                  <span className="text-[11px] text-[#8b715d]">No image</span>
                                )}
                              </div>

                              <div className="flex min-w-0 flex-col gap-2">
                                <label
                                  htmlFor={`edit-image-${product.id}`}
                                  className="inline-flex w-fit cursor-pointer rounded-xl border border-[#d9cec3] bg-white px-4 py-2 text-sm font-medium text-[#5f5146] transition hover:bg-[#f6efe8]"
                                >
                                  Επιλογή νέας εικόνας
                                </label>

                                <input
                                  id={`edit-image-${product.id}`}
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                                  className="hidden"
                                  onChange={(e) =>
                                    setEditingProductFileName(e.target.files?.[0]?.name ?? '')
                                  }
                                />

                                <p className="text-xs text-[#7b6657]">
                                  JPG, PNG, WEBP ή SVG έως 5 MB
                                </p>

                                {editingProductFileName ? (
                                  <p className="truncate text-sm text-gray-700">
                                    Επιλεγμένο: {editingProductFileName}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </Field>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            className="rounded-xl"
                            loading={isPending}
                            onClick={() => handleSaveProduct(product.id)}
                          >
                            Αποθήκευση
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            className="rounded-xl"
                            onClick={cancelEditProduct}
                          >
                            Άκυρο
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#e7ddd3] bg-white">
                              {imageUrl ? (
                                <Image
                                  src={imageUrl}
                                  alt={product.name_el}
                                  width={56}
                                  height={56}
                                  className="h-full w-full object-cover"
                                  unoptimized
                                />
                              ) : (
                                <span className="text-[11px] text-[#8b715d]">No image</span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900">
                                {product.name_el}
                              </p>
                              <p className="mt-1 truncate text-xs text-[#7b6657]">
                                {product.description_el ?? 'Χωρίς περιγραφή'}
                              </p>
                            </div>
                          </div>

                          <p className="whitespace-nowrap text-sm font-semibold text-gray-900">
                            {formatCurrency(Number(product.price ?? 0), currency)}
                          </p>
                        </div>

                        <div className="mt-4 rounded-2xl border border-[#e8ddd2] bg-white p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                Επιλογές προϊόντος
                              </p>
                              <p className="mt-1 text-xs text-[#7b6657]">
                                Π.χ. Ζάχαρη, Μέγεθος, Γάλα
                              </p>
                            </div>

                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="rounded-xl"
                              onClick={() => {
                                setOpenGroupProductId(
                                  openGroupProductId === product.id ? null : product.id,
                                )
                                setNewGroupName('')
                                setNewGroupRequired(false)
                              }}
                            >
                              + Ομάδα επιλογών
                            </Button>
                          </div>

                          {openGroupProductId === product.id ? (
                            <div className="mb-4 rounded-2xl border border-[#eee5dc] bg-[#faf7f2] p-4">
                              <div className="grid gap-3 md:grid-cols-2">
                                <Field label="Όνομα ομάδας" htmlFor={`group-name-${product.id}`} required>
                                  <Input
                                    id={`group-name-${product.id}`}
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    placeholder="π.χ. Ζάχαρη"
                                    className="rounded-2xl border-[#e7ddd3] bg-white py-3"
                                  />
                                </Field>

                                <div className="flex items-end">
                                  <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                      type="checkbox"
                                      checked={newGroupRequired}
                                      onChange={(e) => setNewGroupRequired(e.target.checked)}
                                    />
                                    Υποχρεωτική επιλογή
                                  </label>
                                </div>
                              </div>

                              <div className="mt-3 flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  className="rounded-xl"
                                  loading={isPending}
                                  onClick={() => handleCreateOptionGroup(product)}
                                >
                                  Αποθήκευση ομάδας
                                </Button>

                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="rounded-xl"
                                  onClick={() => {
                                    setOpenGroupProductId(null)
                                    setNewGroupName('')
                                    setNewGroupRequired(false)
                                  }}
                                >
                                  Άκυρο
                                </Button>
                              </div>
                            </div>
                          ) : null}

                          {!product.product_option_groups ||
                          product.product_option_groups.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-[#d8cdc1] bg-[#fffdfa] px-4 py-4 text-sm text-[#7b6657]">
                              Δεν υπάρχουν επιλογές ακόμα.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {product.product_option_groups.map((group) => (
                                <div
                                  key={group.id}
                                  className="rounded-2xl border border-[#eee5dc] bg-[#faf7f2] p-4"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">
                                        {group.name_el}
                                      </p>
                                      <p className="mt-1 text-xs text-[#7b6657]">
                                        {group.is_required
                                          ? 'Υποχρεωτική ομάδα'
                                          : 'Προαιρετική ομάδα'}
                                      </p>
                                    </div>

                                    <div className="flex gap-2">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="rounded-xl"
                                        onClick={() => {
                                          setOpenChoiceGroupId(
                                            openChoiceGroupId === group.id ? null : group.id,
                                          )
                                          setNewChoiceName('')
                                          setNewChoicePriceDelta('0')
                                        }}
                                      >
                                        + Επιλογή
                                      </Button>

                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
                                        onClick={() => handleDeleteOptionGroup(group.id)}
                                      >
                                        Διαγραφή ομάδας
                                      </Button>
                                    </div>
                                  </div>

                                  {openChoiceGroupId === group.id ? (
                                    <div className="mt-3 rounded-2xl border border-[#e8ddd2] bg-white p-4">
                                      <div className="grid gap-3 md:grid-cols-2">
                                        <Field
                                          label="Όνομα επιλογής"
                                          htmlFor={`choice-name-${group.id}`}
                                          required
                                        >
                                          <Input
                                            id={`choice-name-${group.id}`}
                                            value={newChoiceName}
                                            onChange={(e) => setNewChoiceName(e.target.value)}
                                            placeholder="π.χ. Μέτριος"
                                            className="rounded-2xl border-[#e7ddd3] bg-white py-3"
                                          />
                                        </Field>

                                        <Field
                                          label="Extra κόστος"
                                          htmlFor={`choice-price-${group.id}`}
                                          required
                                        >
                                          <Input
                                            id={`choice-price-${group.id}`}
                                            value={newChoicePriceDelta}
                                            onChange={(e) =>
                                              setNewChoicePriceDelta(e.target.value)
                                            }
                                            placeholder="π.χ. 0 ή 0.50"
                                            className="rounded-2xl border-[#e7ddd3] bg-white py-3"
                                          />
                                        </Field>
                                      </div>

                                      <div className="mt-3 flex flex-wrap gap-2">
                                        <Button
                                          type="button"
                                          size="sm"
                                          className="rounded-xl"
                                          loading={isPending}
                                          onClick={() => handleCreateOptionChoice(group)}
                                        >
                                          Αποθήκευση επιλογής
                                        </Button>

                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="ghost"
                                          className="rounded-xl"
                                          onClick={() => {
                                            setOpenChoiceGroupId(null)
                                            setNewChoiceName('')
                                            setNewChoicePriceDelta('0')
                                          }}
                                        >
                                          Άκυρο
                                        </Button>
                                      </div>
                                    </div>
                                  ) : null}

                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {group.product_option_choices &&
                                    group.product_option_choices.length > 0 ? (
                                      group.product_option_choices.map((choice) => (
                                        <div
                                          key={choice.id}
                                          className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs text-[#6f6156] shadow-sm"
                                        >
                                          <span>
                                            {choice.name_el}
                                            {Number(choice.price_delta) > 0
                                              ? ` (+${formatCurrency(
                                                  Number(choice.price_delta),
                                                  currency,
                                                )})`
                                              : ''}
                                          </span>

                                          <button
                                            type="button"
                                            className="text-red-500 hover:text-red-700"
                                            onClick={() => handleDeleteOptionChoice(choice.id)}
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-xs text-[#7b6657]">
                                        Δεν υπάρχουν επιλογές σε αυτή την ομάδα ακόμα.
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="mt-3 flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="rounded-xl"
                            onClick={() => startEditProduct(product)}
                          >
                            Edit
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
                            loading={deletingProductId === product.id && isPending}
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            Διαγραφή
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}