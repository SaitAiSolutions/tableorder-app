import { redirect } from 'next/navigation'
import { Building2, LogIn, ShieldCheck, Table2 } from 'lucide-react'
import {
  adminClearBusinessSelection,
  adminSelectBusiness,
  getAdminBusinesses,
  isCurrentUserSuperAdmin,
} from '@/lib/actions/business.actions'

function getStatusLabel(status?: string | null) {
  if (status === 'trialing') return 'Trial'
  if (status === 'active') return 'Active'
  if (status === 'grace_period') return 'Grace period'
  if (status === 'suspended') return 'Suspended'
  if (status === 'cancelled') return 'Cancelled'
  if (status === 'past_due') return 'Past due'
  if (status === 'unpaid') return 'Unpaid'
  return '—'
}

function getPlanLabel(plan?: string | null) {
  if (plan === 'trial') return 'Trial'
  if (plan === 'starter') return 'Starter'
  if (plan === 'growth') return 'Growth'
  if (plan === 'pro') return 'Pro'
  return '—'
}

export default async function AdminPage() {
  const isSuperAdmin = await isCurrentUserSuperAdmin()

  if (!isSuperAdmin) {
    redirect('/dashboard')
  }

  const { data: businesses, error } = await getAdminBusinesses()

  return (
    <div className="min-h-screen bg-[#f6f3ee] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-[24px] border border-[#ebe5dd] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)] sm:rounded-[28px]">
          <div className="bg-gradient-to-r from-[#1f2937] via-[#2b3442] to-[#7c5c46] px-5 py-7 text-white sm:px-6 sm:py-8 lg:px-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/70">
                  Admin
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Admin Dashboard
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85">
                  Προβολή επιχειρήσεων και γρήγορη είσοδος στο dashboard τους για
                  demo ή support, χωρίς εμφάνιση ευαίσθητων billing details.
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <form action={adminClearBusinessSelection}>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl border border-[#d8cdc1] bg-white px-5 py-3 text-sm font-semibold text-[#5f5146] hover:bg-[#f8f3ee]"
            >
              Καθαρισμός admin επιλογής
            </button>
          </form>

          <a
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-2xl border border-[#d8cdc1] bg-white px-5 py-3 text-sm font-semibold text-[#5f5146] hover:bg-[#f8f3ee]"
          >
            Πήγαινε στο dashboard
          </a>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Σφάλμα φόρτωσης επιχειρήσεων: {error}
          </div>
        ) : null}

        {!businesses || businesses.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[#d8cdc1] bg-white p-12 text-center text-sm text-[#7b6657] shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            Δεν υπάρχουν επιχειρήσεις ακόμα.
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {businesses.map((business) => {
              const looksLikeDemo =
                business.name.toLowerCase().includes('demo') ||
                business.slug.toLowerCase().includes('demo')

              return (
                <div
                  key={business.id}
                  className="rounded-[24px] border border-[#ebe5dd] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-semibold tracking-tight text-gray-900">
                          {business.name}
                        </h3>

                        {looksLikeDemo ? (
                          <span className="rounded-full bg-[#f5efe7] px-3 py-1 text-xs font-medium text-[#7b6657]">
                            Demo
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-2 text-sm text-[#7b6657]">
                        /menu/{business.slug}
                      </p>
                      <p className="mt-1 text-sm text-[#8b715d]">
                        Owner: {business.owner_email || '—'}
                      </p>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5efe7] text-[#7c5c46]">
                      <Building2 className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl bg-[#faf7f2] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-[#8b715d]">
                        Status
                      </p>
                      <p className="mt-2 text-sm font-semibold text-gray-900">
                        {getStatusLabel(business.account_status)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#faf7f2] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-[#8b715d]">
                        Subscription
                      </p>
                      <p className="mt-2 text-sm font-semibold text-gray-900">
                        {getStatusLabel(business.subscription_status)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#faf7f2] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-[#8b715d]">
                        Plan
                      </p>
                      <p className="mt-2 text-sm font-semibold text-gray-900">
                        {getPlanLabel(business.subscription_plan)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#faf7f2] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-[#8b715d]">
                        Τραπέζια
                      </p>
                      <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <Table2 className="h-4 w-4 text-[#8b715d]" />
                        {business.tables_count}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <form
                      action={async () => {
                        'use server'
                        const result = await adminSelectBusiness(business.id)
                        if (!result.error) {
                          redirect('/dashboard')
                        }
                      }}
                    >
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1f2937] px-5 py-3 text-sm font-semibold text-white hover:bg-[#111827]"
                      >
                        <LogIn className="h-4 w-4" />
                        Άνοιγμα dashboard
                      </button>
                    </form>

                    <a
                      href={`/menu/${business.slug}`}
                      className="inline-flex items-center justify-center rounded-2xl border border-[#d8cdc1] bg-white px-5 py-3 text-sm font-semibold text-[#5f5146] hover:bg-[#f8f3ee]"
                    >
                      Άνοιγμα public menu slug
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}