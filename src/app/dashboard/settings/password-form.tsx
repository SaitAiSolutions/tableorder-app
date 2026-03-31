'use client'

import { useActionState, useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { updatePassword } from '@/lib/actions/auth.actions'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { ErrorMessage } from '@/components/ui/error-message'

const initialState = { error: null as string | null }

export function PasswordForm() {
  const [submitted, setSubmitted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [state, action, pending] = useActionState(updatePassword, initialState)

  useEffect(() => {
    if (!pending && submitted && state.error !== null) {
      setSubmitted(false)
    }
  }, [pending, submitted, state.error])

  const success = submitted && !pending && state.error === null

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

      <form
        action={(formData) => {
          setSubmitted(true)
          return action(formData)
        }}
        className="grid gap-5 md:grid-cols-2"
      >
        <div className="md:col-span-2">
          <ErrorMessage message={state.error} />
        </div>

        {success ? (
          <div className="md:col-span-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Ο κωδικός αποθηκεύτηκε επιτυχώς.
          </div>
        ) : null}

        <Field label="Νέος κωδικός" htmlFor="password" required>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              minLength={8}
              placeholder="Τουλάχιστον 8 χαρακτήρες"
              required
              className="rounded-2xl border-[#e7ddd3] bg-[#fffdfa] py-3 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-gray-400 hover:text-gray-700"
              aria-label={showPassword ? 'Απόκρυψη κωδικού' : 'Εμφάνιση κωδικού'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </Field>

        <Field label="Επιβεβαίωση νέου κωδικού" htmlFor="confirm" required>
          <div className="relative">
            <Input
              id="confirm"
              name="confirm"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              minLength={8}
              placeholder="Επαναλάβετε τον κωδικό"
              required
              className="rounded-2xl border-[#e7ddd3] bg-[#fffdfa] py-3 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-gray-400 hover:text-gray-700"
              aria-label={showConfirm ? 'Απόκρυψη κωδικού' : 'Εμφάνιση κωδικού'}
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
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