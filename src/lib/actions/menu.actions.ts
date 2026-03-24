// Path: src/lib/actions/menu.actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  Business,
  Category,
  CategoryWithProducts,
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

  if (error || !data?.business_id) {
    return { businessId: null, error: 'Δεν βρέθηκε επιχείρηση για τον χρήστη.' }
  }

  return { businessId: data.business_id, error: null }
}

// ---------------------------------------------------------------------------
// getMenuForCustomer
// Public read for customer QR route.
// ---------------------------------------------------------------------------
export async function getMenuForCustomer(
  slug: string,
  tableId: string,
): Promise<ActionResult<{ business: Business; table: Table; categories: CategoryWithProducts[] }>> {
  const supabase = await createClient()

  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (bizError || !business) {
    return { data: null, error: 'Η επιχείρηση δεν βρέθηκε.' }
  }

  const { data: table, error: tableError } = await supabase
    .from('tables')
    .select('*')
    .eq('id', tableId)
    .eq('business_id', business.id)
    .eq('is_active', true)
    .maybeSingle()

  if (tableError || !table) {
    return { data: null, error: 'Το τραπέζι δεν βρέθηκε.' }
  }

  const { data: categories, error: menuError } = await supabase
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
      business: business as Business,
      table: table as Table,
      categories: (categories ?? []) as CategoryWithProducts[],
    },
    error: null,
  }
}

// ---------------------------------------------------------------------------
// getCategoriesForDashboard
// Owner view — all categories including inactive ones.
// ---------------------------------------------------------------------------
export async function getCategoriesForDashboard(
  businessId?: string,
): Promise<ActionResult<Category[]>> {
  const supabase = await createClient()

  let resolvedBusinessId = businessId

  if (!resolvedBusinessId) {
    const { businessId: currentBusinessId, error } = await resolveCurrentBusinessId()
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
  return { data: data ?? [], error: null }
}

// ---------------------------------------------------------------------------
// getProductsForDashboard
// Owner view — all products, including unavailable.
// ---------------------------------------------------------------------------
export async function getProductsForDashboard(
  businessId?: string,
  categoryId?: string,
): Promise<ActionResult<Product[]>> {
  const supabase = await createClient()

  let resolvedBusinessId = businessId

  if (!resolvedBusinessId) {
    const { businessId: currentBusinessId, error } = await resolveCurrentBusinessId()
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
  return { data: (data ?? []) as Product[], error: null }
}

// ---------------------------------------------------------------------------
// Category CRUD
// ---------------------------------------------------------------------------
export async function createCategory(
  input: InsertCategory,
): Promise<ActionResult<Category>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .insert(input)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/dashboard/menu')
  return { data, error: null }
}

export async function updateCategory(
  categoryId: string,
  updates: UpdateCategory,
): Promise<ActionResult<Category>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', categoryId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/dashboard/menu')
  return { data, error: null }
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

// ---------------------------------------------------------------------------
// Product CRUD
// ---------------------------------------------------------------------------
export async function createProduct(
  input: InsertProduct,
): Promise<ActionResult<Product>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .insert(input)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/dashboard/menu')
  return { data, error: null }
}

export async function updateProduct(
  productId: string,
  updates: UpdateProduct,
): Promise<ActionResult<Product>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', productId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/dashboard/menu')
  return { data, error: null }
}

export async function deleteProduct(productId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)

  if (error) return { data: null, error: error.message }

  revalidatePath('/dashboard/menu')
  return { data: null, error: null }
}

// ---------------------------------------------------------------------------
// uploadProductImage
// ---------------------------------------------------------------------------
export async function uploadProductImage(
  businessId: string,
  productId: string,
  formData: FormData,
): Promise<ActionResult<string>> {
  const supabase = await createClient()

  const file = formData.get('image') as File | null

  if (!file || file.size === 0) {
    return { data: null, error: 'Δεν επιλέχθηκε αρχείο.' }
  }

  if (file.size > 5 * 1024 * 1024) {
    return { data: null, error: 'Μέγιστο μέγεθος αρχείου: 5 MB.' }
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${businessId}/${productId}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) return { data: null, error: uploadError.message }

  const {
    data: { publicUrl },
  } = supabase.storage.from('product-images').getPublicUrl(path)

  const { error: updateError } = await supabase
    .from('products')
    .update({ image_url: publicUrl })
    .eq('id', productId)

  if (updateError) return { data: null, error: updateError.message }

  revalidatePath('/dashboard/menu')
  return { data: publicUrl, error: null }
}

// ---------------------------------------------------------------------------
// Option group CRUD
// ---------------------------------------------------------------------------
export async function createOptionGroup(
  input: InsertProductOptionGroup,
): Promise<ActionResult<ProductOptionGroup>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('product_option_groups')
    .insert(input)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/dashboard/menu')
  return { data, error: null }
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

// ---------------------------------------------------------------------------
// Option choice CRUD
// ---------------------------------------------------------------------------
export async function createOptionChoice(
  input: InsertProductOptionChoice,
): Promise<ActionResult<ProductOptionChoice>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('product_option_choices')
    .insert(input)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/dashboard/menu')
  return { data, error: null }
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