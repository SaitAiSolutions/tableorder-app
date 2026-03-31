'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSuperAdminEmail } from '@/lib/utils/admin'
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
  ProductWithOptions,
  Table,
  UpdateCategory,
  UpdateProduct,
} from '@/types/database.types'

interface ActionResult<T = null> {
  data: T | null
  error: string | null
}

async function resolveCurrentBusinessContext() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const cookieStore = await cookies()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      businessId: null,
      error: 'Not authenticated',
      isAdminSelection: false,
      db: supabase,
    }
  }

  const isSuperAdmin = isSuperAdminEmail(user.email)
  const adminSelectedBusinessId = cookieStore.get('admin_business_id')?.value

  if (isSuperAdmin && adminSelectedBusinessId) {
    return {
      businessId: adminSelectedBusinessId,
      error: null,
      isAdminSelection: true,
      db: admin,
    }
  }

  const { data, error } = await supabase
    .from('business_users')
    .select('business_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const row = data as unknown as { business_id?: string } | null

  if (error || !row?.business_id) {
    return {
      businessId: null,
      error: 'Δεν βρέθηκε επιχείρηση για τον χρήστη.',
      isAdminSelection: false,
      db: supabase,
    }
  }

  return {
    businessId: row.business_id,
    error: null,
    isAdminSelection: false,
    db: supabase,
  }
}

