import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Topbar } from '@/components/dashboard/topbar'
import {
  getCurrentBusiness,
  isCurrentUserSuperAdmin,
} from '@/lib/actions/business.actions'
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

  const cookieStore = await cookies()
  const adminSelectedBusinessId = cookieStore.get('admin_business_id')?.value
  const isSuperAdmin = await isCurrentUserSuperAdmin()
  const isAdminViewing = Boolean(isSuperAdmin && adminSelectedBusinessId)

  return (
    <div className="flex min-h-screen bg-[#f6f3ee]">
      <Sidebar
        isAdminViewing={isAdminViewing}
        adminBusinessName={isAdminViewing ? business.name : null}
      />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar
          isAdminViewing={isAdminViewing}
          adminBusinessName={isAdminViewing ? business.name : null}
        />
        <main className="flex-1 px-3 py-4 sm:px-4 sm:py-5 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}