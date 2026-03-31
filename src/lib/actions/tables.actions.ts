'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
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

function sortTablesNumerically<T extends { table_number?: string | null; name?: string | null }>(
  tables: T[],
) {
  return [...tables].sort((a, b) => {
    const aRaw = String(a.table_number ?? '').trim()
    const bRaw = String(b.table_number ?? '').trim()

    const aNum = Number(aRaw)
    const bNum = Number(bRaw)

    const aIsNum = Number.isFinite(aNum)
    const bIsNum = Number.isFinite(bNum)

    if (aIsNum && bIsNum && aNum !== bNum) {
      return aNum - bNum
    }

    if (aIsNum && !bIsNum) return -1
    if (!aIsNum && bIsNum) return 1

    const textCompare = aRaw.localeCompare(bRaw, undefined, {
      numeric: true,
      sensitivity: 'base',
    })

    if (textCompare !== 0) return textCompare

    return String(a.name ?? '').localeCompare(String(b.name ?? ''), undefined, {
      sensitivity: 'base',
    })
  })
}

async function getBusinessContext() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      businessId: null as string | null,
      error: 'Not authenticated',
      useAdmin: false,
      client: supabase,
    }
  }

  const cookieStore = await cookies()
  const adminSelectedBusinessId = cookieStore.get('admin_business_id')?.value
  const isSuperAdmin = isSuperAdminEmail(user.email)

  if (isSuperAdmin && adminSelectedBusinessId) {
    const { data: selectedBusiness, error: selectedBusinessError } = await admin
      .from('businesses')
      .select('id')
      .eq('id', adminSelectedBusinessId)
      .eq('is_active', true)
      .maybeSingle()

    if (selectedBusinessError || !selectedBusiness?.id) {
      return {
        businessId: null as string | null,
        error: 'Η επιλεγμένη επιχείρηση admin δεν βρέθηκε.',
        useAdmin: true,
        client: admin,
      }
    }

    return {
      businessId: selectedBusiness.id,
      error: null,
      useAdmin: true,
      client: admin,
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
      businessId: null as string | null,
      error: 'Δεν βρέθηκε επιχείρηση για τον χρήστη.',
      useAdmin: false,
      client: supabase,
    }
  }

  return {
    businessId: row.business_id,
    error: null,
    useAdmin: false,
    client: supabase,
  }
}

async function refreshBusinessPlan(businessId: string) {
  const { client } = await getBusinessContext()

  await client.rpc('refresh_business_plan_from_tables' as never, {
    p_business_id: businessId,
  } as never)

  revalidatePath('/dashboard/billing')
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard', 'layout')
  revalidatePath('/admin')
}

async function clearTableAsAdmin(
  businessId: string,
  tableId: string,
): Promise<ActionResult> {
  const admin = createAdminClient()

  const { data: tableRow, error: tableError } = await admin
    .from('tables')
    .select('id, business_id')
    .eq('id', tableId)
    .eq('business_id', businessId)
    .eq('is_active', true)
    .maybeSingle()

  if (tableError) {
    return { data: null, error: tableError.message }
  }

  if (!tableRow) {
    return { data: null, error: 'Το τραπέζι δεν βρέθηκε.' }
  }

  const { data: activeSession, error: sessionError } = await admin
    .from('table_sessions')
    .select('id')
    .eq('table_id', tableId)
    .eq('business_id', businessId)
    .eq('is_active', true)
    .maybeSingle()

  if (sessionError) {
    return { data: null, error: sessionError.message }
  }

  if (!activeSession?.id) {
    return { data: null, error: 'Δεν υπάρχει ενεργή συνεδρία για εκκαθάριση.' }
  }

  const nowIso = new Date().toISOString()

  const { error: ordersError } = await admin
    .from('orders')
    .update({
      status: 'completed',
      updated_at: nowIso,
    } as never)
    .eq('session_id', activeSession.id)
    .in('status', ['new', 'accepted', 'preparing', 'ready'])

  if (ordersError) {
    return { data: null, error: ordersError.message }
  }

  const { error: sessionUpdateError } = await admin
    .from('table_sessions')
    .update({
      is_active: false,
      status: 'cleared',
      cleared_at: nowIso,
    } as never)
    .eq('id', activeSession.id)

  if (sessionUpdateError) {
    return { data: null, error: sessionUpdateError.message }
  }

  revalidatePath('/dashboard/tables')
  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard', 'layout')
  revalidatePath('/admin')

  return { data: null, error: null }
}

