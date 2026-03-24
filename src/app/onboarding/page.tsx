'use client'

import { useActionState, useState } from 'react'
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

export default function OnboardingPage() {
  const router = useRouter()
  const [name, setName] = useState('')

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

  function toSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 63)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <div className="h-2 w-full rounded-full bg-gray-900" />
            <div className="h-2 w-full rounded-full bg-gray-200" />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Βήμα 1 από 2 — Στοιχεία επιχείρησης
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">
            Δημιουργία επιχείρησης
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Αυτά τα στοιχεία θα εμφανίζονται στους πελάτες σας.
          </p>

          <form action={action} className="mt-6 flex flex-col gap-5">
            <ErrorMessage message={state.error} />

            <Field label="Όνομα επιχείρησης" htmlFor="name" required>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="π.χ. Καφενείο Παπαδόπουλος"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>

            <Field label="URL slug" htmlFor="slug" required>
              <div className="flex items-center gap-0">
                <span className="flex h-10 items-center whitespace-nowrap rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 px-3 text-sm text-gray-500">
                  /menu/
                </span>
                <Input
                  id="slug"
                  name="slug"
                  type="text"
                  className="rounded-l-none"
                  placeholder="kafeneio-papadopoulos"
                  value={toSlug(name)}
                  onChange={() => {}}
                  pattern="[a-z0-9][a-z0-9\-]{1,62}[a-z0-9]"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Μόνο πεζά γράμματα, αριθμοί και παύλες. Δεν αλλάζει εύκολα μετά.
              </p>
            </Field>

            <Field label="Νόμισμα" htmlFor="currency">
              <select
                id="currency"
                name="currency"
                defaultValue="EUR"
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>

            <Button type="submit" loading={pending} className="mt-2 w-full">
              Συνέχεια →
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}