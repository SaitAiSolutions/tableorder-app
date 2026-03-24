import { createClient } from '@/lib/supabase/server'

export async function Topbar() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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
    </header>
  )
}