export async function getTablesWithSessions(
  businessId?: string,
): Promise<ActionResult<TableWithActiveSession[]>> {
  const context = await getBusinessContext()
  const client = context.client

  let resolvedBusinessId = businessId

  if (!resolvedBusinessId) {
    if (context.error || !context.businessId) {
      return { data: null, error: context.error ?? 'Δεν βρέθηκε επιχείρηση.' }
    }

    resolvedBusinessId = context.businessId
  }

  const { data, error } = await client
    .from('tables')
    .select(`
      *,
      table_sessions (
        id, status, is_active, started_at, cleared_at, created_at,
        orders (
          id, status, total_amount, notes, created_at, updated_at,
          order_items (
            id, product_name_snapshot_el, product_name_snapshot_en,
            unit_price, quantity, line_total,
            order_item_options (
              id, option_group_name_el, option_group_name_en,
              option_choice_name_el, option_choice_name_en, price_delta
            )
          )
        )
      )
    `)
    .eq('business_id', resolvedBusinessId)
    .eq('is_active', true)

  if (error) return { data: null, error: error.message }

  const enriched: TableWithActiveSession[] = (data ?? []).map((table: any) => {
    const sessions = ((table.table_sessions ?? []) as any[]).filter(
      (session) => session?.is_active === true,
    )
    const session = sessions[0] ?? null

    if (!session) return { ...table, active_session: null }

    const orders = (session.orders ?? []) as OrderWithItems[]
    const session_total = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.total_amount ?? 0), 0)

    const active_session: SessionWithOrders = {
      ...session,
      business_id: table.business_id,
      table_id: table.id,
      orders,
      session_total,
    }

    return { ...table, active_session }
  })

  return { data: sortTablesNumerically(enriched), error: null }
}

export async function getSessionDetail(
  sessionId: string,
): Promise<ActionResult<SessionWithOrders>> {
  const context = await getBusinessContext()
  const client = context.client

  const { data, error } = await client
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
    .reduce((sum, o) => sum + o.total_amount, 0)

  return {
    data: { ...data, orders, session_total } as SessionWithOrders,
    error: null,
  }
}

export async function createTable(
  formData: FormData,
): Promise<ActionResult<Table>> {
  const context = await getBusinessContext()
  const client = context.client
  const businessId = context.businessId

  if (context.error || !businessId) {
    return { data: null, error: context.error ?? 'Δεν βρέθηκε επιχείρηση.' }
  }

  const table_number = (formData.get('table_number') as string)?.trim()
  const name = ((formData.get('name') as string) || '').trim()

  if (!table_number) {
    return { data: null, error: 'Απαιτείται αριθμός τραπεζιού.' }
  }

  const payload: InsertTable = {
    business_id: businessId,
    table_number,
    name: name || null,
    is_active: true,
    notes: null,
  }

  const { data, error } = await client
    .from('tables')
    .insert(payload as never)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return {
        data: null,
        error: 'Υπάρχει ήδη τραπέζι με αυτόν τον αριθμό και αυτή την περιγραφή.',
      }
    }
    return { data: null, error: error.message }
  }

  await refreshBusinessPlan(businessId)

  revalidatePath('/dashboard/tables')
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/billing')
  revalidatePath('/dashboard', 'layout')
  revalidatePath('/admin')

  return { data: data as Table, error: null }
}

