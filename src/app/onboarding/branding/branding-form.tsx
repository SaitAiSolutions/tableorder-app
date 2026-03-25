'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { uploadLogo, updateBusiness } from '@/lib/actions/business.actions'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/input'
import { ErrorMessage } from '@/components/ui/error-message'

interface BrandingFormProps {
  businessId: string
}

export function BrandingForm({ businessId }: BrandingFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [primaryColor, setPrimaryColor] = useState('#1a1a1a')
  const [secondaryColor, setSecondaryColor] = useState('#f5f5f5')
  const [selectedFileName, setSelectedFileName] = useState<string>('')

  function handleSubmit(formData: FormData) {
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      const logoFile = formData.get('logo') as File | null

      if (logoFile && logoFile.size > 0) {
        const uploadResult = await uploadLogo(businessId, formData)

        if (uploadResult.error) {
          setError(uploadResult.error)
          return
        }
      }

      const updateResult = await updateBusiness(businessId, {
        primary_color: primaryColor,
        secondary_color: secondaryColor,
      })

      if (updateResult.error) {
        setError(updateResult.error)
        return
      }

      setSuccess('Η επιχείρηση αποθηκεύτηκε επιτυχώς.')
      router.push('/dashboard')
    })
  }

  return (
    <form action={handleSubmit} className="mt-6 flex flex-col gap-6">
      <ErrorMessage message={error} />

      {success ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      ) : null}

      <Field label="Λογότυπο" htmlFor="logo">
        <div className="rounded-2xl border border-[#e7ddd3] bg-[#fffdfa] p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>

            <div className="flex min-w-0 flex-col gap-1">
              <label
                htmlFor="logo"
                className="inline-flex w-fit cursor-pointer rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Επιλογή αρχείου
              </label>

              <input
                id="logo"
                name="logo"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) =>
                  setSelectedFileName(e.target.files?.[0]?.name ?? '')
                }
              />

              <p className="text-xs text-gray-400">PNG, JPG, WEBP, SVG έως 5 MB</p>

              {selectedFileName ? (
                <p className="truncate text-sm text-gray-700">
                  Επιλεγμένο: {selectedFileName}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Κύριο χρώμα" htmlFor="primary_color">
          <div className="flex items-center gap-2 rounded-2xl border border-[#e7ddd3] bg-[#fffdfa] px-3 py-3">
            <input
              id="primary_color"
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-10 w-10 cursor-pointer rounded border border-gray-200 p-0.5"
            />
            <span className="font-mono text-sm text-gray-600">{primaryColor}</span>
          </div>
        </Field>

        <Field label="Δευτερεύον χρώμα" htmlFor="secondary_color">
          <div className="flex items-center gap-2 rounded-2xl border border-[#e7ddd3] bg-[#fffdfa] px-3 py-3">
            <input
              id="secondary_color"
              type="color"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="h-10 w-10 cursor-pointer rounded border border-gray-200 p-0.5"
            />
            <span className="font-mono text-sm text-gray-600">{secondaryColor}</span>
          </div>
        </Field>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          className="flex-1"
          onClick={() => router.push('/dashboard')}
          disabled={isPending}
        >
          Παράλειψη
        </Button>

        <Button type="submit" loading={isPending} className="flex-1">
          Ολοκλήρωση →
        </Button>
      </div>
    </form>
  )
}