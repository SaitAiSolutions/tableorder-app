'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutGrid,
  ClipboardList,
  UtensilsCrossed,
  Settings,
  Table2,
  CreditCard,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const items = [
  { href: '/dashboard', label: 'Πίνακας Ελέγχου', icon: LayoutGrid },
  { href: '/dashboard/orders', label: 'Παραγγελίες', icon: ClipboardList },
  { href: '/dashboard/menu', label: 'Μενού', icon: UtensilsCrossed },
  { href: '/dashboard/tables', label: 'Τραπέζια', icon: Table2 },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { href: '/dashboard/settings', label: 'Ρυθμίσεις', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <>
      <aside className="hidden w-72 shrink-0 border-r border-[#ebe5dd] bg-[#fcfaf7] lg:flex lg:flex-col">
        <div className="border-b border-[#ebe5dd] px-6 py-6">
          <div className="rounded-3xl bg-gradient-to-br from-[#1f2937] via-[#263244] to-[#7c5c46] p-5 text-white shadow-[0_12px_30px_rgba(15,23,42,0.14)]">
            <p className="text-xs uppercase tracking-[0.18em] text-white/75">
              TableOrder
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Owner Dashboard
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/80">
              Διαχειριστείτε παραγγελίες, τραπέζια και το ψηφιακό σας μενού.
            </p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-2 p-4">
          {items.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all',
                  active
                    ? 'bg-[#1f2937] text-white shadow-[0_10px_24px_rgba(31,41,55,0.16)]'
                    : 'text-[#5e5349] hover:bg-[#f4ede5] hover:text-[#1f2937]',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="border-b border-[#ebe5dd] bg-[#fcfaf7] px-3 py-3 lg:hidden">
        <div className="mb-3 rounded-3xl bg-gradient-to-br from-[#1f2937] via-[#263244] to-[#7c5c46] p-4 text-white shadow-[0_10px_24px_rgba(15,23,42,0.12)]">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/75">
            TableOrder
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">
            Owner Dashboard
          </h2>
        </div>

        <nav className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
          {items.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all',
                  active
                    ? 'bg-[#1f2937] text-white shadow-[0_10px_20px_rgba(31,41,55,0.14)]'
                    : 'border border-[#e8ddd2] bg-white text-[#5e5349]',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}