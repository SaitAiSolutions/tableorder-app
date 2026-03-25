'use client'

import Image from 'next/image'
import { useState, useTransition } from 'react'
import {
  createCategory,
  createProduct,
  deleteProduct,
  moveCategoryDown,
  moveCategoryUp,
  updateCategory,
  uploadProductImage,
} from '@/lib/actions/menu.actions'
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
  const [selectedProductFileName, setSelectedProductFileName] = useState('')
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingCategoryName, setEditingCategoryName] = useState('')

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

                    <div className="mt-3 flex justify-end">
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
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} અને 'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type {
  Business,
  Category,
  CategoryWithProducts,
  CustomerMenuData,
  InsertCategory,
  InsertProduct,
  InsertProductOptionChoice,
  InsertProductOptionGroup,
  Product,
  ProductOptionChoice,
  ProductOptionGroup,
  Table,
  UpdateCategory,
  UpdateProduct,
} from '@/types/database.types'

interface ActionResult<T = null> {
  data: T | null
  error: string | null
}

async function resolveCurrentBusinessId() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { businessId: null, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('business_users')
    .select('business_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const row = data as unknown as { business_id?: string } | null

  if (error || !row?.business_id) {
    return { businessId: null, error: 'Δεν βρέθηκε επιχείρηση για τον χρήστη.' }
  }

  return { businessId: row.business_id, error: null }
}

export async function getMenuForCustomer(
  slug: string,
  tableId: string,
): Promise<ActionResult<CustomerMenuData>> {
  const admin = createAdminClient()

  const { data: businessData, error: bizError } = await admin
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  const business = businessData as unknown as Business | null

  if (bizError || !business) {
    return { data: null, error: 'Η επιχείρηση δεν βρέθηκε.' }
  }

  const { data: tableData, error: tableError } = await admin
    .from('tables')
    .select('*')
    .eq('id', tableId)
    .eq('business_id', business.id)
    .eq('is_active', true)
    .maybeSingle()

  const table = tableData as unknown as Table | null

  if (tableError || !table) {
    return { data: null, error: 'Το τραπέζι δεν βρέθηκε.' }
  }

  const { data: categoriesData, error: menuError } = await admin
    .from('categories')
    .select(`
      *,
      products (
        *,
        product_option_groups (
          *,
          product_option_choices (*)
        )
      )
    `)
    .eq('business_id', business.id)
    .eq('is_active', true)
    .eq('products.is_available', true)
    .order('sort_order', { ascending: true })
    .order('sort_order', { referencedTable: 'products', ascending: true })
    .order('sort_order', {
      referencedTable: 'products.product_option_groups',
      ascending: true,
    })
    .order('sort_order', {
      referencedTable: 'products.product_option_groups.product_option_choices',
      ascending: true,
    })

  if (menuError) {
    return { data: null, error: menuError.message }
  }

  return {
    data: {
      business,
      table,
      categories: (categoriesData ?? []) as unknown as CategoryWithProducts[],
    },
    error: null,
  }
}

export async function getCategoriesForDashboard(
  businessId?: string,
): Promise<ActionResult<Category[]>> {
  const supabase = await createClient()

  let resolvedBusinessId = businessId

  if (!resolvedBusinessId) {
    const { businessId: currentBusinessId, error } =
      await resolveCurrentBusinessId()
    if (error || !currentBusinessId) {
      return { data: null, error: error ?? 'Δεν βρέθηκε επιχείρηση.' }
    }
    resolvedBusinessId = currentBusinessId
  }

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('business_id', resolvedBusinessId)
    .order('sort_order')

  if (error) return { data: null, error: error.message }
  return { data: (data ?? []) as unknown as Category[], error: null }
}

export async function getProductsForDashboard(
  businessId?: string,
  categoryId?: string,
): Promise<ActionResult<Product[]>> {
  const supabase = await createClient()

  let resolvedBusinessId = businessId

  if (!resolvedBusinessId) {
    const { businessId: currentBusinessId, error } =
      await resolveCurrentBusinessId()
    if (error || !currentBusinessId) {
      return { data: null, error: error ?? 'Δεν βρέθηκε επιχείρηση.' }
    }
    resolvedBusinessId = currentBusinessId
  }

  let query = supabase
    .from('products')
    .select(`
      *,
      category:categories (
        id,
        name_el,
        name_en
      )
    `)
    .eq('business_id', resolvedBusinessId)
    .order('sort_order')

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data, error } = await query

  if (error) return { data: null, error: error.message }
  return { data: (data ?? []) as unknown as Product[], error: null }
}

