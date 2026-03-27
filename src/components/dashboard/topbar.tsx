'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home } from 'lucide-react'

export function Topbar() {
  const pathname = usePathname()
  const isDashboardHome = pathname === '/dashboard'

  return (
    <header className="border-b border-[#ebe5dd] bg-[#fcfaf7]/90 backdrop-blur">
      <div className="flex min-h-16 flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 lg:h-20 lg:px-8 lg:py-0">
        <div className="hidden lg:block">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8b715d]">
            Operations
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-gray-900">
            Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-3 sm:ml-auto">
          {!isDashboardHome ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d8cdc1] bg-white px-4 py-2.5 text-sm font-semibold text-[#5f5146] hover:bg-[#f8f3ee]"
            >
              <Home className="h-4 w-4" />
              Αρχική Dashboard
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  )
}