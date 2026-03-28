import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

interface TopbarProps {
  isAdminViewing?: boolean
  adminBusinessName?: string | null
}

export async function Topbar({
  isAdminViewing = false,
  adminBusinessName = null,
}: TopbarProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header className="border-b border-[#ebe5dd] bg-[#fcfaf7]/90 backdrop-blur">
      <div className="flex min-h-16 flex-col gap-3 px-3 py-3 sm:px-5 lg:min-h-20 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="hidden lg:block">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8b715d]">
              Operations
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-gray-900">
              Dashboard
            </h1>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#ebe5dd] bg-white px-3 py-2 shadow-sm sm:ml-auto">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">
                {user?.email ?? 'Owner'}
              </p>
              <p className="text-xs text-[#7b6657]">Διαχειριστής</p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1f2937] text-sm font-semibold text-white">
              {(user?.email?.[0] ?? 'O').toUpperCase()}
            </div>
          </div>
        </div>

        {isAdminViewing ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-blue-700">
                Admin mode
              </p>
              <p className="mt-1 text-sm text-gray-900">
                Προβάλλετε την επιχείρηση{' '}
                <span className="font-semibold">
                  {adminBusinessName ?? 'επιλεγμένη επιχείρηση'}
                </span>{' '}
                ως admin.
              </p>
            </div>

            <Link
              href="/admin"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1f2937] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#111827]"
            >
              <ArrowLeft className="h-4 w-4" />
              Επιστροφή στο Admin
            </Link>
          </div>
        ) : null}
      </div>
    </header>
  )
}