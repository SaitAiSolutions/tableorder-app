import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Topbar } from '@/components/dashboard/topbar'
import { getCurrentBusiness } from '@/lib/actions/business.actions'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: business } = await getCurrentBusiness()
  if (!business) redirect('/onboarding')

  return (
    <div className="flex min-h-screen bg-[#f6f3ee]">
      <Sidebar />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-3 py-4 sm:px-4 sm:py-5 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}