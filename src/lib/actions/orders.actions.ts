'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSuperAdminEmail } from '@/lib/utils/admin'
import { isTrialExpired } from '@/lib/utils/trial'
import { triggerAutomaticPrintForOrder } from '@/lib/actions/printer.actions'
import type {
  OrderStatus,
  OrderWithItems,
  PlaceOrderParams,
  PlaceOrderResult,
  ServiceRequestType,
} from '@/types/database.types'

interface ActionResult<T = null> {
  data: T | null
  error: string | null
}

const SERVICE_REQUEST_PREFIX = '__SERVICE_REQUEST__:'

function getServiceRequestNote(type: ServiceRequestType) {
  return `${SERVICE_REQUEST_PREFIX}${type}`
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

async function ensureBusinessCanReceiveOrders(
  businessId: string,
) {
  const admin = createAdminClient()

  const { data: businessRow, error: businessError } = await admin
    .from('businesses')
    .select('id, account_status, trial_ends_at, subscription_status, is_active')
    .eq('id', businessId)
    .eq('is_active', true)
    .single()

  if (businessError || !businessRow) {
    return {
      ok: false as const,
      error: 'Η επιχείρηση δεν είναι διαθέσιμη.',
    }
  }

  const accountStatus = String(businessRow.account_status ?? '')
  const subscriptionStatus = String(businessRow.subscription_status ?? '')
  const trialEndsAt = businessRow.trial_ends_at as string | null | undefined
  const trialExpired = isTrialExpired(trialEndsAt)

  let canUse = false

  if (accountStatus === 'suspended' || accountStatus === 'cancelled') {
    canUse = false
  } else if (
    subscriptionStatus === 'active' ||
    subscriptionStatus === 'past_due'
  ) {
    canUse = true
  } else if (subscriptionStatus === 'trialing') {
    canUse = !trialExpired
  } else {
    canUse = !trialExpired
  }

  if (!canUse) {
    if (accountStatus === 'suspended') {
      return {
        ok: false as const,
        error: 'Η επιχείρηση δεν δέχεται παραγγελίες αυτή τη στιγμή.',
      }
    }

    return {
      ok: false as const,
      error: 'Η επιχείρηση δεν είναι διαθέσιμη αυτή τη στιγμή.',
    }
  }

  return {
    ok: true as const,
  }
}

async function ensureActiveTable(
  businessId: string,
  tableId: string,
) {
  const admin = createAdminClient()

  const { data: tableRow, error: tableError } = await admin
    .from('tables')
    .select('id, business_id, is_active')
    .eq('id', tableId)
    .eq('business_id', businessId)
    .eq('is_active', true)
    .single()

  if (tableError || !tableRow) {
    return {
      ok: false as const,
      error: 'Το τραπέζι δεν είναι διαθέσιμο.',
    }
  }

  return {
    ok: true as const,
  }
}

async function getOrCreateActiveSession(
  businessId: string,
  tableId: string,
) {
  const admin = createAdminClient()

  const { data: existingSession, error: existingSessionError } = await admin
    .from('table_sessions')
    .select('id')
    .eq('business_id', businessId)
    .eq('table_id', tableId)
    .eq('is_active', true)
    .maybeSingle()

  if (existingSessionError) {
    return { sessionId: null, error: existingSessionError.message }
  }

  if (existingSession?.id) {
    return { sessionId: existingSession.id, error: null }
  }

  const { data: createdSession, error: createSessionError } = await admin
    .from('table_sessions')
    .insert({
      business_id: businessId,
      table_id: tableId,
      status: 'active',
      is_active: true,
      started_at: new Date().toISOString(),
      cleared_at: null,
    } as never)
    .select('id')
    .single()

  if (createSessionError || !createdSession?.id) {
    return {
      sessionId: null,
      error: createSessionError?.message ?? 'Αποτυχία δημιουργίας συνεδρίας τραπεζιού.',
    }
  }

  return { sessionId: createdSession.id, error: null }
}

async function createServiceRequest(
  businessId: string,
  tableId: string,
  type: ServiceRequestType,
): Promise<ActionResult<{ order_id: string }>> {
  const businessCheck = await ensureBusinessCanReceiveOrders(businessId)

  if (!businessCheck.ok) {
    return { data: null, error: businessCheck.error }
  }

  const tableCheck = await ensureActiveTable(businessId, tableId)

  if (!tableCheck.ok) {
    return { data: null, error: tableCheck.error }
  }

  const { sessionId, error: sessionError } = await getOrCreateActiveSession(
    businessId,
    tableId,
  )

  if (sessionError || !sessionId) {
    return { data: null, error: sessionError ?? 'Αποτυχία συνεδρίας τραπεζιού.' }
  }

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('orders')
    .insert({
      business_id: businessId,
      table_id: tableId,
      table_session_id: sessionId,
      status: 'new',
      notes: getServiceRequestNote(type),
      total_amount: 0,
    } as never)
    .select('id')
    .single()

  if (error || !data?.id) {
    return {
      data: null,
      error: error?.message ?? 'Αποτυχία καταχώρησης αιτήματος.',
    }
  }

  const printResult = await triggerAutomaticPrintForOrder(data.id)
  if (printResult.error) {
    console.error('[auto_print_service_request]', printResult.error)
  }

  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard/tables')
  revalidatePath('/dashboard', 'layout')

  return { data: { order_id: data.id }, error: null }
}

export async function requestWaiter(
  businessId: string,
  tableId: string,
): Promise<ActionResult<{ order_id: string }>> {
  return createServiceRequest(businessId, tableId, 'waiter')
}

export async function requestBill(
  businessId: string,
  tableId: string,
): Promise<ActionResult<{ order_id: string }>> {
  return createServiceRequest(businessId, tableId, 'bill')
}

export async function placeOrder(
  params: PlaceOrderParams,
): Promise<ActionResult<PlaceOrderResult>> {
  const businessCheck = await ensureBusinessCanReceiveOrders(params.p_business_id)

  if (!businessCheck.ok) {
    return { data: null, error: businessCheck.error }
  }

  const tableCheck = await ensureActiveTable(params.p_business_id, params.p_table_id)

  if (!tableCheck.ok) {
    return { data: null, error: tableCheck.error }
  }

  const admin = createAdminClient()

  await admin.rpc('set_current_business' as never, {
    p_id: params.p_business_id,
  } as never)

  const { data, error } = await admin.rpc('place_order' as never, {
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

    return {
      data: null,
      error: `RPC error: ${error.message}`,
    }
  }

  const resultData = data as unknown as PlaceOrderResult

  if (resultData?.order_id) {
    const printResult = await triggerAutomaticPrintForOrder(resultData.order_id)
    if (printResult.error) {
      console.error('[auto_print_order]', printResult.error)
    }
  }

  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard/tables')
  revalidatePath('/dashboard', 'layout')

  return { data: resultData, error: null }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<ActionResult> {
  const context = await resolveCurrentBusinessContext()

  const { error } = await context.db
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
  const context = await resolveCurrentBusinessContext()

  let resolvedBusinessId = businessId

  if (!resolvedBusinessId) {
    if (context.error || !context.businessId) {
      return { data: null, error: context.error ?? 'Δεν βρέθηκε επιχείρηση.' }
    }

    resolvedBusinessId = context.businessId
  }

  const { data, error } = await context.db
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