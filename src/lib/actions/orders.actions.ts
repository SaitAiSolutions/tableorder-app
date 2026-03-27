'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { canBusinessUseApp } from '@/lib/utils/trial'
import type {
  OrderStatus,
  OrderWithItems,
  PlaceOrderParams,
  PlaceOrderResult,
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

export async function placeOrder(
  params: PlaceOrderParams,
): Promise<ActionResult<PlaceOrderResult>> {
  const supabase = await createClient()

  const { data: businessRow, error: businessError } = await supabase
    .from('businesses')
    .select('id, account_status, trial_ends_at, subscription_status')
    .eq('id', params.p_business_id)
    .single()

  if (businessError || !businessRow) {
    return { data: null, error: 'Η επιχείρηση δεν είναι διαθέσιμη.' }
  }

  const canUse = canBusinessUseApp({
  account_status: businessRow.account_status,
  subscription_status: businessRow.subscription_status,
  trial_ends_at: businessRow.trial_ends_at,
})

  if (!canUse) {
    if (businessRow.account_status === 'suspended') {
      return {
        data: null,
        error: 'Η επιχείρηση δεν δέχεται παραγγελίες αυτή τη στιγμή.',
      }
    }

    return {
      data: null,
      error: 'Η επιχείρηση δεν είναι διαθέσιμη αυτή τη στιγμή.',
    }
  }

  await supabase.rpc('set_current_business' as never, {
    p_id: params.p_business_id,
  } as never)

  const { data, error } = await supabase.rpc('place_order' as never, {
    p_business_id: params.p_business_id,
    p_table_id: params.p_table_id,
    p_notes: params.p_notes ?? null,
    p_items: params.p_items as unknown as never,
  } as never)

  if (error) {
    if (error.message.includes('table_not_found')) {
      return { data: null, error: 'Το τραπέζι δεν είναι διαθέσιμο.' }
    }
    if (error.message.includes('product_not_found')) {
      return {
        data: null,
        error: 'Ένα προϊόν δεν είναι διαθέσιμο. Ανανεώστε τη σελίδα.',
      }
    }
    if (error.message.includes('required_group_missing')) {
      return {
        data: null,
        error: 'Παρακαλώ επιλέξτε όλες τις υποχρεωτικές επιλογές.',
      }
    }
    if (error.message.includes('duplicate_group_selection')) {
      return {
        data: null,
        error: 'Επιλέξτε μόνο μία επιλογή ανά ομάδα.',
      }
    }
    if (error.message.includes('empty_order')) {
      return { data: null, error: 'Το καλάθι είναι άδειο.' }
    }

    return { data: null, error: 'Αποτυχία υποβολής παραγγελίας. Δοκιμάστε ξανά.' }
  }

  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard/tables')
  revalidatePath('/dashboard', 'layout')

  return { data: data as unknown as PlaceOrderResult, error: null }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('orders')
    .update({ status } as never)
    .eq('id', orderId)

  if (error) return { data: null, error: error.message }

  revalidatePath('/dashboard/tables')
  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard', 'layout')

  return { data: null, error: null }
}

export async function cancelOrder(orderId: string): Promise<ActionResult> {
  return updateOrderStatus(orderId, 'cancelled')
}

export async function getOrdersByBusiness(
  businessId?: string,
  limit = 50,
): Promise<ActionResult<OrderWithItems[]>> {
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
    .from('orders')
    .select(`
      *,
      table:tables (
        id,
        table_number,
        name
      ),
      order_items (
        *,
        order_item_options (*)
      )
    `)
    .eq('business_id', resolvedBusinessId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { data: null, error: error.message }

  return { data: (data ?? []) as unknown as OrderWithItems[], error: null }
}