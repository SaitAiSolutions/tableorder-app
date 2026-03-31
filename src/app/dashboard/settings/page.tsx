import { getCurrentBusiness } from '@/lib/actions/business.actions'
import { getTablesWithSessions } from '@/lib/actions/tables.actions'
import { SettingsForm } from './settings-form'
import { TableManager } from './table-manager'
import { PasswordForm } from './password-form'

export default async function DashboardSettingsPage() {
  const { data: business } = await getCurrentBusiness()
  const { data: tables } = await getTablesWithSessions()

  if (!business) return null

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8b715d]">
          Business settings
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
          Ρυθμίσεις
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#7b6657]">
          Διαχείριση στοιχείων επιχείρησης, εμφάνισης, τραπεζιών και κωδικού πρόσβασης.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SettingsForm business={business} />
        <TableManager tables={tables ?? []} businessSlug={business.slug} />
      </div>

      <PasswordForm />
    </div>
  )
}