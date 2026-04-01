'use client'

import Image from 'next/image'
import { useMemo, useState, useTransition } from 'react'
import type { Business } from '@/types/database.types'
import { updateBusiness, uploadLogo } from '@/lib/actions/business.actions'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { ErrorMessage } from '@/components/ui/error-message'

interface SettingsFormProps {
  business: Business
}

type DayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

type DaySchedule = {
  dayLabel: string
  closed: boolean
  open: string
  close: string
}

type WeeklySchedule = Record<DayKey, DaySchedule>

const DAY_CONFIG: Array<{ key: DayKey; label: string }> = [
  { key: 'monday', label: 'Δευτέρα' },
  { key: 'tuesday', label: 'Τρίτη' },
  { key: 'wednesday', label: 'Τετάρτη' },
  { key: 'thursday', label: 'Πέμπτη' },
  { key: 'friday', label: 'Παρασκευή' },
  { key: 'saturday', label: 'Σάββατο' },
  { key: 'sunday', label: 'Κυριακή' },
]

function createDefaultSchedule(): WeeklySchedule {
  return {
    monday: { dayLabel: 'Δευτέρα', closed: false, open: '09:00', close: '17:00' },
    tuesday: { dayLabel: 'Τρίτη', closed: false, open: '09:00', close: '17:00' },
    wednesday: { dayLabel: 'Τετάρτη', closed: false, open: '09:00', close: '17:00' },
    thursday: { dayLabel: 'Πέμπτη', closed: false, open: '09:00', close: '17:00' },
    friday: { dayLabel: 'Παρασκευή', closed: false, open: '09:00', close: '17:00' },
    saturday: { dayLabel: 'Σάββατο', closed: false, open: '10:00', close: '15:00' },
    sunday: { dayLabel: 'Κυριακή', closed: true, open: '09:00', close: '17:00' },
  }
}

function parseOpeningHours(rawValue?: string | null): WeeklySchedule {
  const schedule = createDefaultSchedule()
  const raw = String(rawValue ?? '').trim()

  if (!raw) return schedule

  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  for (const line of lines) {
    const [rawDay, rawValuePart] = line.split(':').map((part) => part.trim())

    if (!rawDay || !rawValuePart) continue

    const normalizedDay = rawDay.toLowerCase()

    const matchedDay = DAY_CONFIG.find(
      (day) => day.label.toLowerCase() === normalizedDay,
    )

    if (!matchedDay) continue

    if (rawValuePart.toLowerCase() === 'κλειστά') {
      schedule[matchedDay.key] = {
        ...schedule[matchedDay.key],
        closed: true,
      }
      continue
    }

    const rangeMatch = rawValuePart.match(/^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/)

    if (!rangeMatch) continue

    schedule[matchedDay.key] = {
      ...schedule[matchedDay.key],
      closed: false,
      open: rangeMatch[1],
      close: rangeMatch[2],
    }
  }

  return schedule
}

function buildOpeningHoursText(schedule: WeeklySchedule) {
  return DAY_CONFIG.map(({ key, label }) => {
    const day = schedule[key]

    if (day.closed) {
      return `${label}: Κλειστά`
    }

    return `${label}: ${day.open} - ${day.close}`
  }).join('\n')
}

function generateTimeOptions() {
  const times: string[] = []

  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += 30) {
      const hh = String(hour).padStart(2, '0')
      const mm = String(minute).padStart(2, '0')
      times.push(`${hh}:${mm}`)
    }
  }

  return times
}

export function SettingsForm({ business }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [name, setName] = useState(business.name ?? '')
  const [phone, setPhone] = useState(((business as any).phone ?? '') as string)
  const [schedule, setSchedule] = useState<WeeklySchedule>(
    parseOpeningHours(((business as any).opening_hours ?? '') as string),
  )

  const [selectedFileName, setSelectedFileName] = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(business.logo_url ?? null)

  const timeOptions = useMemo(() => generateTimeOptions(), [])

  function updateDay<K extends keyof DaySchedule>(
    dayKey: DayKey,
    field: K,
    value: DaySchedule[K],
  ) {
    setSchedule((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: value,
      },
    }))
  }

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

      const openingHoursText = buildOpeningHoursText(schedule)

      const result = await updateBusiness(
        business.id,
        {
          name: (formData.get('name') as string) ?? name,
          phone: (formData.get('phone') as string)?.trim() || null,
          opening_hours: openingHoursText,
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

        <Field label="Ωράριο λειτουργίας" htmlFor="opening-hours-ui">
          <div className="space-y-3 rounded-2xl border border-[#e7ddd3] bg-[#fffdfa] p-4">
            {DAY_CONFIG.map(({ key, label }) => {
              const day = schedule[key]

              return (
                <div
                  key={key}
                  className="grid gap-3 rounded-2xl border border-[#efe7de] bg-white p-3 md:grid-cols-[140px_1fr_1fr_auto]"
                >
                  <div className="flex items-center font-medium text-gray-900">
                    {label}
                  </div>

                  <select
                    value={day.open}
                    onChange={(e) => updateDay(key, 'open', e.target.value)}
                    disabled={day.closed}
                    className="h-11 rounded-2xl border border-[#e7ddd3] bg-[#fffdfa] px-4 text-sm text-gray-900 disabled:cursor-not-allowed disabled:bg-[#f4efe8] disabled:text-[#9a8b7e]"
                  >
                    {timeOptions.map((time) => (
                      <option key={`${key}-open-${time}`} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>

                  <select
                    value={day.close}
                    onChange={(e) => updateDay(key, 'close', e.target.value)}
                    disabled={day.closed}
                    className="h-11 rounded-2xl border border-[#e7ddd3] bg-[#fffdfa] px-4 text-sm text-gray-900 disabled:cursor-not-allowed disabled:bg-[#f4efe8] disabled:text-[#9a8b7e]"
                  >
                    {timeOptions.map((time) => (
                      <option key={`${key}-close-${time}`} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>

                  <label className="flex items-center gap-2 rounded-2xl border border-[#e7ddd3] bg-[#faf7f2] px-4 py-3 text-sm text-[#5f5146]">
                    <input
                      type="checkbox"
                      checked={day.closed}
                      onChange={(e) => updateDay(key, 'closed', e.target.checked)}
                    />
                    Κλειστά
                  </label>
                </div>
              )
            })}
          </div>
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