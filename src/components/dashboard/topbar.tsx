import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentBusiness, isCurrentUserSuperAdmin } from '@/lib/actions/business.actions'

export async function Topbar() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: business } = await getCurrentBusiness()
  const isSuperAdmin = await isCurrentUserSuperAdmin()

  const email = user?.email ?? 'Χρήστης'
  const roleLabel = isSuperAdmin ? 'Super Admin' : 'Διαχειριστής'
  const initial = (email?.[0] ?? 'U').toUpperCase()

  return (
    <header className="border-b border-[#ebe5dd] bg-[#fcfaf7]">
      <div className="flex items-center justify-between gap-4 px-3 py-3 sm:px-4 lg:px-8">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8b715d]">
            Operations
          </p>
          <h1 className="truncate text-2xl font-semibold tracking-tight text-gray-900">
            {business?.name ?? 'Dashboard'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-2xl border border-[#e8ddd2] bg-white px-4 py-2.5 shadow-sm sm:block">
            <p className="truncate text-sm font-medium text-gray-900">{email}</p>
            <p className="text-xs text-[#7b6657]">{roleLabel}</p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1f2937] text-sm font-semibold text-white shadow-[0_10px_24px_rgba(31,41,55,0.16)]">
            {initial}
          </div>

          <a
            href="/auth/logout"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d8cdc1] bg-white px-4 py-3 text-sm font-semibold text-[#5f5146] transition hover:bg-[#f8f3ee]"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Αποσύνδεση</span>
          </a>
        </div>
      </div>
    </header>
  )
}