async function translateGreekToEnglish(text: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY.')
  }

  const input = text.trim()

  if (!input) return ''

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-5.4',
      input: [
        {
          role: 'system',
          content:
            'You translate Greek menu text into natural English for restaurant and cafe menus. Return only the translated text, with no quotes, no explanation, and no extra formatting.',
        },
        {
          role: 'user',
          content: input,
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI translation error: ${errorText}`)
  }

  const json = await response.json()
  const outputText = json?.output_text?.trim?.()

  if (!outputText) {
    throw new Error('OpenAI returned empty translation output.')
  }

  return outputText
}

export async function autoTranslateMenuToEnglish(): Promise<
  ActionResult<{
    categories: number
    products: number
    descriptions: number
    optionGroups: number
    optionChoices: number
  }>
> {
  const context = await resolveCurrentBusinessContext()

  if (context.error || !context.businessId) {
    return { data: null, error: context.error ?? 'Δεν βρέθηκε επιχείρηση.' }
  }

  const businessId = context.businessId
  const db = context.db

  try {
    let translatedCategories = 0
    let translatedProducts = 0
    let translatedDescriptions = 0
    let translatedOptionGroups = 0
    let translatedOptionChoices = 0

    const { data: categories, error: categoriesError } = await db
      .from('categories')
      .select('id, name_el, name_en')
      .eq('business_id', businessId)

    if (categoriesError) {
      return { data: null, error: categoriesError.message }
    }

    for (const category of categories ?? []) {
      if (!category.name_en && category.name_el) {
        const translated = await translateGreekToEnglish(category.name_el)

        const { error } = await db
          .from('categories')
          .update({ name_en: translated } as never)
          .eq('id', category.id)

        if (error) {
          return { data: null, error: error.message }
        }

        translatedCategories += 1
      }
    }

    const { data: products, error: productsError } = await db
      .from('products')
      .select('id, name_el, name_en, description_el, description_en')
      .eq('business_id', businessId)

    if (productsError) {
      return { data: null, error: productsError.message }
    }

    for (const product of products ?? []) {
      const updates: Record<string, string> = {}

      if (!product.name_en && product.name_el) {
        updates.name_en = await translateGreekToEnglish(product.name_el)
      }

      if (!product.description_en && product.description_el) {
        updates.description_en = await translateGreekToEnglish(product.description_el)
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await db
          .from('products')
          .update(updates as never)
          .eq('id', product.id)

        if (error) {
          return { data: null, error: error.message }
        }

        if (updates.name_en) translatedProducts += 1
        if (updates.description_en) translatedDescriptions += 1
      }
    }

    const { data: optionGroups, error: groupsError } = await db
      .from('product_option_groups')
      .select('id, name_el, name_en')
      .eq('business_id', businessId)

    if (groupsError) {
      return { data: null, error: groupsError.message }
    }

    for (const group of optionGroups ?? []) {
      if (!group.name_en && group.name_el) {
        const translated = await translateGreekToEnglish(group.name_el)

        const { error } = await db
          .from('product_option_groups')
          .update({ name_en: translated } as never)
          .eq('id', group.id)

        if (error) {
          return { data: null, error: error.message }
        }

        translatedOptionGroups += 1
      }
    }

    const { data: optionChoices, error: choicesError } = await db
      .from('product_option_choices')
      .select('id, name_el, name_en')
      .eq('business_id', businessId)

    if (choicesError) {
      return { data: null, error: choicesError.message }
    }

    for (const choice of optionChoices ?? []) {
      if (!choice.name_en && choice.name_el) {
        const translated = await translateGreekToEnglish(choice.name_el)

        const { error } = await db
          .from('product_option_choices')
          .update({ name_en: translated } as never)
          .eq('id', choice.id)

        if (error) {
          return { data: null, error: error.message }
        }

        translatedOptionChoices += 1
      }
    }

    revalidatePath('/dashboard/menu')
    revalidatePath('/dashboard', 'layout')

    return {
      data: {
        categories: translatedCategories,
        products: translatedProducts,
        descriptions: translatedDescriptions,
        optionGroups: translatedOptionGroups,
        optionChoices: translatedOptionChoices,
      },
      error: null,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Αποτυχία αυτόματης μετάφρασης.',
    }
  }
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
  const context = await resolveCurrentBusinessContext()

  let resolvedBusinessId = businessId

  if (!resolvedBusinessId) {
    if (context.error || !context.businessId) {
      return { data: null, error: context.error ?? 'Δεν βρέθηκε επιχείρηση.' }
    }

    resolvedBusinessId = context.businessId
  }

  const { data, error } = await context.db
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
): Promise<ActionResult<ProductWithOptions[]>> {
  const context = await resolveCurrentBusinessContext()

  let resolvedBusinessId = businessId

  if (!resolvedBusinessId) {
    if (context.error || !context.businessId) {
      return { data: null, error: context.error ?? 'Δεν βρέθηκε επιχείρηση.' }
    }

    resolvedBusinessId = context.businessId
  }

  let query = context.db
    .from('products')
    .select(`
      *,
      category:categories (
        id,
        name_el,
        name_en
      ),
      product_option_groups (
        *,
        product_option_choices (*)
      )
    `)
    .eq('business_id', resolvedBusinessId)
    .order('sort_order')
    .order('sort_order', {
      referencedTable: 'product_option_groups',
      ascending: true,
    })
    .order('sort_order', {
      referencedTable: 'product_option_groups.product_option_choices',
      ascending: true,
    })

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data, error } = await query

  if (error) return { data: null, error: error.message }
  return { data: (data ?? []) as unknown as ProductWithOptions[], error: null }
}

export async function createCategory(
  input: InsertCategory,
): Promise<ActionResult<Category>> {
  const context = await resolveCurrentBusinessContext()

  const payload = {
    ...input,
    business_id: input.business_id ?? context.businessId,
  }

  const { data, error } = await context.db
    .from('categories')
    .insert(payload as never)
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
  const context = await resolveCurrentBusinessContext()

  const { data, error } = await context.db
    .from('categories')
    .update(updates as never)
    .eq('id', categoryId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/dashboard/menu')
  revalidatePath('/dashboard', 'layout')
  return { data: data as unknown as Category, error: null }
}

export async function moveCategoryUp(categoryId: string): Promise<ActionResult> {
  const context = await resolveCurrentBusinessContext()

  if (context.error || !context.businessId) {
    return { data: null, error: context.error ?? 'Δεν βρέθηκε επιχείρηση.' }
  }

  const { data: current, error: currentError } = await context.db
    .from('categories')
    .select('id, sort_order')
    .eq('id', categoryId)
    .eq('business_id', context.businessId)
    .single()

  if (currentError || !current) {
    return { data: null, error: 'Η κατηγορία δεν βρέθηκε.' }
  }

  const { data: previous, error: previousError } = await context.db
    .from('categories')
    .select('id, sort_order')
    .eq('business_id', context.businessId)
    .lt('sort_order', current.sort_order)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (previousError) {
    return { data: null, error: previousError.message }
  }

  if (!previous) {
    return { data: null, error: null }
  }

  const { error: firstUpdateError } = await context.db
    .from('categories')
    .update({ sort_order: previous.sort_order } as never)
    .eq('id', current.id)

  if (firstUpdateError) {
    return { data: null, error: firstUpdateError.message }
  }

  const { error: secondUpdateError } = await context.db
    .from('categories')
    .update({ sort_order: current.sort_order } as never)
    .eq('id', previous.id)

  if (secondUpdateError) {
    return { data: null, error: secondUpdateError.message }
  }

  revalidatePath('/dashboard/menu')
  revalidatePath('/dashboard', 'layout')
  return { data: null, error: null }
}

export async function moveCategoryDown(categoryId: string): Promise<ActionResult> {
  const context = await resolveCurrentBusinessContext()

  if (context.error || !context.businessId) {
    return { data: null, error: context.error ?? 'Δεν βρέθηκε επιχείρηση.' }
  }

  const { data: current, error: currentError } = await context.db
    .from('categories')
    .select('id, sort_order')
    .eq('id', categoryId)
    .eq('business_id', context.businessId)
    .single()

  if (currentError || !current) {
    return { data: null, error: 'Η κατηγορία δεν βρέθηκε.' }
  }

  const { data: next, error: nextError } = await context.db
    .from('categories')
    .select('id, sort_order')
    .eq('business_id', context.businessId)
    .gt('sort_order', current.sort_order)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (nextError) {
    return { data: null, error: nextError.message }
  }

  if (!next) {
    return { data: null, error: null }
  }

  const { error: firstUpdateError } = await context.db
    .from('categories')
    .update({ sort_order: next.sort_order } as never)
    .eq('id', current.id)

  if (firstUpdateError) {
    return { data: null, error: firstUpdateError.message }
  }

  const { error: secondUpdateError } = await context.db
    .from('categories')
    .update({ sort_order: current.sort_order } as never)
    .eq('id', next.id)

  if (secondUpdateError) {
    return { data: null, error: secondUpdateError.message }
  }

  revalidatePath('/dashboard/menu')
  revalidatePath('/dashboard', 'layout')
  return { data: null, error: null }
}

export async function deleteCategory(categoryId: string): Promise<ActionResult> {
  const context = await resolveCurrentBusinessContext()

  const { error } = await context.db
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
  revalidatePath('/dashboard', 'layout')
  return { data: null, error: null }
}

export async function createProduct(
  input: InsertProduct,
): Promise<ActionResult<Product>> {
  const context = await resolveCurrentBusinessContext()

  const payload = {
    ...input,
    business_id: input.business_id ?? context.businessId,
  }

  const { data, error } = await context.db
    .from('products')
    .insert(payload as never)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/dashboard/menu')
  revalidatePath('/dashboard', 'layout')
  return { data: data as unknown as Product, error: null }
}

export async function updateProduct(
  productId: string,
  updates: UpdateProduct,
): Promise<ActionResult<Product>> {
  const context = await resolveCurrentBusinessContext()

  const { data, error } = await context.db
    .from('products')
    .update(updates as never)
    .eq('id', productId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/dashboard/menu')
  revalidatePath('/dashboard', 'layout')
  return { data: data as unknown as Product, error: null }
}

export async function moveProductUp(productId: string): Promise<ActionResult> {
  const context = await resolveCurrentBusinessContext()

  if (context.error || !context.businessId) {
    return { data: null, error: context.error ?? 'Δεν βρέθηκε επιχείρηση.' }
  }

  const { data: current, error: currentError } = await context.db
    .from('products')
    .select('id, category_id, sort_order')
    .eq('id', productId)
    .eq('business_id', context.businessId)
    .single()

  if (currentError || !current) {
    return { data: null, error: 'Το προϊόν δεν βρέθηκε.' }
  }

  const { data: previous, error: previousError } = await context.db
    .from('products')
    .select('id, sort_order')
    .eq('business_id', context.businessId)
    .eq('category_id', current.category_id)
    .lt('sort_order', current.sort_order)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (previousError) {
    return { data: null, error: previousError.message }
  }

  if (!previous) {
    return { data: null, error: null }
  }

  const { error: firstUpdateError } = await context.db
    .from('products')
    .update({ sort_order: previous.sort_order } as never)
    .eq('id', current.id)

  if (firstUpdateError) {
    return { data: null, error: firstUpdateError.message }
  }

  const { error: secondUpdateError } = await context.db
    .from('products')
    .update({ sort_order: current.sort_order } as never)
    .eq('id', previous.id)

  if (secondUpdateError) {
    return { data: null, error: secondUpdateError.message }
  }

  revalidatePath('/dashboard/menu')
  revalidatePath('/dashboard', 'layout')
  return { data: null, error: null }
}

export async function moveProductDown(productId: string): Promise<ActionResult> {
  const context = await resolveCurrentBusinessContext()

  if (context.error || !context.businessId) {
    return { data: null, error: context.error ?? 'Δεν βρέθηκε επιχείρηση.' }
  }

  const { data: current, error: currentError } = await context.db
    .from('products')
    .select('id, category_id, sort_order')
    .eq('id', productId)
    .eq('business_id', context.businessId)
    .single()

  if (currentError || !current) {
    return { data: null, error: 'Το προϊόν δεν βρέθηκε.' }
  }

  const { data: next, error: nextError } = await context.db
    .from('products')
    .select('id, sort_order')
    .eq('business_id', context.businessId)
    .eq('category_id', current.category_id)
    .gt('sort_order', current.sort_order)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (nextError) {
    return { data: null, error: nextError.message }
  }

  if (!next) {
    return { data: null, error: null }
  }

  const { error: firstUpdateError } = await context.db
    .from('products')
    .update({ sort_order: next.sort_order } as never)
    .eq('id', current.id)

  if (firstUpdateError) {
    return { data: null, error: firstUpdateError.message }
  }

  const { error: secondUpdateError } = await context.db
    .from('products')
    .update({ sort_order: current.sort_order } as never)
    .eq('id', next.id)

  if (secondUpdateError) {
    return { data: null, error: secondUpdateError.message }
  }

  revalidatePath('/dashboard/menu')
  revalidatePath('/dashboard', 'layout')
  return { data: null, error: null }
}

export async function toggleProductAvailability(
  productId: string,
  isAvailable: boolean,
): Promise<ActionResult<Product>> {
  const context = await resolveCurrentBusinessContext()

  const { data, error } = await context.db
    .from('products')
    .update({ is_available: isAvailable } as never)
    .eq('id', productId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/dashboard/menu')
  revalidatePath('/dashboard', 'layout')
  return { data: data as unknown as Product, error: null }
}

export async function deleteProduct(productId: string): Promise<ActionResult> {
  const context = await resolveCurrentBusinessContext()

  const { error } = await context.db
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
  revalidatePath('/dashboard', 'layout')
  return { data: publicUrl, error: null }
}

export async function createOptionGroup(
  input: InsertProductOptionGroup,
): Promise<ActionResult<ProductOptionGroup>> {
  const context = await resolveCurrentBusinessContext()

  const payload = {
    ...input,
    business_id: input.business_id ?? context.businessId,
  }

  const { data, error } = await context.db
    .from('product_option_groups')
    .insert(payload as never)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/dashboard/menu')
  revalidatePath('/dashboard', 'layout')
  return { data: data as unknown as ProductOptionGroup, error: null }
}

export async function deleteOptionGroup(groupId: string): Promise<ActionResult> {
  const context = await resolveCurrentBusinessContext()

  const { error } = await context.db
    .from('product_option_groups')
    .delete()
    .eq('id', groupId)

  if (error) return { data: null, error: error.message }

  revalidatePath('/dashboard/menu')
  revalidatePath('/dashboard', 'layout')
  return { data: null, error: null }
}

export async function createOptionChoice(
  input: InsertProductOptionChoice,
): Promise<ActionResult<ProductOptionChoice>> {
  const context = await resolveCurrentBusinessContext()

  const payload = {
    ...input,
    business_id: input.business_id ?? context.businessId,
  }

  const { data, error } = await context.db
    .from('product_option_choices')
    .insert(payload as never)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/dashboard/menu')
  revalidatePath('/dashboard', 'layout')
  return { data: data as unknown as ProductOptionChoice, error: null }
}

export async function deleteOptionChoice(choiceId: string): Promise<ActionResult> {
  const context = await resolveCurrentBusinessContext()

  const { error } = await context.db
    .from('product_option_choices')
    .delete()
    .eq('id', choiceId)

  if (error) return { data: null, error: error.message }

  revalidatePath('/dashboard/menu')
  revalidatePath('/dashboard', 'layout')
  return { data: null, error: null }
}