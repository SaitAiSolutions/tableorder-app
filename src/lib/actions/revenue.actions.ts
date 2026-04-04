'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentBusiness } from '@/lib/actions/business.actions'
import type { DailyCashClosure, ServiceRequestType } from '@/types/database.types'

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