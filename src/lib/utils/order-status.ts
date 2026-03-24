import type { OrderStatus } from '@/types/database.types'

interface StatusMeta {
  label_el: string
  label_en: string
  badge: string
  next: OrderStatus | null
  action_el: string | null
}

export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  new: {
    label_el: 'Νέα',
    label_en: 'New',
    badge: 'bg-blue-100 text-blue-800',
    next: 'accepted',
    action_el: 'Αποδοχή',
  },
  accepted: {
    label_el: 'Αποδεκτή',
    label_en: 'Accepted',
    badge: 'bg-yellow-100 text-yellow-800',
    next: 'preparing',
    action_el: 'Έναρξη προετοιμασίας',
  },
  preparing: {
    label_el: 'Σε προετοιμασία',
    label_en: 'Preparing',
    badge: 'bg-orange-100 text-orange-800',
    next: 'ready',
    action_el: 'Έτοιμη',
  },
  ready: {
    label_el: 'Έτοιμη',
    label_en: 'Ready',
    badge: 'bg-green-100 text-green-800',
    next: 'completed',
    action_el: 'Ολοκλήρωση',
  },
  completed: {
    label_el: 'Ολοκληρωμένη',
    label_en: 'Completed',
    badge: 'bg-gray-100 text-gray-600',
    next: null,
    action_el: null,
  },
  cancelled: {
    label_el: 'Ακυρωμένη',
    label_en: 'Cancelled',
    badge: 'bg-red-100 text-red-700',
    next: null,
    action_el: null,
  },
}

export function getStatusMeta(status: OrderStatus): StatusMeta {
  return ORDER_STATUS_META[status]
}