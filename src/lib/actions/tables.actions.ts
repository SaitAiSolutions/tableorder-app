'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSuperAdminEmail } from '@/lib/utils/admin'
import type {
  Table,
  InsertTable,
  UpdateTable,
  TableWithActiveSession,
  SessionWithOrders,
  OrderWithItems,
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

  const { data: businessRow, error: businessError } = await supabase
    .from('business_users')
    .select('business_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const row = businessRow as { business_id?: string } | null

  if (businessError || !row?.business_id) {
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

async function refreshBusinessPlan(businessId: string) {
  const admin = createAdminClient()

  await admin.rpc('refresh_business_plan_from_tables' as never, {
    p_business_id: businessId,
  } as never)

  revalidatePath('/dashboard/billing')
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard', 'layout')
}

export async function getTablesWithSessions(
  businessId?: string,
): Promise<ActionResult<TableWithActiveSession[]>> {
  const context = await resolveCurrentBusinessContext()

  let resolvedBusinessId = businessId

  if (!resolvedBusinessId) {
    if (context.error || !context.businessId) {
      return { data: null, error: context.error ?? 'Δεν βρέθηκε επιχείρηση.' }
    }

    resolvedBusinessId = context.businessId
  }

  const { data, error } = await context.db
    .from('tables')
    .select(`
      *,
      table_sessions (
        id,
        status,
        is_active,
        started_at,
        cleared_at,
        created_at,
        orders (
          id,
          business_id,
          table_id,
          table_session_id,
          status,
          notes,
          total_amount,
          created_at,
          updated_at,
          order_items (
            id,
            business_id,
            order_id,
            product_id,
            product_name_snapshot_el,
            product_name_snapshot_en,
            unit_price,
            quantity,
            line_total,
            order_item_options (
              id,
              business_id,
              order_item_id,
              option_group_name_el,
              option_group_name_en,
              option_choice_name_el,
              option_choice_name_en,
              price_delta
            )
          )
        )
      )
    `)
    .eq('business_id', resolvedBusinessId)
    .eq('is_active', true)
    .order('table_number')

  if (error) return { data: null, error: error.message }

  const enriched: TableWithActiveSession[] = (data ?? []).map((table: any) => {
    const sessions = Array.isArray(table.table_sessions) ? table.table_sessions : []

    const activeRawSession =
      sessions.find((session) => session?.is_active === true) ?? null

    if (!activeRawSession) {
      return {
        ...table,
        active_session: null,
      }
    }

    const orders = (activeRawSession.orders ?? []) as OrderWithItems[]

    const session_total = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.total_amount ?? 0), 0)

    const active_session: SessionWithOrders = {
      ...activeRawSession,
      business_id: table.business_id,
      table_id: table.id,
      orders,
      session_total,
    }

    return {
      ...table,
      active_session,
    }
  })

  return { data: enriched, error: null }
}

export async function getSessionDetail(
  sessionId: string,
): Promise<ActionResult<SessionWithOrders>> {
  const context = await resolveCurrentBusinessContext()

  const { data, error } = await context.db
    .from('table_sessions')
    .select(`
      *,
      orders (
        *,
        order_items (
          *,
          order_item_options (*)
        )
      )
    `)
    .eq('id', sessionId)
    .single()

  if (error) return { data: null, error: error.message }

  const orders = (data.orders ?? []) as OrderWithItems[]
  const session_total = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + Number(o.total_amount ?? 0), 0)

  return {
    data: { ...data, orders, session_total } as SessionWithOrders,
    error: null,
  }
}

export async function createTable(
  formData: FormData,
): Promise<ActionResult<Table>> {
  const context = await resolveCurrentBusinessContext()

  if (context.error || !context.businessId) {
    return { data: null, error: context.error ?? 'Δεν βρέθηκε επιχείρηση.' }
  }

  const table_number = (formData.get('table_number') as string)?.trim()
  const name = ((formData.get('name') as string) || '').trim()

  if (!table_number) {
    return { data: null, error: 'Απαιτείται αριθμός τραπεζιού.' }
  }

  const payload: InsertTable = {
    business_id: context.businessId,
    table_number,
    name: name || null,
  }

  const { data, error } = await context.db
    .from('tables')
    .insert(payload as never)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return {
        data: null,
        error: `Το τραπέζι "${table_number}" υπάρχει ήδη.`,
      }
    }
    return { data: null, error: error.message }
  }

  await refreshBusinessPlan(context.businessId)

  revalidatePath('/dashboard/tables')
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/billing')
  revalidatePath('/dashboard', 'layout')

  return { data: data as Table, error: null }
}

