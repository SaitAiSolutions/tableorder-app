'use client'

import { useActionState, useEffect, useState } from 'react'
import { updateAccountEmail } from '@/lib/actions/account.actions'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { ErrorMessage } from '@/components/ui/error-message'

const initialState = { error: null as string | null }

interface EmailFormProps {
  currentEmail: string
}

export function EmailForm({ currentEmail }: EmailFormProps) {
  const [submitted, setSubmitted] = useState(false)
  const [emailValue, setEmailValue] = useState('')
  const [state, action, pending] = useActionState(updateAccountEmail, initialState)

  useEffect(() => {
    if (!pending && submitted && state.error !== null) {
      setSubmitted(false)
    }
  }, [pending, submitted, state.error])

  const success = submitted && !pending && state.error === null
  const normalizedCurrentEmail = currentEmail.trim().toLowerCase()
  const normalizedNewEmail = emailValue.trim().toLowerCase()

  const sameEmail =
    normalizedNewEmail.length > 0 && normalizedNewEmail === normalizedCurrentEmail

  return (
    <div className="rounded-[24px] border border-[#ebe5dd] bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8b715d]">
          Account
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
          Αλλαγή email
        </h3>
        <p className="mt-2 text-sm leading-6 text-[#7b6657]">
          Μπορείτε να αλλάξετε το email σύνδεσης του λογαριασμού σας. Θα σταλεί
          επιβεβαίωση στο νέο email.
        </p>
      </div>

      <form
        action={(formData) => {
          if (sameEmail) return
          setSubmitted(true)
          return action(formData)
        }}
        className="grid gap-5"
      >
        <ErrorMessage message={state.error} />

        {success ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Στάλθηκε email επιβεβαίωσης στη νέα διεύθυνση. Μετά την επιβεβαίωση,
            θα μπορείτε να συνδέεστε με το νέο email.
          </div>
        ) : null}

        <Field label="Τρέχον email" htmlFor="current_email">
          <Input
            id="current_email"
            value={currentEmail}
            disabled
            className="rounded-2xl border-[#e7ddd3] bg-[#f8f5f1] py-3 text-gray-500"
          />
        </Field>

        <Field label="Νέο email" htmlFor="new_email" required>
          <Input
            id="new_email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="π.χ. new@email.com"
            required
            className="rounded-2xl border-[#e7ddd3] bg-[#fffdfa] py-3"
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
          />
        </Field>

        {sameEmail ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Το νέο email είναι ίδιο με το τρέχον.
          </div>
        ) : null}

        <div>
          <Button
            type="submit"
            loading={pending}
            className="rounded-2xl"
            disabled={sameEmail || !emailValue.trim()}
          >
            Αποθήκευση νέου email
          </Button>
        </div>
      </form>
    </div>
  )
}