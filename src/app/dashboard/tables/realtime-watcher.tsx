'use client'

import { useRealtimeTables } from '@/hooks/use-realtime-orders'
import type { TableWithActiveSession } from '@/types/database.types'

interface RealtimeWatcherProps {
  initialTables: TableWithActiveSession[]
}

export function RealtimeWatcher({ initialTables }: RealtimeWatcherProps) {
  useRealtimeTables(initialTables)
  return null
}