export async function createTablesBatch(
  count: number,
): Promise<ActionResult<{ created: number }>> {
  const context = await resolveCurrentBusinessContext()

  if (context.error || !context.businessId) {
    return { data: null, error: context.error ?? 'Δεν βρέθηκε επιχείρηση.' }
  }

  const normalizedCount = Number(count)

  if (!Number.isInteger(normalizedCount) || normalizedCount < 1) {
    return { data: null, error: 'Δώστε έγκυρο αριθμό τραπεζιών.' }
  }

  if (normalizedCount > 200) {
    return { data: null, error: 'Μπορείτε να δημιουργήσετε έως 200 τραπέζια τη φορά.' }
  }

  const { data: existingTables, error: existingError } = await context.db
    .from('tables')
    .select('table_number')
    .eq('business_id', context.businessId)

  if (existingError) {
    return { data: null, error: existingError.message }
  }

  const existingNumbers = new Set(
    (existingTables ?? []).map((table) => String(table.table_number).trim()),
  )

  const payload: InsertTable[] = []

  for (let i = 1; i <= normalizedCount; i += 1) {
    const value = String(i)

    if (existingNumbers.has(value)) {
      continue
    }

    payload.push({
      business_id: context.businessId,
      table_number: value,
      name: null,
      is_active: true,
      notes: null,
    })
  }

  if (payload.length === 0) {
    return {
      data: { created: 0 },
      error: null,
    }
  }

  const { error: insertError } = await context.db
    .from('tables')
    .insert(payload as never)

  if (insertError) {
    return { data: null, error: insertError.message }
  }

  await refreshBusinessPlan(context.businessId)

  revalidatePath('/dashboard/tables')
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/billing')
  revalidatePath('/dashboard', 'layout')
  revalidatePath('/onboarding/ready')

  return {
    data: { created: payload.length },
    error: null,
  }
}

export async function updateTable(
  tableId: string,
  updates: UpdateTable,
): Promise<ActionResult<Table>> {
  const context = await resolveCurrentBusinessContext()

  const { data, error } = await context.db
    .from('tables')
    .update(updates as never)
    .eq('id', tableId)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return {
        data: null,
        error: 'Υπάρχει ήδη τραπέζι με αυτόν τον αριθμό.',
      }
    }
    return { data: null, error: error.message }
  }

  revalidatePath('/dashboard/tables')
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard', 'layout')

  return { data: data as Table, error: null }
}

export async function deleteTable(tableId: string): Promise<ActionResult> {
  const context = await resolveCurrentBusinessContext()

  if (context.error || !context.businessId) {
    return { data: null, error: context.error ?? 'Δεν βρέθηκε επιχείρηση.' }
  }

  const { data: tableRow, error: tableError } = await context.db
    .from('tables')
    .select('id')
    .eq('id', tableId)
    .single()

  if (tableError || !tableRow) {
    return { data: null, error: 'Το τραπέζι δεν βρέθηκε.' }
  }

  const { data: activeSession, error: sessionError } = await context.db
    .from('table_sessions')
    .select('id')
    .eq('table_id', tableId)
    .eq('is_active', true)
    .maybeSingle()

  if (sessionError) {
    return { data: null, error: sessionError.message }
  }

  if (activeSession) {
    return {
      data: null,
      error: 'Δεν μπορείτε να διαγράψετε κατειλημμένο τραπέζι.',
    }
  }

  const { error } = await context.db.from('tables').delete().eq('id', tableId)

  if (error) {
    return { data: null, error: error.message }
  }

  await refreshBusinessPlan(context.businessId)

  revalidatePath('/dashboard/tables')
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard/billing')
  revalidatePath('/dashboard', 'layout')

  return { data: null, error: null }
}

export async function clearTable(tableId: string): Promise<ActionResult> {
  const context = await resolveCurrentBusinessContext()

  if (context.error || !context.businessId) {
    return { data: null, error: context.error ?? 'Δεν βρέθηκε επιχείρηση.' }
  }

  const { data, error } = await context.db.rpc('clear_table' as never, {
    p_business_id: context.businessId,
    p_table_id: tableId,
  } as never)

  if (error) return { data: null, error: error.message }

  const result = data as { success?: boolean; message?: string } | null

  if (!result?.success) {
    return {
      data: null,
      error: result?.message ?? 'Αποτυχία εκκαθάρισης τραπεζιού.',
    }
  }

  revalidatePath('/dashboard/tables')
  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard', 'layout')

  return { data: null, error: null }
}

export async function transferOrder(
  businessId: string,
  orderId: string,
  targetTableId: string,
): Promise<ActionResult> {
  const context = await resolveCurrentBusinessContext()

  const { data, error } = await context.db.rpc('transfer_order' as never, {
    p_business_id: businessId,
    p_order_id: orderId,
    p_target_table_id: targetTableId,
  } as never)

  if (error) {
    if (error.message.includes('target_table_occupied')) {
      return {
        data: null,
        error: 'Το τραπέζι-στόχος είναι κατειλημμένο. Επιλέξτε άλλο.',
      }
    }
    if (error.message.includes('order_not_found')) {
      return { data: null, error: 'Η παραγγελία δεν βρέθηκε.' }
    }
    if (error.message.includes('target_table_invalid')) {
      return { data: null, error: 'Το τραπέζι-στόχος δεν είναι έγκυρο.' }
    }
    return { data: null, error: error.message }
  }

  const result = data as { success?: boolean } | null

  if (!result?.success) {
    return { data: null, error: 'Αποτυχία μεταφοράς παραγγελίας.' }
  }

  revalidatePath('/dashboard/tables')
  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard', 'layout')

  return { data: null, error: null }
}