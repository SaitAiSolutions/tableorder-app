'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentBusiness } from '@/lib/actions/business.actions'
import type {
  DailyCashClosure,
  ServiceRequestType,
  Table,
} from '@/types/database.types'

interface ActionResult<T = null> {
  data: T | null
  error: string | null
}

const SERVICE_REQUEST_PREFIX = '__SERVICE_REQUEST__:'

function getServiceRequestType(notes?: string | null): ServiceRequestType | null {
  if (!notes?.startsWith(SERVICE_REQUEST_PREFIX)) return null

  const value = notes.replace(SERVICE_REQUEST_PREFIX, '').trim()

  if (value === 'waiter' || value === 'bill') return value
  return null
}

function getTodayDateStringAthens() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Athens',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  return formatter.format(new Date())
}

type ClosureOrderItem = {
  id: string
  total_amount: number
  created_at: string
  table_id: string
  table_label: string
}

export type DailyCashClosureWithOrders = DailyCashClosure & {
  included_orders: ClosureOrderItem[]
}

export async function getLastCashClosureForBusiness(): Promise<
  ActionResult<DailyCashClosure>
> {
  const supabase = await createClient()
  const { data: business, error: businessError } = await getCurrentBusiness()

  if (businessError || !business) {
    return { data: null, error: businessError ?? 'Η επιχείρηση δεν βρέθηκε.' }
  }

  const { data, error } = await supabase
    .from('daily_cash_closures')
    .select('*')
    .eq('business_id', business.id)
    .order('closed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: (data as DailyCashClosure) ?? null, error: null }
}

export async function getRecentCashClosures(): Promise<
  ActionResult<DailyCashClosure[]>
> {
  const supabase = await createClient()
  const { data: business, error: businessError } = await getCurrentBusiness()

  if (businessError || !business) {
    return { data: null, error: businessError ?? 'Η επιχείρηση δεν βρέθηκε.' }
  }

  const { data, error } = await supabase
    .from('daily_cash_closures')
    .select('*')
    .eq('business_id', business.id)
    .order('closed_at', { ascending: false })
    .limit(5)

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: (data as DailyCashClosure[]) ?? [], error: null }
}

export async function getRecentCashClosuresWithOrders(): Promise<
  ActionResult<DailyCashClosureWithOrders[]>
> {
  const supabase = await createClient()
  const { data: business, error: businessError } = await getCurrentBusiness()

  if (businessError || !business) {
    return { data: null, error: businessError ?? 'Η επιχείρηση δεν βρέθηκε.' }
  }

  const { data: closuresRaw, error: closuresError } = await supabase
    .from('daily_cash_closures')
    .select('*')
    .eq('business_id', business.id)
    .order('closed_at', { ascending: true })
    .limit(5)

  if (closuresError) {
    return { data: null, error: closuresError.message }
  }

  const closures = (closuresRaw as DailyCashClosure[]) ?? []

  if (closures.length === 0) {
    return { data: [], error: null }
  }

  const newestClosure = closures[closures.length - 1]

  const { data: ordersRaw, error: ordersError } = await supabase
    .from('orders')
    .select('id, total_amount, created_at, table_id, notes')
    .eq('business_id', business.id)
    .lte('created_at', newestClosure.closed_at)
    .order('created_at', { ascending: true })

  if (ordersError) {
    return { data: null, error: ordersError.message }
  }

  const regularOrders = (ordersRaw ?? []).filter(
    (order) => !getServiceRequestType(order.notes),
  ) as Array<{
    id: string
    total_amount: number
    created_at: string
    table_id: string
    notes?: string | null
  }>

  const uniqueTableIds = [...new Set(regularOrders.map((order) => order.table_id).filter(Boolean))]

  let tableMap = new Map<string, string>()

  if (uniqueTableIds.length > 0) {
    const { data: tablesRaw, error: tablesError } = await supabase
      .from('tables')
      .select('id, table_number, name')
      .in('id', uniqueTableIds)

    if (tablesError) {
      return { data: null, error: tablesError.message }
    }

    const tables = (tablesRaw ?? []) as Table[]

    tableMap = new Map(
      tables.map((table) => [
        table.id,
        table.name?.trim()
          ? `${table.table_number} · ${table.name}`
          : `${table.table_number}`,
      ]),
    )
  }

  const resultAscending: DailyCashClosureWithOrders[] = closures.map((closure, index) => {
    const previousClosure = index > 0 ? closures[index - 1] : null

    const includedOrders = regularOrders
      .filter((order) => {
        const createdAt = new Date(order.created_at).getTime()
        const currentClosedAt = new Date(closure.closed_at).getTime()

        if (previousClosure) {
          const previousClosedAt = new Date(previousClosure.closed_at).getTime()
          return createdAt > previousClosedAt && createdAt <= currentClosedAt
        }

        return createdAt <= currentClosedAt
      })
      .map((order) => ({
        id: order.id,
        total_amount: Number(order.total_amount ?? 0),
        created_at: order.created_at,
        table_id: order.table_id,
        table_label: tableMap.get(order.table_id) ?? '—',
      }))

    return {
      ...closure,
      included_orders: includedOrders.reverse(),
    }
  })

  return {
    data: resultAscending.reverse(),
    error: null,
  }
}

export async function closeBusinessDay(): Promise<ActionResult<DailyCashClosure>> {
  const supabase = await createClient()
  const { data: business, error: businessError } = await getCurrentBusiness()

  if (businessError || !business) {
    return { data: null, error: businessError ?? 'Η επιχείρηση δεν βρέθηκε.' }
  }

  const todayDate = getTodayDateStringAthens()

  const { data: existingClosure, error: existingError } = await supabase
    .from('daily_cash_closures')
    .select('*')
    .eq('business_id', business.id)
    .eq('closure_date', todayDate)
    .maybeSingle()

  if (existingError) {
    return { data: null, error: existingError.message }
  }

  if (existingClosure) {
    return {
      data: null,
      error: 'Η ημέρα έχει ήδη κλείσει σήμερα.',
    }
  }

  const { data: lastClosure } = await getLastCashClosureForBusiness()

  let ordersQuery = supabase
    .from('orders')
    .select('id, notes, total_amount, created_at')
    .eq('business_id', business.id)
    .order('created_at', { ascending: true })

  if (lastClosure?.closed_at) {
    ordersQuery = ordersQuery.gt('created_at', lastClosure.closed_at)
  }

  const { data: orders, error: ordersError } = await ordersQuery

  if (ordersError) {
    return { data: null, error: ordersError.message }
  }

  const regularOrders = (orders ?? []).filter(
    (order) => !getServiceRequestType(order.notes),
  )

  const totalAmount = regularOrders.reduce(
    (sum, order) => sum + Number(order.total_amount ?? 0),
    0,
  )

  const ordersCount = regularOrders.length

  const { data: inserted, error: insertError } = await supabase
    .from('daily_cash_closures')
    .insert({
      business_id: business.id,
      closure_date: todayDate,
      total_amount: Number(totalAmount.toFixed(2)),
      orders_count: ordersCount,
      closed_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (insertError) {
    return { data: null, error: insertError.message }
  }

  const fiveDaysAgo = new Date()
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)

  await supabase
    .from('daily_cash_closures')
    .delete()
    .eq('business_id', business.id)
    .lt('closed_at', fiveDaysAgo.toISOString())

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/revenue')
  revalidatePath('/dashboard', 'layout')

  return {
    data: inserted as DailyCashClosure,
    error: null,
  }
}