'use client'

import { useEffect, useReducer, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { OrderWithItems, TableWithActiveSession } from '@/types/database.types'

type OrdersAction =
  | { type: 'reset'; payload: OrderWithItems[] }
  | { type: 'upsert'; payload: OrderWithItems }

function ordersReducer(state: OrderWithItems[], action: OrdersAction): OrderWithItems[] {
  switch (action.type) {
    case 'reset':
      return action.payload
    case 'upsert': {
      const existingIndex = state.findIndex((o) => o.id === action.payload.id)

      if (existingIndex === -1) {
        return [action.payload, ...state]
      }

      const next = [...state]
      next[existingIndex] = action.payload
      return next
    }
    default:
      return state
  }
}

export function useRealtimeOrders(initialOrders: OrderWithItems[]) {
  const [orders, dispatch] = useReducer(ordersReducer, initialOrders)
  const router = useRouter()

  const refresh = useCallback(() => {
    router.refresh()
  }, [router])

  useEffect(() => {
    dispatch({ type: 'reset', payload: initialOrders })
  }, [initialOrders])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('orders-live-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => refresh(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        () => refresh(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_item_options' },
        () => refresh(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tables' },
        () => refresh(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refresh])

  return { orders, dispatch }
}

export function useRealtimeTables(_initialTables: TableWithActiveSession[]) {
  const router = useRouter()

  const refresh = useCallback(() => {
    router.refresh()
  }, [router])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => refresh(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'table_sessions' },
        () => refresh(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tables' },
        () => refresh(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refresh])
}