export async function createTablesBatch(
  count: number,
): Promise<ActionResult<{ created: number }>> {
  const context = await getBusinessContext()
  const client = context.client
  const businessId = context.businessId

  if (context.error || !businessId) {
    return { data: null, error: context.error ?? 'Δεν βρέθηκε επιχείρηση.' }
  }

  const normalizedCount = Number(count)

  if (!Number.isInteger(normalizedCount) || normalizedCount < 1) {
    return { data: null, error: 'Δώστε έγκυρο αριθμό τραπεζιών.' }
  }

  if (normalizedCount > 200) {
    return { data: null, error: 'Μπορείτε να δημιουργήσετε έως 200 τραπέζια τη φορά.' }
  }

  const { data: existingTables, error: existingError } = await client
    .from('tables')
    .select('table_number, name')
    .eq('business_id', businessId)

  if (existingError) {
    return { data: null, error: existingError.message }
  }

  const existingKeys = new Set(
    (existingTables ?? []).map(
      (table) => `${String(table.table_number).trim()}::${String(table.name ?? '').trim()}`,
    ),
  )

  const payload: InsertTable[] = []

  for (let i = 1; i <= normalizedCount; i += 1) {
    const value = String(i)
    const key = `${value}::`

    if (existingKeys.has(key)) {
      continue
    }

    payload.push({
      business_id: businessId,
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

  const { error: insertError } = await client
    .from('tables')
    .insert(payload as never)

  if (insertError) {
    return { data: null, error: insertError.message }
  }

  await refreshBusinessPlan(businessId)

  revalidatePath('/dashboard/tables')
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/billing')
  revalidatePath('/dashboard', 'layout')
  revalidatePath('/onboarding/ready')
  revalidatePath('/admin')

  return {
    data: { created: payload.length },
    error: null,
  }
}

export async function updateTable(
  tableId: string,
  updates: UpdateTable,
): Promise<ActionResult<Table>> {
  const context = await getBusinessContext()
  const client = context.client

  const { data, error } = await client
    .from('tables')
    .update(updates as never)
    .eq('id', tableId)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return {
        data: null,
        error: 'Υπάρχει ήδη τραπέζι με αυτόν τον αριθμό και αυτή την περιγραφή.',
      }
    }
    return { data: null, error: error.message }
  }

  revalidatePath('/dashboard/tables')
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard', 'layout')
  revalidatePath('/admin')

  return { data: data as Table, error: null }
}

export async function deleteTable(tableId: string): Promise<ActionResult> {
  const context = await getBusinessContext()
  const client = context.client
  const businessId = context.businessId

  if (context.error || !businessId) {
    return { data: null, error: context.error ?? 'Δεν βρέθηκε επιχείρηση.' }
  }

  const { data: tableRow, error: tableError } = await client
    .from('tables')
    .select('id')
    .eq('id', tableId)
    .single()

  if (tableError || !tableRow) {
    return { data: null, error: 'Το τραπέζι δεν βρέθηκε.' }
  }

  const { data: activeSession, error: sessionError } = await client
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

  const { error } = await client.from('tables').delete().eq('id', tableId)

  if (error) {
    return { data: null, error: error.message }
  }

  await refreshBusinessPlan(businessId)

  revalidatePath('/dashboard/tables')
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard/billing')
  revalidatePath('/dashboard', 'layout')
  revalidatePath('/admin')

  return { data: null, error: null }
}

export async function clearTable(tableId: string): Promise<ActionResult> {
  const context = await getBusinessContext()
  const client = context.client
  const businessId = context.businessId

  if (context.error || !businessId) {
    return { data: null, error: context.error ?? 'Δεν βρέθηκε επιχείρηση.' }
  }

  if (context.useAdmin) {
    return clearTableAsAdmin(businessId, tableId)
  }

  const { data, error } = await client.rpc('clear_table' as never, {
    p_business_id: businessId,
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
  revalidatePath('/admin')

  return { data: null, error: null }
}

export async function transferOrder(
  businessId: string,
  orderId: string,
  targetTableId: string,
): Promise<ActionResult> {
  const context = await getBusinessContext()
  const client = context.client

  const resolvedBusinessId = context.businessId ?? businessId

  if (context.error || !resolvedBusinessId) {
    return { data: null, error: context.error ?? 'Δεν βρέθηκε επιχείρηση.' }
  }

  const { data, error } = await client.rpc('transfer_order' as never, {
    p_business_id: resolvedBusinessId,
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
  revalidatePath('/admin')

  return { data: null, error: null }
}