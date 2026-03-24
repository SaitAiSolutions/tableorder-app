'use client'

import { useState, useTransition } from 'react'
import type { Business } from '@/types/database.types'
import { updateBusiness } from '@/lib/actions/business.actions'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { ErrorMessage } from '@/components/ui/error-message'

interface SettingsFormProps {
  business: Business
}

export function SettingsForm({ business }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [name, setName] = useState(business.name ?? '')
  const [primaryColor, setPrimaryColor] = useState(
    business.primary_color ?? '#1a1a1a',
  )
  const [secondaryColor, setSecondaryColor] = useState(
    business.secondary_color ?? '#f5f5f5',
  )

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      setError(null)
      setSuccess(null)

      const result = await updateBusiness(business.id, {
        name: (formData.get('name') as string) ?? name,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      setSuccess('Οι ρυθμίσεις αποθηκεύτηκαν.')
    })
  }

  return (
    <div className="rounded-[24px] border border-[#ebe5dd] bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8b715d]">
          Brand settings
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
          Στοιχεία επιχείρησης
        </h3>
        <p className="mt-2 text-sm leading-6 text-[#7b6657]">
          Ενημερώστε τις βασικές ρυθμίσεις εμφάνισης και τα στοιχεία του brand σας.
        </p>
      </div>

      <form action={handleSubmit} className="space-y-5">
        <ErrorMessage message={error} />
        {success ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        ) : null}

        <Field label="Όνομα επιχείρησης" htmlFor="name" required>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded-2xl border-[#e7ddd3] bg-[#fffdfa] py-3"
          />
        </Field>

        <Field label="Slug" htmlFor="slug">
          <Input
            id="slug"
            value={business.slug}
            disabled
            className="rounded-2xl border-[#ece4da] bg-[#f8f4ef] py-3 text-[#8a7a6d]"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#eee5dc] bg-[#faf7f2] p-4">
            <Field label="Κύριο χρώμα" htmlFor="primary_color">
              <div className="flex items-center gap-3">
                <input
                  id="primary_color"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-12 w-12 rounded-xl border border-[#d8cdc1] bg-white p-1"
                />
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[#8b715d]">
                    Primary
                  </p>
                  <span className="font-mono text-sm text-gray-700">
                    {primaryColor}
                  </span>
                </div>
              </div>
            </Field>
          </div>

          <div className="rounded-2xl border border-[#eee5dc] bg-[#faf7f2] p-4">
            <Field label="Δευτερεύον χρώμα" htmlFor="secondary_color">
              <div className="flex items-center gap-3">
                <input
                  id="secondary_color"
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="h-12 w-12 rounded-xl border border-[#d8cdc1] bg-white p-1"
                />
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[#8b715d]">
                    Secondary
                  </p>
                  <span className="font-mono text-sm text-gray-700">
                    {secondaryColor}
                  </span>
                </div>
              </div>
            </Field>
          </div>
        </div>

        <Button type="submit" loading={isPending} className="rounded-2xl">
          Αποθήκευση
        </Button>
      </form>
    </div>
  )
}