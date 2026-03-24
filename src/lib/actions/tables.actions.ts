// Path: src/lib/actions/tables.actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
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

// ---------------------------------------------------------------------------
// getTablesWithSessions
// Primary query for the dashboard tables grid. Returns all active tables for
// a business with their current active session (if any), all orders in that
// session, and a computed session_total (sum of non-cancelled order totals).
// Cleared sessions (is_active = false) are excluded — they are historical.
// ---------------------------------------------------------------------------
export async function getTablesWithSessions(
  businessId?: string,
): Promise<ActionResult<TableWithActiveSession[]>> {
  const supabase = await createClient()

  let resolvedBusinessId = businessId

  if (!resolvedBusinessId) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Not authenticated' }
    }

    const { data: businessRow, error: businessError } = await supabase
      .from('business_users')
      .select('business_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (businessError || !businessRow?.business_id) {
      return { data: null, error: 'Δεν βρέθηκε επιχείρηση για τον χρήστη.' }
    }

    resolvedBusinessId = businessRow.business_id
  }

  const { data, error } = await supabase
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
    .eq('table_sessions.is_active', true)
    .order('table_number')

  if (error) return { data: null, error: error.message }

  const enriched: TableWithActiveSession[] = (data ?? []).map((table: any) => {
    const sessions = (table.table_sessions ?? []) as any[]
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

  return { data: enriched, error: null }
}

// ---------------------------------------------------------------------------
// getSessionDetail
// Full detail for one session: all orders, items, options, and session_total.
// Used by the table detail modal / expanded card view.
// ---------------------------------------------------------------------------
export async function getSessionDetail(
  sessionId: string,
): Promise<ActionResult<SessionWithOrders>> {
  const supabase = await createClient()

  const { data, error } = await supabase
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

// ---------------------------------------------------------------------------
// createTable
// Resolves the current user's business_id and inserts the table with the
// correct tenant context so the RLS policy passes.
// ---------------------------------------------------------------------------
export async function createTable(
  formData: FormData,
): Promise<ActionResult<Table>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'Not authenticated' }
  }

  const { data: businessRow, error: businessError } = await supabase
    .from('business_users')
    .select('business_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (businessError || !businessRow?.business_id) {
    return { data: null, error: 'Δεν βρέθηκε επιχείρηση για τον χρήστη.' }
  }

  const table_number = (formData.get('table_number') as string)?.trim()
  const name = ((formData.get('name') as string) || '').trim()

  if (!table_number) {
    return { data: null, error: 'Απαιτείται αριθμός τραπεζιού.' }
  }

  const payload: InsertTable = {
    business_id: businessRow.business_id,
    table_number,
    name: name || null,
  }

  const { data, error } = await supabase
    .from('tables')
    .insert(payload)
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

  revalidatePath('/dashboard/tables')
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard', 'layout')

  return { data, error: null }
}

// ---------------------------------------------------------------------------
// updateTable
// ---------------------------------------------------------------------------
export async function updateTable(
  tableId: string,
  updates: UpdateTable,
): Promise<ActionResult<Table>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tables')
    .update(updates)
    .eq('id', tableId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/dashboard/tables')
  revalidatePath('/dashboard/settings')
  return { data, error: null }
}

// ---------------------------------------------------------------------------
// clearTable
// Calls the clear_table SECURITY DEFINER DB function which closes the active
// session (is_active = false, cleared_at = now()). The next order on this
// table will open a fresh session automatically.
// ---------------------------------------------------------------------------
export async function clearTable(
  businessId: string,
  tableId: string,
): Promise<ActionResult> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('clear_table', {
    p_business_id: businessId,
    p_table_id: tableId,
  })

  if (error) return { data: null, error: error.message }

  if (!data.success) {
    return { data: null, error: data.message ?? 'Αποτυχία εκκαθάρισης τραπεζιού.' }
  }

  revalidatePath('/dashboard/tables')
  return { data: null, error: null }
}

// ---------------------------------------------------------------------------
// transferOrder
// Calls the transfer_order SECURITY DEFINER DB function. Moves one order to
// an empty target table. Target must have no active session (MVP constraint).
// ---------------------------------------------------------------------------
export async function transferOrder(
  businessId: string,
  orderId: string,
  targetTableId: string,
): Promise<ActionResult> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('transfer_order', {
    p_business_id: businessId,
    p_order_id: orderId,
    p_target_table_id: targetTableId,
  })

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

  revalidatePath('/dashboard/tables')
  return { data: null, error: null }
}