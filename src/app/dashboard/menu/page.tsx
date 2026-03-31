import { redirect } from 'next/navigation'
import { getCurrentBusiness } from '@/lib/actions/business.actions'
import { createStarterMenu } from '@/lib/actions/onboarding.actions'
import {
  autoTranslateMenuToEnglish,
  getCategoriesForDashboard,
  getProductsForDashboard,
} from '@/lib/actions/menu.actions'
import { MenuManager } from './menu-manager'

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

      <div className="rounded-[24px] border border-[#ebe5dd] bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8b715d]">
              Starter menu
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
              Δημιούργησε έτοιμο starter menu
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7b6657]">
              Αν δεν θέλεις να ξεκινήσεις από άδειο μενού, μπορείς να περάσεις
              αυτόματα ένα βασικό template και μετά να το προσαρμόσεις όπως θέλεις.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <form action={handleCreateCoffeeBarMenu}>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-[#1f2937] px-5 py-3 text-sm font-semibold text-white hover:bg-[#111827]"
              >
                Starter menu για coffee bar
              </button>
            </form>

            <form action={handleCreateSnackBarMenu}>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-[#d8cdc1] bg-white px-5 py-3 text-sm font-semibold text-[#5f5146] hover:bg-[#f8f3ee]"
              >
                Starter menu για snack bar
              </button>
            </form>

            <form action={handleAutoTranslateMenu}>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-[#d8cdc1] bg-white px-5 py-3 text-sm font-semibold text-[#5f5146] hover:bg-[#f8f3ee]"
              >
                Αυτόματη μετάφραση menu στα Αγγλικά
              </button>
            </form>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {createdMessage ? (
          <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {createdMessage}
          </div>
        ) : null}
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