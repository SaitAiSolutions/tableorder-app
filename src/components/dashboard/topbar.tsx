'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home } from 'lucide-react'

export function Topbar() {
  const pathname = usePathname()
  const isDashboardHome = pathname === '/dashboard'

  if (isDashboardHome) {
    return null
  }

  return (
    <header className="border-b border-[#ebe5dd] bg-[#fcfaf7]/90 backdrop-blur">
      <div className="flex min-h-14 items-center justify-end gap-3 px-3 py-2 sm:px-5 lg:px-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d8cdc1] bg-white px-4 py-2 text-sm font-semibold text-[#5f5146] hover:bg-[#f8f3ee]"
        >
          <Home className="h-4 w-4" />
          Αρχική Dashboard
        </Link>
      </div>
    </header>
  )
}