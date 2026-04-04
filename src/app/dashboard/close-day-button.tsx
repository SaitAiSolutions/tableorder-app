'use client'

import { useState, useTransition } from 'react'
import { closeBusinessDay } from '@/lib/actions/revenue.actions'
import { Button } from '@/components/ui/button'
import { ErrorMessage } from '@/components/ui/error-message'

export function CloseDayButton() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function handleCloseDay() {
    const confirmed = window.confirm(
      'Θέλετε σίγουρα να κάνετε κλείσιμο ημέρας; Το σημερινό σύνολο θα αποθηκευτεί στις Εισπράξεις.',
    )

    if (!confirmed) return

    startTransition(async () => {
      setError(null)
      setSuccess(null)

      const result = await closeBusinessDay()

      if (result.error) {
        setError(result.error)
        return
      }

      setSuccess('Το κλείσιμο ημέρας ολοκληρώθηκε.')
    })
  }

  return (
    <div className="space-y-3">
      <ErrorMessage message={error} />

      {success ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      ) : null}

      <Button
        type="button"
        className="rounded-2xl"
        loading={isPending}
        onClick={handleCloseDay}
      >
        Κλείσιμο Ημέρας
      </Button>
    </div>
  )
}