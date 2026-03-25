'use server'

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
  ProductWithOptions,
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
): Promise<ActionResult<ProductWithOptions[]>> {
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
  revalidatePath('/dashboard', 'layout')
  return { data: data as unknown as Category, error: null }
}

export async function moveCategoryUp(categoryId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { businessId, error: businessError } = await resolveCurrentBusinessId()

  if (businessError || !businessId) {
    return { data: null, error: businessError ?? 'Δεν βρέθηκε επιχείρηση.' }
  }

  const { data: current, error: currentError } = await supabase
    .from('categories')
    .select('id, sort_order')
    .eq('id', categoryId)
    .eq('business_id', businessId)
    .single()

  if (currentError || !current) {
    return { data: null, error: 'Η κατηγορία δεν βρέθηκε.' }
  }

  const { data: previous, error: previousError } = await supabase
    .from('categories')
    .select('id, sort_order')
    .eq('business_id', businessId)
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

  const { error: firstUpdateError } = await supabase
    .from('categories')
    .update({ sort_order: previous.sort_order } as never)
    .eq('id', current.id)

  if (firstUpdateError) {
    return { data: null, error: firstUpdateError.message }
  }

  const { error: secondUpdateError } = await supabase
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
  const supabase = await createClient()

  const { businessId, error: businessError } = await resolveCurrentBusinessId()

  if (businessError || !businessId) {
    return { data: null, error: businessError ?? 'Δεν βρέθηκε επιχείρηση.' }
  }

  const { data: current, error: currentError } = await supabase
    .from('categories')
    .select('id, sort_order')
    .eq('id', categoryId)
    .eq('business_id', businessId)
    .single()

  if (currentError || !current) {
    return { data: null, error: 'Η κατηγορία δεν βρέθηκε.' }
  }

  const { data: next, error: nextError } = await supabase
    .from('categories')
    .select('id, sort_order')
    .eq('business_id', businessId)
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

  const { error: firstUpdateError } = await supabase
    .from('categories')
    .update({ sort_order: next.sort_order } as never)
    .eq('id', current.id)

  if (firstUpdateError) {
    return { data: null, error: firstUpdateError.message }
  }

  const { error: secondUpdateError } = await supabase
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
  revalidatePath('/dashboard', 'layout')
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
  revalidatePath('/dashboard', 'layout')
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
  revalidatePath('/dashboard', 'layout')
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
  revalidatePath('/dashboard', 'layout')
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
  revalidatePath('/dashboard', 'layout')
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
  revalidatePath('/dashboard', 'layout')
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
  revalidatePath('/dashboard', 'layout')
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
  revalidatePath('/dashboard', 'layout')
  return { data: null, error: null }
}