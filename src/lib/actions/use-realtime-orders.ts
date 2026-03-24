// Path: src/hooks/use-realtime-orders.ts
'use client'

import { useEffect, useReducer, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Order, OrderWithItems } from '@/types/database.types'

// ---------------------------------------------------------------------------
// useRealtimeOrders
//
// Subscribes to INSERT and UPDATE events on the orders table for a given
// business. Maintains state in a useReducer so updates are merged by ID —
// a status change updates the existing card in-place rather than jumping it
// to the top of the list.
//
// Starts from `initialOrders` which were server-rendered — no loading flash.
// New INSERT events prepend the order with an empty order_items array; the
// dashboard displays what it has immediately and the items appear on the next
// full data load or navigation.
// ---------------------------------------------------------------------------

interface State {
  orders: OrderWithItems[]
}

type Action = { type: 'UPSERT'; order: Order }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'UPSERT': {
      const idx = state.orders.findIndex((o) => o.id === action.order.id)
      if (idx >= 0) {
        // Status change or total update — preserve nested order_items
        const updated = [...state.orders]
        updated[idx] = { ...updated[idx]!, ...action.order }
        return { orders: updated }
      }
      // Brand-new order — prepend with empty items (realtime payload is flat)
      return {
        orders: [{ ...action.order, order_items: [] }, ...state.orders],
      }
    }
    default:
      return state
  }
}

interface UseRealtimeOrdersOptions {
  businessId:    string
  initialOrders: OrderWithItems[]
}

export function useRealtimeOrders({
  businessId,
  initialOrders,
}: UseRealtimeOrdersOptions) {
  const [state, dispatch] = useReducer(reducer, { orders: initialOrders })

  const upsert = useCallback((order: Order) => {
    dispatch({ type: 'UPSERT', order })
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`business-orders:${businessId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'orders',
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => upsert(payload.new as Order),
      )
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'orders',
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => upsert(payload.new as Order),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [businessId, upsert])

  // Orders grouped by status — consumed by the filter tabs in LiveOrderFeed
  const byStatus = {
    new:       state.orders.filter((o) => o.status === 'new'),
    accepted:  state.orders.filter((o) => o.status === 'accepted'),
    preparing: state.orders.filter((o) => o.status === 'preparing'),
    ready:     state.orders.filter((o) => o.status === 'ready'),
    completed: state.orders.filter((o) => o.status === 'completed'),
    cancelled: state.orders.filter((o) => o.status === 'cancelled'),
  }

  return { orders: state.orders, byStatus }
}

// ---------------------------------------------------------------------------
// useRealtimeTables
//
// Subscribes to ANY change on table_sessions for this business. When a
// session is opened, cleared, or updated, calls router.refresh() which
// re-runs the parent Server Component (getTablesWithSessions) and updates
// the tables grid with fresh server-rendered data.
//
// This keeps the tables page data-correct without maintaining client-side
// session state — the server component is the single source of truth.
// ---------------------------------------------------------------------------

export function useRealtimeTables(businessId: string) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`business-sessions:${businessId}`)
      .on(
        'postgres_changes',
        {
          event:  '*',
          schema: 'public',
          table:  'table_sessions',
          filter: `business_id=eq.${businessId}`,
        },
        () => router.refresh(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [businessId, router])
}