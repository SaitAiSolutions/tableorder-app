'use client'

import { useActionState, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBusiness } from '@/lib/actions/business.actions'
import { Button } from '@/components/ui/button'
import { Input, Field } from '@/components/ui/input'
import { ErrorMessage } from '@/components/ui/error-message'

type BusinessCreateState = {
  data: { id: string; slug: string } | null
  error: string | null
}

const initialState: BusinessCreateState = {
  data: null,
  error: null,
}

const CURRENCIES = [
  { value: 'EUR', label: 'EUR — Ευρώ (€)' },
  { value: 'GBP', label: 'GBP — Λίρα Αγγλίας (£)' },
  { value: 'USD', label: 'USD — Δολάριο ΗΠΑ ($)' },
]

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63)
}

export default function OnboardingPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const generatedSlug = useMemo(() => toSlug(name), [name])

  const [state, action, pending] = useActionState(
    async (
      _prevState: BusinessCreateState,
      formData: FormData,
    ): Promise<BusinessCreateState> => {
      const result = await createBusiness(formData)

      if (!result.error && result.data) {
        router.push('/onboarding/branding')
      }

      return result
    },
    initialState,
  )

  return (
    <div className="min-h-screen bg-[#f6f3ee] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[28px] border border-[#ebe5dd] bg-white p-8 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <div className="inline-flex rounded-full bg-[#f3ece4] px-4 py-1.5 text-sm font-medium text-[#7b6657]">
            Onboarding
          </div>

          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-gray-900">
            Στήσε την επιχείρησή σου
          </h1>

          <p className="mt-4 text-base leading-7 text-[#6f6156]">
            Ξεκίνα το TableOrder σε λίγα λεπτά. Πρώτα δημιουργείς την επιχείρησή
            σου και μετά συνεχίζεις με εμφάνιση, τραπέζια και menu.
          </p>

          <div className="mt-8 space-y-4">
            <div className="rounded-2xl border border-[#e8ddd2] bg-[#fcfaf7] p-4">
              <p className="text-sm font-semibold text-gray-900">Βήμα 1</p>
              <p className="mt-1 text-sm text-[#7b6657]">
                Όνομα επιχείρησης, slug και νόμισμα.
              </p>
            </div>

            <div className="rounded-2xl border border-[#e8ddd2] bg-[#fcfaf7] p-4 opacity-80">
              <p className="text-sm font-semibold text-gray-900">Βήμα 2</p>
              <p className="mt-1 text-sm text-[#7b6657]">
                Logo και χρώματα για το customer menu.
              </p>
            </div>

            <div className="rounded-2xl border border-[#e8ddd2] bg-[#fcfaf7] p-4 opacity-80">
              <p className="text-sm font-semibold text-gray-900">Βήμα 3</p>
              <p className="mt-1 text-sm text-[#7b6657]">
                Quick setup για τραπέζια, menu και dashboard.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-[#ebe5dd] bg-white p-8 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <div className="mb-8">
            <div className="flex items-center gap-2">
              <div className="h-2 w-full rounded-full bg-[#1f2937]" />
              <div className="h-2 w-full rounded-full bg-[#e7ddd3]" />
              <div className="h-2 w-full rounded-full bg-[#e7ddd3]" />
            </div>
            <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-[#8b715d]">
              Βήμα 1 από 3 — Στοιχεία επιχείρησης
            </p>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
            Δημιουργία επιχείρησης
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#7b6657]">
            Αυτά τα στοιχεία θα χρησιμοποιηθούν στο dashboard και στο menu link.
          </p>

          <form action={action} className="mt-8 flex flex-col gap-5">
            <ErrorMessage message={state.error} />

            <Field label="Όνομα επιχείρησης" htmlFor="name" required>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="π.χ. Cafe Rethymno"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="rounded-2xl border-[#e7ddd3] bg-[#fffdfa] py-3"
              />
            </Field>

            <Field label="URL slug" htmlFor="slug" required>
              <div className="flex items-center">
                <span className="flex h-12 items-center whitespace-nowrap rounded-l-2xl border border-r-0 border-[#e7ddd3] bg-[#f8f3ee] px-4 text-sm text-[#7b6657]">
                  /menu/
                </span>
                <Input
                  id="slug"
                  name="slug"
                  type="text"
                  className="rounded-l-none rounded-r-2xl border-[#e7ddd3] bg-[#fffdfa] py-3"
                  placeholder="cafe-rethymno"
                  value={generatedSlug}
                  onChange={() => {}}
                  pattern="[a-z0-9][a-z0-9\-]{1,62}[a-z0-9]"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-[#8b715d]">
                Μόνο πεζά γράμματα, αριθμοί και παύλες.
              </p>
            </Field>

            <Field label="Νόμισμα" htmlFor="currency">
              <select
                id="currency"
                name="currency"
                defaultValue="EUR"
                className="h-12 w-full rounded-2xl border border-[#e7ddd3] bg-[#fffdfa] px-4 text-sm text-gray-900 focus:border-[#c9b29d] focus:outline-none focus:ring-2 focus:ring-[#efe4d8]"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>

            <Button type="submit" loading={pending} className="mt-2 w-full rounded-2xl">
              Συνέχεια στο branding
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}