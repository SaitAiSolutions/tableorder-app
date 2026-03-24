import { getCurrentBusiness } from '@/lib/actions/business.actions'
import {
  getCategoriesForDashboard,
  getProductsForDashboard,
} from '@/lib/actions/menu.actions'
import { MenuManager } from './menu-manager'

export default async function DashboardMenuPage() {
  const { data: business } = await getCurrentBusiness()
  if (!business) return null

  const { data: categories } = await getCategoriesForDashboard()
  const { data: products } = await getProductsForDashboard()

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8b715d]">
          Menu management
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
          Μενού
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#7b6657]">
          Δημιουργία κατηγοριών και προϊόντων για το customer ordering app.
        </p>
      </div>

      <MenuManager
        businessId={business.id}
        currency={business.currency}
        categories={categories ?? []}
        products={products ?? []}
      />
    </div>
  )
}