'use client'

import Image from 'next/image'
import { useState, useTransition } from 'react'
import type { Business } from '@/types/database.types'
import { updateBusiness, uploadLogo } from '@/lib/actions/business.actions'
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
  const [phone, setPhone] = useState(((business as any).phone ?? '') as string)
  const [openingHours, setOpeningHours] = useState(
    (((business as any).opening_hours ?? '') as string),
  )

  const [selectedFileName, setSelectedFileName] = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(business.logo_url ?? null)

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      setError(null)
      setSuccess(null)

      const logoFile = formData.get('logo') as File | null

      if (logoFile && logoFile.size > 0) {
        const uploadResult = await uploadLogo(business.id, formData)

        if (uploadResult.error) {
          setError(uploadResult.error)
          return
        }

        if (uploadResult.data) {
          setLogoPreview(uploadResult.data)
        }
      }

      const result = await updateBusiness(
        business.id,
        {
          name: (formData.get('name') as string) ?? name,
          phone: (formData.get('phone') as string)?.trim() || null,
          opening_hours: (formData.get('opening_hours') as string)?.trim() || null,
        } as any,
      )

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
          Business settings
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
          Στοιχεία επιχείρησης
        </h3>
        <p className="mt-2 text-sm leading-6 text-[#7b6657]">
          Ενημερώστε τα βασικά στοιχεία της επιχείρησής σας.
        </p>
      </div>

      <form action={handleSubmit} className="space-y-5">
        <ErrorMessage message={error} />

        {success ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        ) : null}

        <Field label="Λογότυπο" htmlFor="logo">
          <div className="rounded-2xl border border-[#e7ddd3] bg-[#fffdfa] p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#e7ddd3] bg-white">
                {logoPreview ? (
                  <Image
                    src={logoPreview}
                    alt="Business logo"
                    width={80}
                    height={80}
                    className="h-full w-full object-contain"
                    unoptimized
                  />
                ) : (
                  <span className="text-xs text-[#8b715d]">No logo</span>
                )}
              </div>

              <div className="flex min-w-0 flex-col gap-2">
                <label
                  htmlFor="logo"
                  className="inline-flex w-fit cursor-pointer rounded-xl border border-[#d9cec3] bg-white px-4 py-2 text-sm font-medium text-[#5f5146] transition hover:bg-[#f6efe8]"
                >
                  Επιλογή εικόνας
                </label>

                <input
                  id="logo"
                  name="logo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    setSelectedFileName(file?.name ?? '')

                    if (file) {
                      const objectUrl = URL.createObjectURL(file)
                      setLogoPreview(objectUrl)
                    }
                  }}
                />

                <p className="text-xs text-[#7b6657]">
                  JPG, PNG, WEBP ή SVG έως 5 MB
                </p>

                {selectedFileName ? (
                  <p className="truncate text-sm text-gray-700">
                    Επιλεγμένο: {selectedFileName}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </Field>

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

        <Field label="Τηλέφωνο επιχείρησης" htmlFor="phone">
          <Input
            id="phone"
            name="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="π.χ. 697 451 9816"
            className="rounded-2xl border-[#e7ddd3] bg-[#fffdfa] py-3"
          />
        </Field>

        <Field label="Ωράριο λειτουργίας" htmlFor="opening_hours">
          <textarea
            id="opening_hours"
            name="opening_hours"
            value={openingHours}
            onChange={(e) => setOpeningHours(e.target.value)}
            placeholder={`π.χ.
Δευτέρα: 09:00 - 17:00
Τρίτη: 09:00 - 17:00
Τετάρτη: 09:00 - 17:00
Πέμπτη: 09:00 - 17:00
Παρασκευή: 09:00 - 17:00
Σάββατο: 10:00 - 15:00
Κυριακή: Κλειστά`}
            rows={8}
            className="w-full rounded-2xl border border-[#e7ddd3] bg-[#fffdfa] px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#c9b29d] focus:ring-2 focus:ring-[#efe4d8]"
          />
        </Field>

        <Field label="Slug" htmlFor="slug">
          <Input
            id="slug"
            value={business.slug}
            disabled
            className="rounded-2xl border-[#e7ddd3] bg-[#f6f1ea] py-3 text-[#9a8b7e]"
          />
        </Field>

        <Button type="submit" loading={isPending} className="rounded-2xl">
          Αποθήκευση
        </Button>
      </form>
    </div>
  )
}