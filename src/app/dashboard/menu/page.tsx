import { redirect } from 'next/navigation'
import { getCurrentBusiness } from '@/lib/actions/business.actions'
import {
  autoTranslateMenuToEnglish,
  getCategoriesForDashboard,
  getProductsForDashboard,
} from '@/lib/actions/menu.actions'
import { createStarterMenu } from '@/lib/actions/onboarding.actions'
import { MenuManager } from './menu-manager'
import { StarterMenuActions } from './starter-menu-actions'

type SearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>
  | undefined

function readQueryValue(
  value: string | string[] | undefined,
): string | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

export default async function DashboardMenuPage({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  const resolvedSearchParams =
    searchParams && typeof (searchParams as Promise<unknown>).then === 'function'
      ? await (searchParams as Promise<Record<string, string | string[] | undefined>>)
      : ((searchParams as Record<string, string | string[] | undefined> | undefined) ?? {})

  const createdMessage = readQueryValue(resolvedSearchParams.menu_created)
  const errorMessage = readQueryValue(resolvedSearchParams.menu_error)

  async function handleCreateCoffeeBarMenu() {
    'use server'

    const result = await createStarterMenu('coffee_bar')

    if (result.error) {
      redirect(`/dashboard/menu?menu_error=${encodeURIComponent(result.error)}`)
    }

    const categories = result.data?.categories ?? 0
    const products = result.data?.products ?? 0

    if (categories === 0 && products === 0) {
      redirect(
        `/dashboard/menu?menu_created=${encodeURIComponent(
          'Το starter menu υπάρχει ήδη. Δεν χρειάστηκαν νέες εγγραφές.',
        )}`,
      )
    }

    redirect(
      `/dashboard/menu?menu_created=${encodeURIComponent(
        `Το starter menu δημιουργήθηκε. Νέες κατηγορίες: ${categories}, νέα προϊόντα: ${products}.`,
      )}`,
    )
  }

  async function handleCreateSnackBarMenu() {
    'use server'

    const result = await createStarterMenu('snack_bar')

    if (result.error) {
      redirect(`/dashboard/menu?menu_error=${encodeURIComponent(result.error)}`)
    }

    const categories = result.data?.categories ?? 0
    const products = result.data?.products ?? 0

    if (categories === 0 && products === 0) {
      redirect(
        `/dashboard/menu?menu_created=${encodeURIComponent(
          'Το starter menu υπάρχει ήδη. Δεν χρειάστηκαν νέες εγγραφές.',
        )}`,
      )
    }

    redirect(
      `/dashboard/menu?menu_created=${encodeURIComponent(
        `Το starter menu δημιουργήθηκε. Νέες κατηγορίες: ${categories}, νέα προϊόντα: ${products}.`,
      )}`,
    )
  }

  async function handleAutoTranslateMenu() {
    'use server'

    const result = await autoTranslateMenuToEnglish()

    if (result.error) {
      redirect(`/dashboard/menu?menu_error=${encodeURIComponent(result.error)}`)
    }

    const summary = result.data

    const message = `Ολοκληρώθηκε η αυτόματη μετάφραση. Κατηγορίες: ${summary?.categories ?? 0}, Προϊόντα: ${summary?.products ?? 0}, Περιγραφές: ${summary?.descriptions ?? 0}, Ομάδες επιλογών: ${summary?.optionGroups ?? 0}, Επιλογές: ${summary?.optionChoices ?? 0}.`

    redirect(`/dashboard/menu?menu_created=${encodeURIComponent(message)}`)
  }

  const { data: business } = await getCurrentBusiness()
  if (!business) return null

  const { data: categories } = await getCategoriesForDashboard()
  const { data: products } = await getProductsForDashboard()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8b715d]">
            Menu management
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
            Μενού
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#7b6657]">
            Δημιουργία κατηγοριών, προϊόντων και επιλογών για το customer ordering app.
          </p>
        </div>

        <StarterMenuActions
          onCreateCoffeeBarMenu={handleCreateCoffeeBarMenu}
          onCreateSnackBarMenu={handleCreateSnackBarMenu}
          onAutoTranslateMenu={handleAutoTranslateMenu}
        />
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {createdMessage ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {createdMessage}
        </div>
      ) : null}

      <MenuManager
        businessId={business.id}
        currency={business.currency}
        categories={categories ?? []}
        products={products ?? []}
      />
    </div>
  )
}