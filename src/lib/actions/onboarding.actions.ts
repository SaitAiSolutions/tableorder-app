'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { InsertCategory, InsertProduct } from '@/types/database.types'

interface ActionResult<T = null> {
  data: T | null
  error: string | null
}

type MenuTemplate = 'coffee_bar' | 'snack_bar'

async function resolveCurrentBusinessId() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { businessId: null, error: 'Not authenticated' }
  }

  const { data: businessRow, error: businessError } = await supabase
    .from('business_users')
    .select('business_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const row = businessRow as { business_id?: string } | null

  if (businessError || !row?.business_id) {
    return { businessId: null, error: 'Δεν βρέθηκε επιχείρηση για τον χρήστη.' }
  }

  return { businessId: row.business_id, error: null }
}

function getTemplateData(template: MenuTemplate) {
  if (template === 'snack_bar') {
    return [
      {
        category: 'Καφέδες',
        products: [
          { name: 'Espresso', description: 'Μονός espresso', price: 2.0 },
          { name: 'Cappuccino', description: 'Κλασικός cappuccino', price: 2.5 },
          { name: 'Freddo Espresso', description: 'Διπλός παγωμένος espresso', price: 3.0 },
          { name: 'Freddo Cappuccino', description: 'Παγωμένος cappuccino', price: 3.5 },
        ],
      },
      {
        category: 'Ροφήματα',
        products: [
          { name: 'Σοκολάτα Ζεστή', description: 'Ζεστή σοκολάτα', price: 3.5 },
          { name: 'Σοκολάτα Κρύα', description: 'Κρύα σοκολάτα', price: 3.8 },
          { name: 'Τσάι', description: 'Διάφορες γεύσεις', price: 2.5 },
        ],
      },
      {
        category: 'Snacks',
        products: [
          { name: 'Τοστ', description: 'Ζαμπόν, τυρί', price: 3.5 },
          { name: 'Club Sandwich', description: 'Κοτόπουλο, bacon, πατάτες', price: 7.5 },
          { name: 'Κουλούρι', description: 'Κλασικό κουλούρι Θεσσαλονίκης', price: 1.5 },
        ],
      },
      {
        category: 'Αναψυκτικά',
        products: [
          { name: 'Coca-Cola', description: '330ml', price: 2.5 },
          { name: 'Sprite', description: '330ml', price: 2.5 },
          { name: 'Σόδα', description: '330ml', price: 2.0 },
        ],
      },
    ]
  }

  return [
    {
      category: 'Καφέδες',
      products: [
        { name: 'Espresso', description: 'Μονός espresso', price: 2.0 },
        { name: 'Διπλός Espresso', description: 'Διπλός espresso', price: 2.5 },
        { name: 'Cappuccino', description: 'Κλασικός cappuccino', price: 2.8 },
        { name: 'Freddo Espresso', description: 'Διπλός παγωμένος espresso', price: 3.2 },
        { name: 'Freddo Cappuccino', description: 'Παγωμένος cappuccino', price: 3.7 },
        { name: 'Ελληνικός Καφές', description: 'Παραδοσιακός ελληνικός', price: 2.3 },
      ],
    },
    {
      category: 'Ροφήματα',
      products: [
        { name: 'Ζεστή Σοκολάτα', description: 'Κλασική ζεστή σοκολάτα', price: 3.7 },
        { name: 'Κρύα Σοκολάτα', description: 'Κρύα σοκολάτα', price: 4.0 },
        { name: 'Τσάι', description: 'Μαύρο ή πράσινο', price: 2.7 },
      ],
    },
    {
      category: 'Χυμοί & Αναψυκτικά',
      products: [
        { name: 'Φυσικός Χυμός Πορτοκάλι', description: 'Φρεσκοστυμμένος', price: 4.0 },
        { name: 'Coca-Cola', description: '330ml', price: 2.7 },
        { name: 'Λεμονάδα', description: 'Σπιτική λεμονάδα', price: 3.2 },
      ],
    },
    {
      category: 'Γλυκά',
      products: [
        { name: 'Κρουασάν', description: 'Βουτύρου ή σοκολάτα', price: 2.8 },
        { name: 'Cheesecake', description: 'Κλασικό cheesecake', price: 4.8 },
        { name: 'Cookies', description: 'Σπιτικά cookies', price: 2.5 },
      ],
    },
  ]
}

