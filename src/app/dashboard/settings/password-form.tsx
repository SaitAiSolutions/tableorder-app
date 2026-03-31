'use client'

import { useActionState } from 'react'
import { updatePassword } from '@/lib/actions/auth.actions'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { ErrorMessage } from '@/components/ui/error-message'

const initialState = { error: null as string | null }

export function PasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, initialState)
  const success = !pending && state.error === null

  return (
    <div className="rounded-[24px] border border-[#ebe5dd] bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8b715d]">
          Security
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
          Αλλαγή κωδικού
        </h3>
        <p className="mt-2 text-sm leading-6 text-[#7b6657]">
          Μπορείτε να αλλάξετε τον κωδικό πρόσβασής σας οποιαδήποτε στιγμή.
        </p>
      </div>

      <form action={action} className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <ErrorMessage message={state.error} />
        </div>

        {success ? (
          <div className="md:col-span-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Ο κωδικός αποθηκεύτηκε επιτυχώς.
          </div>
        ) : null}

        <Field label="Νέος κωδικός" htmlFor="password" required>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            placeholder="Τουλάχιστον 8 χαρακτήρες"
            required
            className="rounded-2xl border-[#e7ddd3] bg-[#fffdfa] py-3"
          />
        </Field>

        <Field label="Επιβεβαίωση νέου κωδικού" htmlFor="confirm" required>
          <Input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            minLength={8}
            placeholder="Επαναλάβετε τον κωδικό"
            required
            className="rounded-2xl border-[#e7ddd3] bg-[#fffdfa] py-3"
          />
        </Field>

        <div className="md:col-span-2">
          <Button type="submit" loading={pending} className="rounded-2xl">
            Αποθήκευση νέου κωδικού
          </Button>
        </div>
      </form>
    </div>
  )
}