export async function createCategory(
  input: InsertCategory,
): Promise<ActionResult<Category>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .insert(input as never)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/dashboard/menu')
  return { data: data as unknown as Category, error: null }
}

export async function updateCategory(
  categoryId: string,
  updates: UpdateCategory,
): Promise<ActionResult<Category>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .update(updates as never)
    .eq('id', categoryId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/dashboard/menu')
  return { data: data as unknown as Category, error: null }
}

export async function deleteCategory(categoryId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)

  if (error) {
    if (error.code === '23503') {
      return {
        data: null,
        error:
          'Δεν μπορείτε να διαγράψετε κατηγορία που έχει προϊόντα. Διαγράψτε ή μετακινήστε πρώτα τα προϊόντα.',
      }
    }

    return { data: null, error: error.message }
  }

  revalidatePath('/dashboard/menu')
  return { data: null, error: null }
}

export async function createProduct(
  input: InsertProduct,
): Promise<ActionResult<Product>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .insert(input as never)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/dashboard/menu')
  return { data: data as unknown as Product, error: null }
}

export async function updateProduct(
  productId: string,
  updates: UpdateProduct,
): Promise<ActionResult<Product>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .update(updates as never)
    .eq('id', productId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/dashboard/menu')
  return { data: data as unknown as Product, error: null }
}

export async function deleteProduct(productId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)

  if (error) return { data: null, error: error.message }

  revalidatePath('/dashboard/menu')
  revalidatePath('/dashboard', 'layout')

  return { data: null, error: null }
}

export async function uploadProductImage(
  businessId: string,
  productId: string,
  formData: FormData,
): Promise<ActionResult<string>> {
  const admin = createAdminClient()

  const file = formData.get('image') as File | null

  if (!file || file.size === 0) {
    return { data: null, error: 'Δεν επιλέχθηκε αρχείο.' }
  }

  if (file.size > 5 * 1024 * 1024) {
    return { data: null, error: 'Μέγιστο μέγεθος αρχείου: 5 MB.' }
  }

  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml',
  ]

  if (!allowedTypes.includes(file.type)) {
    return {
      data: null,
      error: 'Επιτρέπονται μόνο JPG, PNG, WEBP ή SVG αρχεία.',
    }
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  const path = `${businessId}/${productId}-${Date.now()}.${ext}`

  const { error: uploadError } = await admin.storage
    .from('product-images')
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
    })

  if (uploadError) return { data: null, error: uploadError.message }

  const {
    data: { publicUrl },
  } = admin.storage.from('product-images').getPublicUrl(path)

  if (!publicUrl) {
    return { data: null, error: 'Αποτυχία δημιουργίας URL εικόνας.' }
  }

  const { error: updateError } = await admin
    .from('products')
    .update({ image_url: publicUrl } as never)
    .eq('id', productId)

  if (updateError) return { data: null, error: updateError.message }

  revalidatePath('/dashboard/menu')
  return { data: publicUrl, error: null }
}

export async function createOptionGroup(
  input: InsertProductOptionGroup,
): Promise<ActionResult<ProductOptionGroup>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('product_option_groups')
    .insert(input as never)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/dashboard/menu')
  return { data: data as unknown as ProductOptionGroup, error: null }
}

export async function deleteOptionGroup(groupId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('product_option_groups')
    .delete()
    .eq('id', groupId)

  if (error) return { data: null, error: error.message }

  revalidatePath('/dashboard/menu')
  return { data: null, error: null }
}

export async function createOptionChoice(
  input: InsertProductOptionChoice,
): Promise<ActionResult<ProductOptionChoice>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('product_option_choices')
    .insert(input as never)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/dashboard/menu')
  return { data: data as unknown as ProductOptionChoice, error: null }
}

export async function deleteOptionChoice(choiceId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('product_option_choices')
    .delete()
    .eq('id', choiceId)

  if (error) return { data: null, error: error.message }

  revalidatePath('/dashboard/menu')
  return { data: null, error: null }
}