export async function createStarterMenu(
  template: MenuTemplate,
): Promise<ActionResult<{ categories: number; products: number }>> {
  const supabase = await createClient()

  const { businessId, error: businessError } = await resolveCurrentBusinessId()

  if (businessError || !businessId) {
    return { data: null, error: businessError ?? 'Δεν βρέθηκε επιχείρηση.' }
  }

  const { data: existingCategories, error: categoryFetchError } = await supabase
    .from('categories')
    .select('id, name_el, sort_order')
    .eq('business_id', businessId)
    .order('sort_order', { ascending: true })

  if (categoryFetchError) {
    return { data: null, error: categoryFetchError.message }
  }

  const categoryRows =
    (existingCategories as { id: string; name_el: string; sort_order: number }[] | null) ?? []

  const templateData = getTemplateData(template)

  let nextCategorySortOrder =
    categoryRows.reduce((max, category) => Math.max(max, Number(category.sort_order ?? 0)), 0) + 1

  let createdCategories = 0
  let createdProducts = 0

  for (const categoryBlock of templateData) {
    let categoryId =
      categoryRows.find(
        (category) =>
          category.name_el.trim().toLowerCase() ===
          categoryBlock.category.trim().toLowerCase(),
      )?.id ?? null

    if (!categoryId) {
      const categoryPayload: InsertCategory = {
        business_id: businessId,
        name_el: categoryBlock.category,
        name_en: null,
        sort_order: nextCategorySortOrder,
        is_active: true,
      }

      const { data: insertedCategory, error: insertCategoryError } = await supabase
        .from('categories')
        .insert(categoryPayload as never)
        .select('id')
        .single()

      if (insertCategoryError || !insertedCategory) {
        return {
          data: null,
          error: insertCategoryError?.message ?? 'Αποτυχία δημιουργίας κατηγορίας.',
        }
      }

      categoryId = (insertedCategory as { id: string }).id
      createdCategories += 1
      nextCategorySortOrder += 1
    }

    const { data: existingProducts, error: productFetchError } = await supabase
      .from('products')
      .select('name_el, sort_order')
      .eq('business_id', businessId)
      .eq('category_id', categoryId)

    if (productFetchError) {
      return { data: null, error: productFetchError.message }
    }

    const productRows =
      (existingProducts as { name_el: string; sort_order: number }[] | null) ?? []

    let nextProductSortOrder =
      productRows.reduce((max, product) => Math.max(max, Number(product.sort_order ?? 0)), 0) + 1

    for (const product of categoryBlock.products) {
      const exists = productRows.some(
        (existingProduct) =>
          existingProduct.name_el.trim().toLowerCase() ===
          product.name.trim().toLowerCase(),
      )

      if (exists) continue

      const productPayload: InsertProduct = {
        business_id: businessId,
        category_id: categoryId,
        name_el: product.name,
        name_en: null,
        description_el: product.description,
        description_en: null,
        price: product.price,
        image_url: null,
        is_available: true,
        sort_order: nextProductSortOrder,
      }

      const { error: insertProductError } = await supabase
        .from('products')
        .insert(productPayload as never)

      if (insertProductError) {
        return { data: null, error: insertProductError.message }
      }

      nextProductSortOrder += 1
      createdProducts += 1
    }
  }

  revalidatePath('/dashboard/menu')
  revalidatePath('/dashboard')
  revalidatePath('/onboarding/ready')
  revalidatePath('/dashboard', 'layout')

  return {
    data: {
      categories: createdCategories,
      products: createdProducts,
    },
    error: null,
  }
}