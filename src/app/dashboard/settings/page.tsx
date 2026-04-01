import { getCurrentBusiness } from '@/lib/actions/business.actions'
import { getTablesWithSessions } from '@/lib/actions/tables.actions'
import { getPrinterSettingsForBusiness } from '@/lib/actions/printer.actions'
import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from './settings-form'
import { TableManager } from './table-manager'
import { PasswordForm } from './password-form'
import { PrinterSettingsForm } from './printer-settings-form'
import { EmailForm } from './email-form'

export default async function DashboardSettingsPage() {
  const { data: business } = await getCurrentBusiness()
  const { data: tables } = await getTablesWithSessions()
  const { data: printerSettings } = await getPrinterSettingsForBusiness()
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

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
          Διαχείριση στοιχείων επιχείρησης, εμφάνισης, τραπεζιών, λογαριασμού και εκτυπωτή.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SettingsForm business={business} />
        <TableManager tables={tables ?? []} businessSlug={business.slug} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <EmailForm currentEmail={user?.email ?? ''} />
        <PasswordForm />
      </div>

      <PrinterSettingsForm printerSettings={printerSettings ?? null} />
    </div>
  )
}